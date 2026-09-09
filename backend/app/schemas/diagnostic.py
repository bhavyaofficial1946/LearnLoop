from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import List, Optional

class OptionPublicResponse(BaseModel):
    id: str
    question_id: str
    option_text: str
    order_index: int

    model_config = ConfigDict(from_attributes=True)

class QuestionPublicResponse(BaseModel):
    id: str
    topic_id: str
    topic_name: Optional[str] = None
    question_text: str
    difficulty: str
    options: List[OptionPublicResponse] = []

    model_config = ConfigDict(from_attributes=True)

class DiagnosticAssessmentResponse(BaseModel):
    id: str
    student_subject_id: str
    status: str
    total_questions: int
    score: Optional[float] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    questions: List[QuestionPublicResponse] = []

    model_config = ConfigDict(from_attributes=True)

class AnswerSubmissionRequest(BaseModel):
    question_id: str = Field(..., min_length=1)
    selected_option_id: str = Field(..., min_length=1)

class AssessmentCompleteRequest(BaseModel):
    answers: List[AnswerSubmissionRequest] = []

class AssessmentResultItem(BaseModel):
    question_id: str
    question_text: str
    topic_id: str
    topic_name: str
    difficulty: str
    selected_option_id: Optional[str] = None
    correct_option_id: str
    is_correct: bool
    explanation: Optional[str] = None

class TopicMasteryBrief(BaseModel):
    topic_id: str
    topic_name: str
    status: str
    understanding_score: float
    evidence_count: int
    correct_answers: int
    incorrect_answers: int

class AssessmentResultResponse(BaseModel):
    assessment_id: str
    status: str
    total_questions: int
    correct_count: int
    incorrect_count: int
    score_percentage: float
    results: List[AssessmentResultItem] = []
    topic_masteries: List[TopicMasteryBrief] = []
    strong_topics: List[str] = []
    developing_topics: List[str] = []
    needs_attention_topics: List[str] = []
    not_assessed_topics: List[str] = []
