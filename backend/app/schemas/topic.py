from pydantic import BaseModel, ConfigDict
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

class TopicDetailResponse(BaseModel):
    id: str
    name: str
    slug: str
    difficulty: Optional[str] = None
    unit_id: Optional[str] = None
    unit_name: Optional[str] = None
    parent_topic_id: Optional[str] = None
    parent_topic_name: Optional[str] = None
    prerequisites: List[PrerequisiteBrief] = []
    dependents: List[PrerequisiteBrief] = []  # Topics that require this topic
    subtopics: List[TopicResponse] = []

    model_config = ConfigDict(from_attributes=True)
