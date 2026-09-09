import uuid
from sqlalchemy import Column, String, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from backend.app.db.base import Base

class Prerequisite(Base):
    __tablename__ = "prerequisites"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    prerequisite_topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint("topic_id", "prerequisite_topic_id", name="uq_topic_prerequisite"),
        CheckConstraint("topic_id != prerequisite_topic_id", name="ck_no_self_prerequisite"),
    )

    topic = relationship("Topic", foreign_keys=[topic_id], back_populates="prerequisites_required")
    prerequisite_topic = relationship("Topic", foreign_keys=[prerequisite_topic_id], back_populates="prerequisites_for")
