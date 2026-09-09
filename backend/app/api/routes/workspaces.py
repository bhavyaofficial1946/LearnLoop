import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceResponse,
    WorkspaceOverviewResponse,
    KnowledgeMapResponse
)
from backend.app.schemas.topic import TopicDetailResponse
from backend.app.schemas.unit import UnitResponse
from backend.app.services.workspace_service import WorkspaceService
from backend.app.services.knowledge_service import KnowledgeService
from backend.app.models.workspace import StudentSubject
from backend.app.models.unit import Unit

router = APIRouter(prefix="/workspaces", tags=["workspaces"])
logger = logging.getLogger("learnloop.api.workspaces")

@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(data: WorkspaceCreate, db: Session = Depends(get_db)):
    try:
        ws = WorkspaceService.create_workspace(db, data)
        return WorkspaceResponse(
            id=ws.id,
            student_id=ws.student_id,
            student_name=ws.student.name,
            subject_id=ws.subject_id,
            subject_name=ws.subject.name,
            goal=ws.goal,
            exam_date=ws.exam_date,
            created_at=ws.created_at,
            updated_at=ws.updated_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating workspace: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create study workspace")

@router.get("/{workspace_id}", response_model=WorkspaceOverviewResponse)
def get_workspace_overview(workspace_id: str, db: Session = Depends(get_db)):
    overview = WorkspaceService.get_workspace_overview(db, workspace_id)
    if not overview:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return overview

@router.get("/{workspace_id}/knowledge-map", response_model=KnowledgeMapResponse)
def get_workspace_knowledge_map(workspace_id: str, db: Session = Depends(get_db)):
    kmap = WorkspaceService.get_knowledge_map(db, workspace_id)
    if not kmap:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return kmap

@router.get("/{workspace_id}/topics/{topic_id}", response_model=TopicDetailResponse)
def get_workspace_topic_detail(workspace_id: str, topic_id: str, db: Session = Depends(get_db)):
    ws = db.query(StudentSubject).filter(StudentSubject.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    detail = KnowledgeService.get_topic_detail(db, topic_id=topic_id, workspace_id=workspace_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Topic not found")
    return detail

@router.get("/{workspace_id}/units", response_model=List[UnitResponse])
def get_workspace_units(workspace_id: str, db: Session = Depends(get_db)):
    ws = db.query(StudentSubject).filter(StudentSubject.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    units = db.query(Unit).filter(Unit.student_subject_id == workspace_id).order_by(Unit.order_index.asc()).all()
    results = []
    for u in units:
        topics_data = []
        for st in u.syllabus_topics:
            t = st.topic
            topics_data.append({
                "id": t.id,
                "name": t.name,
                "slug": t.slug,
                "difficulty": t.difficulty,
                "order_index": st.order_index,
                "parent_topic_id": t.parent_topic_id,
                "subtopics": []
            })
        results.append(UnitResponse(
            id=u.id,
            name=u.name,
            order_index=u.order_index,
            topics=topics_data
        ))
    return results
