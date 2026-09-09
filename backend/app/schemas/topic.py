from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class PrerequisiteBrief(BaseModel):
    id: str
    name: str
    slug: str
    difficulty: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class PrerequisiteMasteryItem(BaseModel):
    id: str
    name: str
    slug: str
    status: str = "not_assessed"
    understanding_score: float = 0.0

class TopicMasteryDetail(BaseModel):
    topic_id: str
    topic_name: str
    understanding_score: float
    status: str  # 'not_assessed', 'needs_attention', 'developing', 'strong'
    evidence_count: int
    correct_answers: int
    incorrect_answers: int
    last_assessed_at: Optional[datetime] = None

class TopicBase(BaseModel):
    name: str
    slug: str
    parent_topic_id: Optional[str] = None
    difficulty: Optional[str] = None
    is_canonical: bool = True

class TopicResponse(TopicBase):
    id: str
    subject_id: str
    subtopics: List["TopicResponse"] = []

    model_config = ConfigDict(from_attributes=True)

class PrerequisiteHealthItem(BaseModel):
    prerequisite_topic_id: str
    prerequisite_topic_name: str
    status: str
    is_healthy: bool

class TopicDetailResponse(BaseModel):
    id: str
    name: str
    slug: str
    difficulty: Optional[str] = None
    unit_id: Optional[str] = None
    unit_name: Optional[str] = None
    parent_topic_id: Optional[str] = None
    parent_topic_name: Optional[str] = None
    mastery: Optional[TopicMasteryDetail] = None  # None when not assessed
    prerequisites: List[PrerequisiteBrief] = []
    dependents: List[PrerequisiteBrief] = []
    prerequisites_mastery: List[PrerequisiteMasteryItem] = []  # Mastery state of each prerequisite
    subtopics: List[TopicResponse] = []

    model_config = ConfigDict(from_attributes=True)

