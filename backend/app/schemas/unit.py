from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from backend.app.schemas.topic import TopicResponse

class UnitTopicResponse(BaseModel):
    id: str
    name: str
    slug: str
    difficulty: Optional[str] = None
    order_index: int
    parent_topic_id: Optional[str] = None
    subtopics: List["UnitTopicResponse"] = []

    model_config = ConfigDict(from_attributes=True)

class UnitResponse(BaseModel):
    id: str
    name: str
    order_index: int
    topics: List[UnitTopicResponse] = []

    model_config = ConfigDict(from_attributes=True)
