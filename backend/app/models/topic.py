import uuid
from sqlalchemy import Column, String, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.base import Base

class Topic(Base):
    __tablename__ = "topics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, index=True)
    parent_topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)
    difficulty = Column(String(50), nullable=True)  # 'beginner', 'intermediate', 'advanced'
    is_canonical = Column(Boolean, default=True, nullable=False)

    subject = relationship("Subject", back_populates="topics")
    parent_topic = relationship("Topic", remote_side=[id], back_populates="subtopics")
    subtopics = relationship("Topic", back_populates="parent_topic", cascade="all, delete-orphan")
    
    syllabus_links = relationship("SyllabusTopic", back_populates="topic", cascade="all, delete-orphan")
    
    # Prerequisites relationships
    # topic is the dependent topic, prerequisite_topic is what must be learned first
    prerequisites_required = relationship(
        "Prerequisite",
        foreign_keys="[Prerequisite.topic_id]",
        back_populates="topic",
        cascade="all, delete-orphan"
    )
    prerequisites_for = relationship(
        "Prerequisite",
        foreign_keys="[Prerequisite.prerequisite_topic_id]",
        back_populates="prerequisite_topic",
        cascade="all, delete-orphan"
    )

class SyllabusTopic(Base):
    __tablename__ = "syllabus_topics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    unit_id = Column(String(36), ForeignKey("units.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    order_index = Column(Integer, default=0, nullable=False)

    unit = relationship("Unit", back_populates="syllabus_topics")
    topic = relationship("Topic", back_populates="syllabus_links")
