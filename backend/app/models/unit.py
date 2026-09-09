import uuid
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.base import Base

class Unit(Base):
    __tablename__ = "units"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_subject_id = Column(String(36), ForeignKey("student_subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    order_index = Column(Integer, default=0, nullable=False)

    workspace = relationship("StudentSubject", back_populates="units")
    syllabus_topics = relationship("SyllabusTopic", back_populates="unit", cascade="all, delete-orphan", order_by="SyllabusTopic.order_index.asc()")
