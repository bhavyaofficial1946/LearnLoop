import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, BigInteger, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.base import Base

class AcademicMaterial(Base):
    __tablename__ = "academic_materials"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_subject_id = Column(String(36), ForeignKey("student_subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    material_type = Column(String(50), nullable=False)  # 'syllabus' or 'previous_year_paper'
    file_name = Column(String(255), nullable=False)
    file_path_or_storage_reference = Column(String(500), nullable=False)
    file_size_bytes = Column(BigInteger, nullable=True)
    status = Column(String(50), default="uploaded", nullable=False)  # 'uploaded', 'processed', 'failed'
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    workspace = relationship("StudentSubject", back_populates="materials")
