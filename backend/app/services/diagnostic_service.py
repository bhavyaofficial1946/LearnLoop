import logging
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict
from sqlalchemy.orm import Session, joinedload
from backend.app.models.workspace import StudentSubject
from backend.app.models.unit import Unit
from backend.app.models.topic import Topic, SyllabusTopic
from backend.app.models.prerequisite import Prerequisite
from backend.app.models.diagnostic import (
    DiagnosticQuestion,
    DiagnosticOption,
    DiagnosticAssessment,
    DiagnosticResponse
)
from backend.app.schemas.diagnostic import (
    QuestionPublicResponse,
    OptionPublicResponse,
    DiagnosticAssessmentResponse
)

logger = logging.getLogger("learnloop.diagnostic_service")

class DiagnosticService:
    @staticmethod
    def get_workspace_syllabus_topic_ids(db: Session, workspace_id: str) -> List[str]:
        """Fetch all unique topic IDs present in the workspace syllabus."""
        units = db.query(Unit).filter(Unit.student_subject_id == workspace_id).all()
        topic_ids = []
        for u in units:
            st_list = db.query(SyllabusTopic).filter(SyllabusTopic.unit_id == u.id).all()
            for st in st_list:
                if st.topic_id not in topic_ids:
                    topic_ids.append(st.topic_id)
        return topic_ids

    @classmethod
    def select_questions_for_workspace(
        cls,
        db: Session,
        workspace_id: str,
        target_count: int = 12
    ) -> List[DiagnosticQuestion]:
        """
        Selects a balanced, prerequisite-aware set of diagnostic questions
        tied directly to the student's persisted syllabus topics.
        """
        syllabus_topic_ids = cls.get_workspace_syllabus_topic_ids(db, workspace_id)
        if not syllabus_topic_ids:
            # Fallback to all subject topics if no units
            ws = db.query(StudentSubject).filter(StudentSubject.id == workspace_id).first()
            if ws:
                syllabus_topic_ids = [t.id for t in db.query(Topic).filter(Topic.subject_id == ws.subject_id).all()]

        # Find questions directly matching syllabus topics
        available_questions = db.query(DiagnosticQuestion).options(
            joinedload(DiagnosticQuestion.topic),
            joinedload(DiagnosticQuestion.options)
        ).filter(
            DiagnosticQuestion.topic_id.in_(syllabus_topic_ids),
            DiagnosticQuestion.is_active == True
        ).all()

        if not available_questions:
            # Fallback: all active questions
            available_questions = db.query(DiagnosticQuestion).options(
                joinedload(DiagnosticQuestion.topic),
                joinedload(DiagnosticQuestion.options)
            ).filter(DiagnosticQuestion.is_active == True).all()

        # Sort with priority:
        # 1. Prerequisite-dependent topics (BFS, Dijkstra, BST, AVL, etc.)
        # 2. Difficulty progression (Beginner -> Intermediate -> Advanced)
        difficulty_weight = {"beginner": 1, "intermediate": 2, "advanced": 3}
        
        # Check topics with prerequisites
        prereq_topic_ids = set(
            p.topic_id for p in db.query(Prerequisite).filter(Prerequisite.topic_id.in_(syllabus_topic_ids)).all()
        )

        def sort_key(q: DiagnosticQuestion):
            is_prereq_dependent = 0 if q.topic_id in prereq_topic_ids else 1
            diff_rank = difficulty_weight.get(q.difficulty.lower(), 2)
            return (is_prereq_dependent, diff_rank, q.id)

        sorted_questions = sorted(available_questions, key=sort_key)
        
        # Pick distinct topics where possible up to target_count
        selected: List[DiagnosticQuestion] = []
        seen_topics = set()

        # First pass: 1 question per topic
        for q in sorted_questions:
            if q.topic_id not in seen_topics and len(selected) < target_count:
                selected.append(q)
                seen_topics.add(q.topic_id)

        # Second pass: fill remaining slots
        if len(selected) < target_count:
            for q in sorted_questions:
                if q not in selected and len(selected) < target_count:
                    selected.append(q)

        logger.info(f"Selected {len(selected)} diagnostic questions for workspace {workspace_id}")
        return selected

    @classmethod
    def create_or_resume_assessment(
        cls,
        db: Session,
        workspace_id: str,
        question_count: int = 12
    ) -> Tuple[DiagnosticAssessment, List[QuestionPublicResponse]]:
        """
        Creates a new diagnostic assessment or resumes an in-progress one.
        Returns the assessment and public questions (with answers withheld).
        """
        ws = db.query(StudentSubject).filter(StudentSubject.id == workspace_id).first()
        if not ws:
            raise ValueError(f"Study workspace {workspace_id} not found")

        # Check for existing in_progress assessment
        existing = db.query(DiagnosticAssessment).filter(
            DiagnosticAssessment.student_subject_id == workspace_id,
            DiagnosticAssessment.status == "in_progress"
        ).order_by(DiagnosticAssessment.started_at.desc()).first()

        if existing:
            # Load existing questions linked via responses
            responses = db.query(DiagnosticResponse).options(
                joinedload(DiagnosticResponse.question).joinedload(DiagnosticQuestion.options),
                joinedload(DiagnosticResponse.question).joinedload(DiagnosticQuestion.topic)
            ).filter(DiagnosticResponse.assessment_id == existing.id).all()

            if responses:
                questions = [r.question for r in responses]
            else:
                questions = cls.select_questions_for_workspace(db, workspace_id, question_count)
                for q in questions:
                    resp = DiagnosticResponse(
                        assessment_id=existing.id,
                        question_id=q.id
                    )
                    db.add(resp)
                db.commit()

            public_questions = cls._format_public_questions(questions)
            return existing, public_questions

        # Create new assessment
        questions = cls.select_questions_for_workspace(db, workspace_id, question_count)
        if not questions:
            raise ValueError("No diagnostic questions available for this subject yet.")

        assessment = DiagnosticAssessment(
            student_subject_id=workspace_id,
            status="in_progress",
            total_questions=len(questions),
            started_at=datetime.now(timezone.utc)
        )
        db.add(assessment)
        db.flush()

        # Seed initial placeholder responses so question order is persisted
        for q in questions:
            resp = DiagnosticResponse(
                assessment_id=assessment.id,
                question_id=q.id
            )
            db.add(resp)

        db.commit()
        db.refresh(assessment)

        public_questions = cls._format_public_questions(questions)
        return assessment, public_questions

    @staticmethod
    def _format_public_questions(questions: List[DiagnosticQuestion]) -> List[QuestionPublicResponse]:
        """Formats questions into public schemas (stripping correct answer flags and explanations)."""
        result = []
        for q in questions:
            opts = [
                OptionPublicResponse(
                    id=opt.id,
                    question_id=opt.question_id,
                    option_text=opt.option_text,
                    order_index=opt.order_index
                )
                for opt in sorted(q.options, key=lambda o: o.order_index)
            ]
            result.append(QuestionPublicResponse(
                id=q.id,
                topic_id=q.topic_id,
                topic_name=q.topic.name if q.topic else None,
                question_text=q.question_text,
                difficulty=q.difficulty,
                options=opts
            ))
        return result

    @staticmethod
    def record_answer(
        db: Session,
        assessment_id: str,
        question_id: str,
        selected_option_id: str
    ) -> DiagnosticResponse:
        """Records an answer for a question in an in-progress assessment."""
        assessment = db.query(DiagnosticAssessment).filter(DiagnosticAssessment.id == assessment_id).first()
        if not assessment:
            raise ValueError("Diagnostic assessment not found")
        if assessment.status != "in_progress":
            raise ValueError("Cannot submit answers to a completed assessment")

        option = db.query(DiagnosticOption).filter(
            DiagnosticOption.id == selected_option_id,
            DiagnosticOption.question_id == question_id
        ).first()
        if not option:
            raise ValueError("Invalid option selected for this question")

        response = db.query(DiagnosticResponse).filter(
            DiagnosticResponse.assessment_id == assessment_id,
            DiagnosticResponse.question_id == question_id
        ).first()

        if not response:
            response = DiagnosticResponse(
                assessment_id=assessment_id,
                question_id=question_id
            )
            db.add(response)

        response.selected_option_id = selected_option_id
        response.is_correct = option.is_correct
        response.answered_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(response)
        return response
