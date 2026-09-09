import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.schemas.diagnostic import (
    DiagnosticAssessmentResponse,
    AnswerSubmissionRequest,
    AssessmentCompleteRequest,
    AssessmentResultResponse
)
from backend.app.schemas.mastery import (
    TopicMasteryResponse,
    WorkspaceMasterySummaryResponse
)
from backend.app.services.diagnostic_service import DiagnosticService
from backend.app.services.mastery_service import MasteryService
from backend.app.models.diagnostic import DiagnosticAssessment
from backend.app.models.workspace import StudentSubject

router = APIRouter(tags=["diagnostics"])
logger = logging.getLogger("learnloop.api.diagnostics")

@router.post(
    "/workspaces/{workspace_id}/diagnostics/start",
    response_model=DiagnosticAssessmentResponse,
    status_code=status.HTTP_201_CREATED
)
def start_diagnostic_assessment(
    workspace_id: str,
    question_count: int = Query(default=12, ge=5, le=30),
    db: Session = Depends(get_db)
):
    """Starts a new diagnostic assessment or resumes an in-progress one for the workspace."""
    ws = db.query(StudentSubject).filter(StudentSubject.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Study workspace not found")

    try:
        assessment, public_questions = DiagnosticService.create_or_resume_assessment(
            db=db,
            workspace_id=workspace_id,
            question_count=question_count
        )
        return DiagnosticAssessmentResponse(
            id=assessment.id,
            student_subject_id=assessment.student_subject_id,
            status=assessment.status,
            total_questions=assessment.total_questions,
            score=assessment.score,
            started_at=assessment.started_at,
            completed_at=assessment.completed_at,
            questions=public_questions
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error starting diagnostic: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to initialize diagnostic assessment")

@router.get(
    "/workspaces/{workspace_id}/diagnostics/current",
    response_model=DiagnosticAssessmentResponse
)
def get_current_diagnostic(
    workspace_id: str,
    db: Session = Depends(get_db)
):
    """Retrieves the active in-progress or most recent diagnostic assessment for the workspace."""
    ws = db.query(StudentSubject).filter(StudentSubject.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Study workspace not found")

    assessment = db.query(DiagnosticAssessment).filter(
        DiagnosticAssessment.student_subject_id == workspace_id
    ).order_by(DiagnosticAssessment.started_at.desc()).first()

    if not assessment:
        raise HTTPException(status_code=404, detail="No diagnostic assessments found for this workspace")

    # Load questions
    from backend.app.models.diagnostic import DiagnosticResponse, DiagnosticQuestion
    responses = db.query(DiagnosticResponse).filter(
        DiagnosticResponse.assessment_id == assessment.id
    ).all()
    
    questions = [r.question for r in responses if r.question]
    public_questions = DiagnosticService._format_public_questions(questions)

    return DiagnosticAssessmentResponse(
        id=assessment.id,
        student_subject_id=assessment.student_subject_id,
        status=assessment.status,
        total_questions=assessment.total_questions,
        score=assessment.score,
        started_at=assessment.started_at,
        completed_at=assessment.completed_at,
        questions=public_questions
    )

@router.post(
    "/workspaces/{workspace_id}/diagnostics/{assessment_id}/submit-answer"
)
def submit_single_answer(
    workspace_id: str,
    assessment_id: str,
    data: AnswerSubmissionRequest,
    db: Session = Depends(get_db)
):
    """Records an individual answer for a question in an active diagnostic."""
    assessment = db.query(DiagnosticAssessment).filter(
        DiagnosticAssessment.id == assessment_id,
        DiagnosticAssessment.student_subject_id == workspace_id
    ).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found in this workspace")

    try:
        resp = DiagnosticService.record_answer(
            db=db,
            assessment_id=assessment_id,
            question_id=data.question_id,
            selected_option_id=data.selected_option_id
        )
        return {"status": "saved", "question_id": data.question_id, "answered_at": resp.answered_at}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error recording answer: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to record answer")

@router.post(
    "/workspaces/{workspace_id}/diagnostics/{assessment_id}/complete",
    response_model=AssessmentResultResponse
)
def complete_diagnostic_assessment(
    workspace_id: str,
    assessment_id: str,
    payload: Optional[AssessmentCompleteRequest] = None,
    db: Session = Depends(get_db)
):
    """Finalizes and evaluates the diagnostic assessment, updating topic mastery relationally."""
    assessment = db.query(DiagnosticAssessment).filter(
        DiagnosticAssessment.id == assessment_id,
        DiagnosticAssessment.student_subject_id == workspace_id
    ).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found in this workspace")

    try:
        results = MasteryService.evaluate_and_complete_assessment(
            db=db,
            assessment_id=assessment_id,
            batch_answers=payload.answers if payload else None
        )
        return results
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error completing assessment: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to evaluate diagnostic assessment")

@router.get(
    "/workspaces/{workspace_id}/mastery",
    response_model=WorkspaceMasterySummaryResponse
)
def get_workspace_mastery_summary(
    workspace_id: str,
    db: Session = Depends(get_db)
):
    """Retrieves current topic mastery breakdown and prerequisite health for the workspace."""
    ws = db.query(StudentSubject).filter(StudentSubject.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Study workspace not found")

    return MasteryService.get_workspace_mastery_summary(db, workspace_id)
