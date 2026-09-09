import logging
from datetime import datetime, timezone
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from backend.app.models.workspace import StudentSubject
from backend.app.models.unit import Unit
from backend.app.models.topic import Topic, SyllabusTopic
from backend.app.models.prerequisite import Prerequisite
from backend.app.models.diagnostic import (
    DiagnosticAssessment,
    DiagnosticResponse,
    DiagnosticQuestion,
    DiagnosticOption
)
from backend.app.models.mastery import TopicMastery
from backend.app.schemas.diagnostic import (
    AssessmentResultResponse,
    AssessmentResultItem,
    TopicMasteryBrief,
    AnswerSubmissionRequest
)
from backend.app.schemas.mastery import (
    TopicMasteryResponse,
    WorkspaceMasterySummaryResponse,
    PrerequisiteMasteryItem
)

logger = logging.getLogger("learnloop.mastery_service")

# Difficulty weights for knowledge calculation
DIFFICULTY_WEIGHTS = {
    "beginner": 1.0,
    "intermediate": 1.5,
    "advanced": 2.0
}

class MasteryService:
    @classmethod
    def evaluate_and_complete_assessment(
        cls,
        db: Session,
        assessment_id: str,
        batch_answers: Optional[List[AnswerSubmissionRequest]] = None
    ) -> AssessmentResultResponse:
        """
        Grades an assessment server-side, updates topic_mastery in PostgreSQL,
        and returns detailed explanations and topic mastery states.
        """
        assessment = db.query(DiagnosticAssessment).filter(DiagnosticAssessment.id == assessment_id).first()
        if not assessment:
            raise ValueError(f"Assessment {assessment_id} not found")

        # If batch answers provided, record them
        if batch_answers:
            for ans in batch_answers:
                opt = db.query(DiagnosticOption).filter(
                    DiagnosticOption.id == ans.selected_option_id,
                    DiagnosticOption.question_id == ans.question_id
                ).first()
                if opt:
                    resp = db.query(DiagnosticResponse).filter(
                        DiagnosticResponse.assessment_id == assessment_id,
                        DiagnosticResponse.question_id == ans.question_id
                    ).first()
                    if not resp:
                        resp = DiagnosticResponse(
                            assessment_id=assessment_id,
                            question_id=ans.question_id
                        )
                        db.add(resp)
                    resp.selected_option_id = ans.selected_option_id
                    resp.is_correct = opt.is_correct
                    resp.answered_at = datetime.now(timezone.utc)
            db.commit()

        # Load all responses for this assessment with question, topic, and options
        responses = db.query(DiagnosticResponse).options(
            joinedload(DiagnosticResponse.question).joinedload(DiagnosticQuestion.topic),
            joinedload(DiagnosticResponse.question).joinedload(DiagnosticQuestion.options)
        ).filter(DiagnosticResponse.assessment_id == assessment_id).all()

        result_items: List[AssessmentResultItem] = []
        correct_count = 0
        incorrect_count = 0

        for r in responses:
            q = r.question
            correct_opt = next((o for o in q.options if o.is_correct), None)
            correct_opt_id = correct_opt.id if correct_opt else ""

            is_correct = bool(r.is_correct)
            if is_correct:
                correct_count += 1
            else:
                incorrect_count += 1

            result_items.append(AssessmentResultItem(
                question_id=q.id,
                question_text=q.question_text,
                topic_id=q.topic_id,
                topic_name=q.topic.name if q.topic else "General Topic",
                difficulty=q.difficulty,
                selected_option_id=r.selected_option_id,
                correct_option_id=correct_opt_id,
                is_correct=is_correct,
                explanation=q.explanation
            ))

        total_q = len(responses)
        score_pct = (correct_count / total_q) if total_q > 0 else 0.0

        # Mark assessment as completed
        assessment.status = "completed"
        assessment.score = score_pct
        assessment.completed_at = datetime.now(timezone.utc)
        db.commit()

        # Update Topic Mastery relationally in database
        updated_masteries = cls.update_topic_masteries_from_responses(
            db=db,
            workspace_id=assessment.student_subject_id,
            responses=responses
        )

        strong = [m.topic_name for m in updated_masteries if m.status == "strong"]
        developing = [m.topic_name for m in updated_masteries if m.status == "developing"]
        needs_attention = [m.topic_name for m in updated_masteries if m.status == "needs_attention"]

        # Find unassessed topics in this workspace
        all_masteries = cls.get_workspace_topic_masteries(db, assessment.student_subject_id)
        not_assessed = [m.topic_name for m in all_masteries if m.status == "not_assessed"]

        return AssessmentResultResponse(
            assessment_id=assessment.id,
            status="completed",
            total_questions=total_q,
            correct_count=correct_count,
            incorrect_count=incorrect_count,
            score_percentage=round(score_pct * 100, 1),
            results=result_items,
            topic_masteries=updated_masteries,
            strong_topics=strong,
            developing_topics=developing,
            needs_attention_topics=needs_attention,
            not_assessed_topics=not_assessed
        )

    @classmethod
    def update_topic_masteries_from_responses(
        cls,
        db: Session,
        workspace_id: str,
        responses: List[DiagnosticResponse]
    ) -> List[TopicMasteryBrief]:
        """
        Calculates topic understanding scores and updates `topic_mastery` table.
        """
        # Group responses by topic_id
        topic_responses: Dict[str, List[DiagnosticResponse]] = {}
        for r in responses:
            t_id = r.question.topic_id
            topic_responses.setdefault(t_id, []).append(r)

        mastery_briefs: List[TopicMasteryBrief] = []

        for topic_id, resps in topic_responses.items():
            topic = db.query(Topic).filter(Topic.id == topic_id).first()
            if not topic:
                continue

            correct_count = sum(1 for r in resps if r.is_correct)
            incorrect_count = sum(1 for r in resps if not r.is_correct)
            evidence_count = correct_count + incorrect_count

            # Calculate weighted accuracy
            weighted_correct = sum(
                DIFFICULTY_WEIGHTS.get(r.question.difficulty.lower(), 1.0)
                for r in resps if r.is_correct
            )
            weighted_total = sum(
                DIFFICULTY_WEIGHTS.get(r.question.difficulty.lower(), 1.0)
                for r in resps
            )
            weighted_acc = (weighted_correct / weighted_total) if weighted_total > 0 else 0.0

            # Deterministic bounded status calculation:
            # - strong: >= 2 evidence with weighted_acc >= 0.80 OR >= 1 advanced question correct with 0 mistakes
            # - developing: 1 question correct OR (>= 2 evidence with 0.50 <= weighted_acc < 0.80)
            # - needs_attention: weighted_acc < 0.50 with >= 1 evidence
            if evidence_count >= 2 and weighted_acc >= 0.80:
                status = "strong"
                score = round(weighted_acc, 2)
            elif evidence_count == 1 and weighted_acc == 1.0 and any(r.question.difficulty.lower() == "advanced" for r in resps):
                status = "strong"
                score = 0.90
            elif (evidence_count >= 1 and weighted_acc >= 0.50):
                status = "developing"
                score = round(weighted_acc, 2)
            else:
                status = "needs_attention"
                score = round(weighted_acc, 2)

            # Upsert into topic_mastery
            mastery = db.query(TopicMastery).filter(
                TopicMastery.student_subject_id == workspace_id,
                TopicMastery.topic_id == topic_id
            ).first()

            if not mastery:
                mastery = TopicMastery(
                    student_subject_id=workspace_id,
                    topic_id=topic_id,
                    understanding_score=score,
                    status=status,
                    evidence_count=evidence_count,
                    correct_answers=correct_count,
                    incorrect_answers=incorrect_count,
                    last_assessed_at=datetime.now(timezone.utc)
                )
                db.add(mastery)
            else:
                mastery.understanding_score = score
                mastery.status = status
                mastery.evidence_count = evidence_count
                mastery.correct_answers = correct_count
                mastery.incorrect_answers = incorrect_count
                mastery.last_assessed_at = datetime.now(timezone.utc)

            mastery_briefs.append(TopicMasteryBrief(
                topic_id=topic.id,
                topic_name=topic.name,
                status=status,
                understanding_score=score,
                evidence_count=evidence_count,
                correct_answers=correct_count,
                incorrect_answers=incorrect_count
            ))

        db.commit()
        return mastery_briefs

    @classmethod
    def get_workspace_topic_masteries(
        cls,
        db: Session,
        workspace_id: str
    ) -> List[TopicMasteryResponse]:
        """
        Retrieves all topics in the workspace along with their mastery status and prerequisite health.
        """
        # 1. Fetch all syllabus topics in this workspace
        units = db.query(Unit).filter(Unit.student_subject_id == workspace_id).all()
        topic_ids = []
        for u in units:
            for st in u.syllabus_topics:
                if st.topic_id not in topic_ids:
                    topic_ids.append(st.topic_id)

        # Fallback if no units: all subject topics
        if not topic_ids:
            ws = db.query(StudentSubject).filter(StudentSubject.id == workspace_id).first()
            if ws:
                topic_ids = [t.id for t in db.query(Topic).filter(Topic.subject_id == ws.subject_id).all()]

        topics = db.query(Topic).filter(Topic.id.in_(topic_ids)).all()

        # Existing masteries
        masteries = db.query(TopicMastery).filter(
            TopicMastery.student_subject_id == workspace_id
        ).all()
        mastery_map = {m.topic_id: m for m in masteries}

        results: List[TopicMasteryResponse] = []
        for topic in topics:
            m = mastery_map.get(topic.id)
            
            # Prerequisite health check
            prereqs = db.query(Topic).join(
                Prerequisite, Prerequisite.prerequisite_topic_id == Topic.id
            ).filter(Prerequisite.topic_id == topic.id).all()

            prereq_health: List[PrerequisiteMasteryItem] = []
            for p in prereqs:
                p_mastery = mastery_map.get(p.id)
                p_status = p_mastery.status if p_mastery else "not_assessed"
                is_healthy = p_status in ["strong", "developing"]
                prereq_health.append(PrerequisiteMasteryItem(
                    prerequisite_topic_id=p.id,
                    prerequisite_topic_name=p.name,
                    status=p_status,
                    is_healthy=is_healthy
                ))

            if m:
                results.append(TopicMasteryResponse(
                    id=m.id,
                    student_subject_id=workspace_id,
                    topic_id=topic.id,
                    topic_name=topic.name,
                    topic_slug=topic.slug,
                    difficulty=topic.difficulty,
                    understanding_score=m.understanding_score,
                    status=m.status,
                    evidence_count=m.evidence_count,
                    correct_answers=m.correct_answers,
                    incorrect_answers=m.incorrect_answers,
                    last_assessed_at=m.last_assessed_at,
                    prerequisite_health=prereq_health
                ))
            else:
                results.append(TopicMasteryResponse(
                    id=f"unassessed_{topic.id}",
                    student_subject_id=workspace_id,
                    topic_id=topic.id,
                    topic_name=topic.name,
                    topic_slug=topic.slug,
                    difficulty=topic.difficulty,
                    understanding_score=0.0,
                    status="not_assessed",
                    evidence_count=0,
                    correct_answers=0,
                    incorrect_answers=0,
                    last_assessed_at=None,
                    prerequisite_health=prereq_health
                ))

        return results

    @classmethod
    def get_workspace_mastery_summary(
        cls,
        db: Session,
        workspace_id: str
    ) -> WorkspaceMasterySummaryResponse:
        """Computes summary metrics of the student's knowledge baseline."""
        masteries = cls.get_workspace_topic_masteries(db, workspace_id)
        total = len(masteries)
        assessed = [m for m in masteries if m.status != "not_assessed"]
        strong = [m for m in masteries if m.status == "strong"]
        developing = [m for m in masteries if m.status == "developing"]
        needs_attention = [m for m in masteries if m.status == "needs_attention"]
        not_assessed = [m for m in masteries if m.status == "not_assessed"]

        return WorkspaceMasterySummaryResponse(
            workspace_id=workspace_id,
            has_baseline=len(assessed) > 0,
            total_topics=total,
            assessed_topics_count=len(assessed),
            strong_count=len(strong),
            developing_count=len(developing),
            needs_attention_count=len(needs_attention),
            not_assessed_count=len(not_assessed),
            topic_masteries=masteries
        )
