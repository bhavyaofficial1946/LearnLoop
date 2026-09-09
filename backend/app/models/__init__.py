from backend.app.db.base import Base
from backend.app.models.student import Student
from backend.app.models.subject import Subject
from backend.app.models.workspace import StudentSubject
from backend.app.models.material import AcademicMaterial
from backend.app.models.unit import Unit
from backend.app.models.topic import Topic, SyllabusTopic
from backend.app.models.prerequisite import Prerequisite

__all__ = [
    "Base",
    "Student",
    "Subject",
    "StudentSubject",
    "AcademicMaterial",
    "Unit",
    "Topic",
    "SyllabusTopic",
    "Prerequisite"
]
