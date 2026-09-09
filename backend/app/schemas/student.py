from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import datetime
from typing import Optional

class StudentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Full name of student")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Student name cannot be empty or whitespace only")
        return trimmed

class StudentCreate(StudentBase):
    pass

class StudentResponse(StudentBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
