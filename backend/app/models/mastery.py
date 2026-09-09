import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.db.base import Base

class TopicMastery(Base):
    __tablename__ = "topic_mastery"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_subject_id = Column(String(36), ForeignKey("student_subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    understanding_score = Column(Float, default=0.0, nullable=False)  # 0.0 to 1.0
    status = Column(String(50), default="not_assessed", nullable=False)  # 'not_assessed', 'needs_attention', 'developing', 'strong'
    evidence_count = Column(Integer, default=0, nullable=False)
    correct_answers = Column(Integer, default=0, nullable=False)
    incorrect_answers = Column(Integer, default=0, nullable=False)
    last_assessed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=True)

    __table_args__ = (
        UniqueConstraint("student_subject_id", "topic_id", name="uq_workspace_topic_mastery"),
    )

    workspace = relationship("StudentSubject")
    topic = relationship("Topic")
