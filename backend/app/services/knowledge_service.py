import re
import logging
from typing import List, Optional, Tuple, Dict
from sqlalchemy.orm import Session, joinedload
from backend.app.models.subject import Subject
from backend.app.models.topic import Topic, SyllabusTopic
from backend.app.models.prerequisite import Prerequisite
from backend.app.models.unit import Unit
from backend.app.schemas.topic import TopicResponse, TopicDetailResponse, PrerequisiteBrief

logger = logging.getLogger("learnloop.knowledge")

def normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", "", text)
    return re.sub(r"\s+", " ", text)

class KnowledgeService:
    @staticmethod
    def list_subjects(db: Session) -> List[Subject]:
        return db.query(Subject).order_by(Subject.is_canonical.desc(), Subject.name.asc()).all()

    @staticmethod
    def get_subject_by_id(db: Session, subject_id: str) -> Optional[Subject]:
        return db.query(Subject).filter(Subject.id == subject_id).first()

    @staticmethod
    def get_or_create_subject(db: Session, subject_id: Optional[str], subject_name: Optional[str]) -> Subject:
        if subject_id:
            sub = db.query(Subject).filter(Subject.id == subject_id).first()
            if sub:
                return sub
        
        if not subject_name:
            raise ValueError("Subject name or ID is required")
        
        clean_name = subject_name.strip()
        norm_name = normalize_text(clean_name)
        
        # 1. Search existing subjects by normalized name
        all_subjects = db.query(Subject).all()
        for s in all_subjects:
            if normalize_text(s.name) == norm_name or s.slug in ["data-structures-and-algorithms", "data-structures-algorithms"]:
                if "data structure" in norm_name or "dsa" in norm_name:
                    return s
                if normalize_text(s.name) == norm_name:
                    return s

        slug = re.sub(r"&", "and", clean_name.lower())
        slug = re.sub(r"[^\w\s-]", "", slug)
        slug = re.sub(r"[\s_-]+", "-", slug).strip("-")
        
        existing = db.query(Subject).filter(Subject.slug == slug).first()
        if existing:
            return existing
        
        new_sub = Subject(
            name=clean_name,
            slug=slug,
            is_canonical=False
        )
        db.add(new_sub)
        db.flush()
        return new_sub

    @staticmethod
    def match_or_create_topic(db: Session, subject_id: str, topic_name: str, difficulty: Optional[str] = "beginner") -> Topic:
        """
        Matches a syllabus topic against canonical topics for the subject.
        If a matching canonical topic exists (exact or normalized match), returns it.
        Otherwise, creates a new student/subject-specific topic.
        """
        clean_name = topic_name.strip()
        clean_norm = normalize_text(clean_name)
        
        # 1. Search canonical/existing topics for this subject
        all_topics = db.query(Topic).filter(Topic.subject_id == subject_id).all()
        for t in all_topics:
            if normalize_text(t.name) == clean_norm:
                return t
            # Substring match for canonical names like "Breadth-First Search (BFS)" matching "BFS" or "Breadth-First Search"
            if clean_norm and (clean_norm in normalize_text(t.name) or normalize_text(t.name) in clean_norm):
                if len(clean_norm) >= 3 and len(normalize_text(t.name)) >= 3:
                    return t

        # 2. Not found, create custom topic
        slug = re.sub(r"[^\w\s-]", "", clean_name.lower())
        slug = re.sub(r"[\s_-]+", "-", slug).strip("-")
        if not slug:
            slug = f"topic-{abs(hash(clean_name)) % 100000}"

        new_topic = Topic(
            subject_id=subject_id,
            name=clean_name,
            slug=slug,
            difficulty=difficulty or "beginner",
            is_canonical=False
        )
        db.add(new_topic)
        db.flush()
        return new_topic

    @staticmethod
    def get_topic_detail(db: Session, topic_id: str, workspace_id: Optional[str] = None) -> Optional[TopicDetailResponse]:
        topic = db.query(Topic).filter(Topic.id == topic_id).first()
        if not topic:
            return None

        # Fetch unit if workspace provided
        unit_id = None
        unit_name = None
        if workspace_id:
            st = db.query(SyllabusTopic).join(Unit).filter(
                SyllabusTopic.topic_id == topic.id,
                Unit.student_subject_id == workspace_id
            ).first()
            if st and st.unit:
                unit_id = st.unit.id
                unit_name = st.unit.name

        # Parent topic info
        parent_name = topic.parent_topic.name if topic.parent_topic else None

        # Prerequisites required (what must be learned before this topic)
        prereqs = db.query(Topic).join(
            Prerequisite, Prerequisite.prerequisite_topic_id == Topic.id
        ).filter(Prerequisite.topic_id == topic.id).all()
        
        prereq_briefs = [
            PrerequisiteBrief(id=p.id, name=p.name, slug=p.slug, difficulty=p.difficulty)
            for p in prereqs
        ]

        # Dependent topics (topics that require this topic as a prerequisite)
        dependents = db.query(Topic).join(
            Prerequisite, Prerequisite.topic_id == Topic.id
        ).filter(Prerequisite.prerequisite_topic_id == topic.id).all()

        dependent_briefs = [
            PrerequisiteBrief(id=d.id, name=d.name, slug=d.slug, difficulty=d.difficulty)
            for d in dependents
        ]

        # Subtopics
        subtopics = [
            TopicResponse.model_validate(sub)
            for sub in topic.subtopics
        ]

        # Fetch topic mastery if workspace provided
        mastery_detail = None
        prereq_mastery_list = []

        if workspace_id:
            from backend.app.models.mastery import TopicMastery
            from backend.app.schemas.topic import TopicMasteryDetail, PrerequisiteMasteryItem

            m = db.query(TopicMastery).filter(
                TopicMastery.student_subject_id == workspace_id,
                TopicMastery.topic_id == topic.id
            ).first()

            if m:
                mastery_detail = TopicMasteryDetail(
                    topic_id=topic.id,
                    topic_name=topic.name,
                    understanding_score=m.understanding_score,
                    status=m.status,
                    evidence_count=m.evidence_count,
                    correct_answers=m.correct_answers,
                    incorrect_answers=m.incorrect_answers,
                    last_assessed_at=m.last_assessed_at
                )

            # Prerequisite mastery list (for prerequisite health display)
            for p in prereqs:
                pm = db.query(TopicMastery).filter(
                    TopicMastery.student_subject_id == workspace_id,
                    TopicMastery.topic_id == p.id
                ).first()
                prereq_mastery_list.append(PrerequisiteMasteryItem(
                    id=p.id,
                    name=p.name,
                    slug=p.slug,
                    status=pm.status if pm else "not_assessed",
                    understanding_score=pm.understanding_score if pm else 0.0
                ))

        return TopicDetailResponse(
            id=topic.id,
            name=topic.name,
            slug=topic.slug,
            difficulty=topic.difficulty,
            unit_id=unit_id,
            unit_name=unit_name,
            parent_topic_id=topic.parent_topic_id,
            parent_topic_name=parent_name,
            mastery=mastery_detail,
            prerequisites=prereq_briefs,
            dependents=dependent_briefs,
            prerequisites_mastery=prereq_mastery_list,
            subtopics=subtopics
        )

