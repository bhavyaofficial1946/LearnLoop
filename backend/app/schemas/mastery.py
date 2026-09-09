from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional

class PrerequisiteMasteryItem(BaseModel):
    prerequisite_topic_id: str
    prerequisite_topic_name: str
    status: str
    is_healthy: bool  # True if strong/developing, False if needs_attention or not_assessed

class TopicMasteryResponse(BaseModel):
    id: str
    student_subject_id: str
    topic_id: str
    topic_name: str
    topic_slug: str
    difficulty: Optional[str] = None
    understanding_score: float
    status: str  # 'not_assessed', 'needs_attention', 'developing', 'strong'
    evidence_count: int
    correct_answers: int
    incorrect_answers: int
    last_assessed_at: Optional[datetime] = None
    prerequisite_health: List[PrerequisiteMasteryItem] = []

    model_config = ConfigDict(from_attributes=True)

class WorkspaceMasterySummaryResponse(BaseModel):
    workspace_id: str
    has_baseline: bool
    total_topics: int
    assessed_topics_count: int
    strong_count: int
    developing_count: int
    needs_attention_count: int
    not_assessed_count: int
    topic_masteries: List[TopicMasteryResponse] = []
