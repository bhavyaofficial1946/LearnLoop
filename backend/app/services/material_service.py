import os
import uuid
import logging
from pathlib import Path
from typing import List, Optional, Tuple
from fastapi import UploadFile
from sqlalchemy.orm import Session
from backend.app.config.settings import settings
from backend.app.models.material import AcademicMaterial

logger = logging.getLogger("learnloop.material")

class MaterialService:
    @staticmethod
    def validate_pdf_file(file: UploadFile, content: bytes) -> None:
        filename = file.filename or "document.pdf"
        ext = Path(filename).suffix.lower()
        if ext != ".pdf":
            raise ValueError(f"Invalid file type '{ext}'. Only PDF documents (.pdf) are supported.")
        
        if len(content) == 0:
            raise ValueError("Uploaded file is empty.")
        
        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise ValueError(f"File size exceeds maximum allowed limit of {settings.MAX_FILE_SIZE_MB}MB.")

    @classmethod
    def save_material_file(cls, content: bytes, original_filename: str) -> Tuple[str, str]:
        """Save file to storage directory and return (unique_id, file_path)"""
        file_id = str(uuid.uuid4())
        safe_name = f"{file_id}_{Path(original_filename).name}"
        file_path = os.path.join(str(settings.UPLOAD_DIR), safe_name)
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        return file_id, file_path

    @classmethod
    def create_material_record(
        cls,
        db: Session,
        workspace_id: str,
        material_type: str,
        filename: str,
        file_path: str,
        file_size_bytes: int,
        status: str = "uploaded"
    ) -> AcademicMaterial:
        mat = AcademicMaterial(
            student_subject_id=workspace_id,
            material_type=material_type,
            file_name=filename,
            file_path_or_storage_reference=file_path,
            file_size_bytes=file_size_bytes,
            status=status
        )
        db.add(mat)
        db.commit()
        db.refresh(mat)
        return mat

    @staticmethod
    def get_materials_by_workspace(db: Session, workspace_id: str) -> List[AcademicMaterial]:
        return db.query(AcademicMaterial).filter(
            AcademicMaterial.student_subject_id == workspace_id
        ).order_by(AcademicMaterial.created_at.desc()).all()
