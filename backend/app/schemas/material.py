from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class MaterialBase(BaseModel):
    material_type: str  # 'syllabus' or 'previous_year_paper'
    file_name: str
    file_path_or_storage_reference: str
    file_size_bytes: Optional[int] = None
    status: str = "uploaded"

class MaterialResponse(MaterialBase):
    id: str
    student_subject_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
