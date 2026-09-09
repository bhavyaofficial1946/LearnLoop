from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List

class PrerequisiteBrief(BaseModel):
    id: str
    name: str
    slug: str
    difficulty: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

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

class TopicMasteryEmbed(BaseModel):
    """Mastery info nested inside a Topic Detail or Knowledge Map node."""
    status: str = "not_assessed"
    understanding_score: float = 0.0
    evidence_count: int = 0
    correct_answers: int = 0
    incorrect_answers: int = 0
    last_assessed_at: Optional[datetime] = None

class PrerequisiteMasteryItem(BaseModel):
    """Prerequisite topic with its mastery status — used in TopicDetailResponse."""
    id: str
    name: str
    slug: str
    status: str = "not_assessed"
    understanding_score: float = 0.0

class TopicDetailResponse(BaseModel):
    id: str
    name: str
    slug: str
    difficulty: Optional[str] = None
    unit_id: Optional[str] = None
    unit_name: Optional[str] = None
    parent_topic_id: Optional[str] = None
    parent_topic_name: Optional[str] = None
    mastery: Optional[TopicMasteryEmbed] = None  # Nested; null if never assessed
    prerequisites: List[PrerequisiteBrief] = []
    dependents: List[PrerequisiteBrief] = []
    prerequisites_mastery: List[PrerequisiteMasteryItem] = []
    subtopics: List[TopicResponse] = []

    model_config = ConfigDict(from_attributes=True)

