from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.subject import Subject
from backend.app.models.topic import Topic
from backend.app.schemas.subject import SubjectCreate, SubjectResponse, SubjectDetailResponse
from backend.app.schemas.topic import TopicResponse
from backend.app.services.knowledge_service import KnowledgeService

router = APIRouter(prefix="/subjects", tags=["subjects"])

@router.get("", response_model=List[SubjectResponse])
def list_subjects(db: Session = Depends(get_db)):
    subjects = KnowledgeService.list_subjects(db)
    results = []
    for sub in subjects:
        canonical_count = db.query(Topic).filter(Topic.subject_id == sub.id, Topic.is_canonical == True).count()
        results.append(SubjectResponse(
            id=sub.id,
            name=sub.name,
            slug=sub.slug,
            is_canonical=sub.is_canonical,
            created_at=sub.created_at,
            canonical_topics_count=canonical_count
        ))
    return results

@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(data: SubjectCreate, db: Session = Depends(get_db)):
    existing = db.query(Subject).filter(Subject.slug == data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subject with this slug already exists")
    
    sub = Subject(
        name=data.name,
        slug=data.slug,
        is_canonical=data.is_canonical
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return SubjectResponse(
        id=sub.id,
        name=sub.name,
        slug=sub.slug,
        is_canonical=sub.is_canonical,
        created_at=sub.created_at,
        canonical_topics_count=0
    )

@router.get("/{subject_id}", response_model=SubjectDetailResponse)
def get_subject_detail(subject_id: str, db: Session = Depends(get_db)):
    sub = KnowledgeService.get_subject_by_id(db, subject_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Get top-level topics
    top_topics = db.query(Topic).filter(
        Topic.subject_id == sub.id,
        Topic.parent_topic_id == None
    ).order_by(Topic.name.asc()).all()
    
    tree = [TopicResponse.model_validate(t) for t in top_topics]
    count = db.query(Topic).filter(Topic.subject_id == sub.id).count()

    return SubjectDetailResponse(
        id=sub.id,
        name=sub.name,
        slug=sub.slug,
        is_canonical=sub.is_canonical,
        created_at=sub.created_at,
        canonical_topics_count=count,
        topics_tree=tree
    )
