import logging
from datetime import date, datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from backend.app.models.student import Student
from backend.app.models.subject import Subject
from backend.app.models.workspace import StudentSubject
from backend.app.models.material import AcademicMaterial
from backend.app.models.unit import Unit
from backend.app.models.topic import Topic, SyllabusTopic
from backend.app.models.prerequisite import Prerequisite
from backend.app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceOverviewResponse,
    KnowledgeMapResponse,
    KnowledgeMapUnitNode,
    KnowledgeMapTopicNode
)
from backend.app.services.knowledge_service import KnowledgeService

logger = logging.getLogger("learnloop.workspace")

class WorkspaceService:
    @staticmethod
    def create_workspace(db: Session, data: WorkspaceCreate) -> StudentSubject:
        # 1. Create or retrieve student
        student = db.query(Student).filter(Student.name == data.student_name).first()
        if not student:
            student = Student(name=data.student_name)
            db.add(student)
            db.flush()

        # 2. Get or create subject
        subject = KnowledgeService.get_or_create_subject(db, data.subject_id, data.subject_name)

        # 3. Create StudentSubject (Study Workspace)
        workspace = StudentSubject(
            student_id=student.id,
            subject_id=subject.id,
            goal=data.goal,
            exam_date=data.exam_date
        )
        db.add(workspace)
        db.flush()

        # 4. Populate Units and Syllabus Topics
        for u_idx, unit_input in enumerate(data.units):
            unit = Unit(
                student_subject_id=workspace.id,
                name=unit_input.name,
                order_index=unit_input.order_index if unit_input.order_index is not None else u_idx
            )
            db.add(unit)
            db.flush()

            for t_idx, topic_name in enumerate(unit_input.topics):
                if not topic_name or not topic_name.strip():
                    continue
                # Match canonical or create custom topic for this subject
                topic = KnowledgeService.match_or_create_topic(
                    db=db,
                    subject_id=subject.id,
                    topic_name=topic_name.strip()
                )
                # Link in syllabus_topics
                st = SyllabusTopic(
                    unit_id=unit.id,
                    topic_id=topic.id,
                    order_index=t_idx
                )
                db.add(st)

        # 5. Link any pre-uploaded materials if given
        if data.material_ids:
            materials = db.query(AcademicMaterial).filter(AcademicMaterial.id.in_(data.material_ids)).all()
            for mat in materials:
                mat.student_subject_id = workspace.id

        db.commit()
        db.refresh(workspace)
        logger.info(f"Created workspace {workspace.id} for student '{student.name}' on '{subject.name}'")
        return workspace

    @staticmethod
    def get_workspace_by_id(db: Session, workspace_id: str) -> Optional[StudentSubject]:
        return db.query(StudentSubject).filter(StudentSubject.id == workspace_id).first()

    @staticmethod
    def get_workspace_overview(db: Session, workspace_id: str) -> Optional[WorkspaceOverviewResponse]:
        ws = db.query(StudentSubject).options(
            joinedload(StudentSubject.student),
            joinedload(StudentSubject.subject),
            joinedload(StudentSubject.units).joinedload(Unit.syllabus_topics),
            joinedload(StudentSubject.materials)
        ).filter(StudentSubject.id == workspace_id).first()

        if not ws:
            return None

        # Calculate days remaining
        days_remaining = None
        if ws.exam_date:
            today = date.today()
            delta = (ws.exam_date - today).days
            days_remaining = max(0, delta)

        # Count units and topics
        total_units = len(ws.units)
        topic_ids = set()
        for u in ws.units:
            for st in u.syllabus_topics:
                topic_ids.add(st.topic_id)
        total_topics = len(topic_ids)
        total_materials = len(ws.materials)

        return WorkspaceOverviewResponse(
            id=ws.id,
            student_id=ws.student.id,
            student_name=ws.student.name,
            subject_id=ws.subject.id,
            subject_name=ws.subject.name,
            goal=ws.goal,
            exam_date=ws.exam_date,
            days_remaining=days_remaining,
            total_units=total_units,
            total_topics=total_topics,
            total_materials=total_materials,
            created_at=ws.created_at
        )

    @staticmethod
    def get_knowledge_map(db: Session, workspace_id: str) -> Optional[KnowledgeMapResponse]:
        ws = db.query(StudentSubject).filter(StudentSubject.id == workspace_id).first()
        if not ws:
            return None

        units = db.query(Unit).filter(Unit.student_subject_id == workspace_id).order_by(Unit.order_index.asc()).all()
        
        unit_nodes: List[KnowledgeMapUnitNode] = []
        total_topics_count = 0

        # Fetch topic masteries for this workspace
        from backend.app.models.mastery import TopicMastery
        from backend.app.schemas.workspace import TopicMasteryNode
        masteries = db.query(TopicMastery).filter(TopicMastery.student_subject_id == workspace_id).all()
        mastery_map = {m.topic_id: m for m in masteries}

        def build_mastery_node(topic, m) -> Optional["TopicMasteryNode"]:
            if not m:
                return None
            return TopicMasteryNode(
                topic_id=topic.id,
                topic_name=topic.name,
                understanding_score=m.understanding_score,
                status=m.status,
                evidence_count=m.evidence_count,
                correct_answers=m.correct_answers,
                incorrect_answers=m.incorrect_answers,
                last_assessed_at=m.last_assessed_at
            )

        for unit in units:
            syllabus_topics = db.query(SyllabusTopic).filter(
                SyllabusTopic.unit_id == unit.id
            ).order_by(SyllabusTopic.order_index.asc()).all()

            topic_nodes: List[KnowledgeMapTopicNode] = []
            for st in syllabus_topics:
                topic = db.query(Topic).filter(Topic.id == st.topic_id).first()
                if not topic:
                    continue

                # Fetch prerequisites names for this topic
                prereqs = db.query(Topic).join(
                    Prerequisite, Prerequisite.prerequisite_topic_id == Topic.id
                ).filter(Prerequisite.topic_id == topic.id).all()
                prereq_names = [p.name for p in prereqs]

                # Mastery info
                t_mastery = mastery_map.get(topic.id)
                mastery_node = build_mastery_node(topic, t_mastery)

                # Count prerequisite weaknesses (needs_attention or not_assessed)
                prereq_weakness_count = sum(
                    1 for p in prereqs
                    if mastery_map.get(p.id) is None or mastery_map.get(p.id).status in ("needs_attention", "not_assessed")
                )

                # Fetch subtopics if any
                subtopics = db.query(Topic).filter(Topic.parent_topic_id == topic.id).all()
                subtopic_nodes = []
                for i, sub in enumerate(subtopics):
                    sub_mastery = mastery_map.get(sub.id)
                    subtopic_nodes.append(KnowledgeMapTopicNode(
                        id=sub.id,
                        name=sub.name,
                        slug=sub.slug,
                        difficulty=sub.difficulty,
                        order_index=i,
                        parent_topic_id=topic.id,
                        prerequisites_count=0,
                        prerequisites=[],
                        mastery=build_mastery_node(sub, sub_mastery),
                        prerequisite_weakness_count=0,
                        subtopics=[]
                    ))

                topic_nodes.append(KnowledgeMapTopicNode(
                    id=topic.id,
                    name=topic.name,
                    slug=topic.slug,
                    difficulty=topic.difficulty,
                    order_index=st.order_index,
                    parent_topic_id=topic.parent_topic_id,
                    prerequisites_count=len(prereq_names),
                    prerequisites=prereq_names,
                    mastery=mastery_node,
                    prerequisite_weakness_count=prereq_weakness_count,
                    subtopics=subtopic_nodes
                ))
                total_topics_count += 1 + len(subtopic_nodes)

            unit_nodes.append(KnowledgeMapUnitNode(
                id=unit.id,
                name=unit.name,
                order_index=unit.order_index,
                topics=topic_nodes
            ))

        return KnowledgeMapResponse(
            workspace_id=ws.id,
            subject_name=ws.subject.name,
            units=unit_nodes,
            total_units=len(unit_nodes),
            total_topics=total_topics_count
        )

