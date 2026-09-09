from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from datetime import date, datetime
from typing import List, Optional
from backend.app.schemas.unit import UnitResponse
from backend.app.schemas.material import MaterialResponse
from backend.app.schemas.syllabus import SyllabusUnitInput

class WorkspaceCreate(BaseModel):
    student_name: str = Field(..., min_length=1, max_length=255)
    subject_id: Optional[str] = None
    subject_name: Optional[str] = None
    goal: str = Field(..., pattern="^(exam_preparation|concept_mastery)$")
    exam_date: Optional[date] = None
    units: List[SyllabusUnitInput] = []
    material_ids: List[str] = []

    @field_validator("student_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Student name is required")
        return trimmed

    @model_validator(mode="after")
    def validate_subject_and_exam_date(self):
        if not self.subject_id and not (self.subject_name and self.subject_name.strip()):
            raise ValueError("Either subject_id or subject_name must be provided")
        
        if self.goal == "exam_preparation" and not self.exam_date:
            raise ValueError("Exam date is required when learning goal is Exam Preparation")
        return self

class WorkspaceResponse(BaseModel):
    id: str
    student_id: str
    student_name: str
    subject_id: str
    subject_name: str
    goal: str
    exam_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class WorkspaceOverviewResponse(BaseModel):
    id: str
    student_id: str
    student_name: str
    subject_id: str
    subject_name: str
    goal: str
    exam_date: Optional[date] = None
    days_remaining: Optional[int] = None
    total_units: int
    total_topics: int
    total_materials: int
    created_at: datetime

class TopicMasteryEmbed(BaseModel):
    """Compact mastery info embedded in a Knowledge Map topic node."""
    status: str = "not_assessed"
    understanding_score: float = 0.0
    evidence_count: int = 0
    correct_answers: int = 0
    incorrect_answers: int = 0
    last_assessed_at: Optional[datetime] = None

class KnowledgeMapTopicNode(BaseModel):
    id: str
    name: str
    slug: str
    difficulty: Optional[str] = None
    order_index: int
    parent_topic_id: Optional[str] = None
    prerequisites_count: int = 0
    prerequisites: List[str] = []  # Names of prerequisites
    mastery: Optional[TopicMasteryEmbed] = None  # Nested mastery — null when never assessed
    prerequisite_weakness_count: int = 0
    subtopics: List["KnowledgeMapTopicNode"] = []

class KnowledgeMapUnitNode(BaseModel):
    id: str
    name: str
    order_index: int
    topics: List[KnowledgeMapTopicNode] = []

class KnowledgeMapResponse(BaseModel):
    workspace_id: str
    subject_name: str
    units: List[KnowledgeMapUnitNode]
    total_units: int
    total_topics: int

