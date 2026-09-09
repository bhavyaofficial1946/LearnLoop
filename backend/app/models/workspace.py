import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.base import Base

class StudentSubject(Base):
    __tablename__ = "student_subjects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="RESTRICT"), nullable=False, index=True)
    goal = Column(String(50), nullable=False)  # 'exam_preparation' or 'concept_mastery'
    exam_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    student = relationship("Student", back_populates="workspaces")
    subject = relationship("Subject", back_populates="workspaces")
    materials = relationship("AcademicMaterial", back_populates="workspace", cascade="all, delete-orphan", order_by="AcademicMaterial.created_at.desc()")
    units = relationship("Unit", back_populates="workspace", cascade="all, delete-orphan", order_by="Unit.order_index.asc()")
