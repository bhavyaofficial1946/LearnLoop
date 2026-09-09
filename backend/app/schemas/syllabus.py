from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

class SyllabusTopicItem(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    difficulty: Optional[str] = "beginner"
    subtopics: List[str] = []

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Topic name cannot be blank")
        return trimmed

class SyllabusUnitInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    order_index: int = 0
    topics: List[str] = []

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Unit name cannot be blank")
        return trimmed

class SyllabusStructure(BaseModel):
    units: List[SyllabusUnitInput] = []

class SyllabusExtractResponse(BaseModel):
    units: List[SyllabusUnitInput]
    total_units: int
    total_topics: int
    source_filename: Optional[str] = None
    extraction_method: str = "pdf_extractor"
    warnings: List[str] = []
