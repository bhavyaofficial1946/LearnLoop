import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, Integer, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from backend.app.db.base import Base

class DiagnosticQuestion(Base):
    __tablename__ = "diagnostic_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    difficulty = Column(String(50), nullable=False, default="intermediate")  # 'beginner', 'intermediate', 'advanced'
    explanation = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    topic = relationship("Topic")
    options = relationship("DiagnosticOption", back_populates="question", cascade="all, delete-orphan", order_by="DiagnosticOption.order_index.asc()")
    responses = relationship("DiagnosticResponse", back_populates="question", cascade="all, delete-orphan")

class DiagnosticOption(Base):
    __tablename__ = "diagnostic_options"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = Column(String(36), ForeignKey("diagnostic_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    option_text = Column(Text, nullable=False)
    order_index = Column(Integer, default=0, nullable=False)
    is_correct = Column(Boolean, default=False, nullable=False)

    question = relationship("DiagnosticQuestion", back_populates="options")

class DiagnosticAssessment(Base):
    __tablename__ = "diagnostic_assessments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_subject_id = Column(String(36), ForeignKey("student_subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="in_progress", nullable=False)  # 'in_progress', 'completed', 'abandoned'
    total_questions = Column(Integer, default=0, nullable=False)
    score = Column(Float, nullable=True)  # Overall percentage 0.0 - 1.0
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    workspace = relationship("StudentSubject")
    responses = relationship("DiagnosticResponse", back_populates="assessment", cascade="all, delete-orphan")

class DiagnosticResponse(Base):
    __tablename__ = "diagnostic_responses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String(36), ForeignKey("diagnostic_assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("diagnostic_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    selected_option_id = Column(String(36), ForeignKey("diagnostic_options.id", ondelete="SET NULL"), nullable=True)
    is_correct = Column(Boolean, nullable=True)
    answered_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    assessment = relationship("DiagnosticAssessment", back_populates="responses")
    question = relationship("DiagnosticQuestion", back_populates="responses")
    selected_option = relationship("DiagnosticOption")
