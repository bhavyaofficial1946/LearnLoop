from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional
from backend.app.schemas.topic import TopicResponse

class SubjectBase(BaseModel):
    name: str
    slug: str
    is_canonical: bool = True

class SubjectCreate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    id: str
    created_at: datetime
    canonical_topics_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class SubjectDetailResponse(SubjectResponse):
    topics_tree: List[TopicResponse] = []
