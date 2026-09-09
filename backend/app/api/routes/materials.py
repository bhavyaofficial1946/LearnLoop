import logging
from typing import List
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.schemas.material import MaterialResponse
from backend.app.services.material_service import MaterialService
from backend.app.models.workspace import StudentSubject
from backend.app.models.material import AcademicMaterial

router = APIRouter(tags=["materials"])
logger = logging.getLogger("learnloop.api.materials")

@router.post("/materials/upload-temp", response_model=MaterialResponse)
async def upload_temp_material(
    file: UploadFile = File(...),
    material_type: str = Form(default="previous_year_paper"),
    db: Session = Depends(get_db)
):
    """Upload material file temporarily before workspace creation"""
    try:
        content = await file.read()
        MaterialService.validate_pdf_file(file, content)
        filename = file.filename or "document.pdf"
        file_id, file_path = MaterialService.save_material_file(content, filename)
        
        # We store with a placeholder student_subject_id or create record directly
        # To satisfy foreign key, we can create a temporary or save the metadata
        mat = AcademicMaterial(
            id=file_id,
            student_subject_id="temp_pending_workspace",
            material_type=material_type,
            file_name=filename,
            file_path_or_storage_reference=file_path,
            file_size_bytes=len(content),
            status="uploaded"
        )
        return MaterialResponse(
            id=mat.id,
            student_subject_id=mat.student_subject_id,
            material_type=mat.material_type,
            file_name=mat.file_name,
            file_path_or_storage_reference=mat.file_path_or_storage_reference,
            file_size_bytes=mat.file_size_bytes,
            status=mat.status,
            created_at=mat.created_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error uploading material: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file")

@router.post("/workspaces/{workspace_id}/materials", response_model=MaterialResponse)
async def upload_workspace_material(
    workspace_id: str,
    file: UploadFile = File(...),
    material_type: str = Form(default="previous_year_paper"),
    db: Session = Depends(get_db)
):
    ws = db.query(StudentSubject).filter(StudentSubject.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    try:
        content = await file.read()
        MaterialService.validate_pdf_file(file, content)
        filename = file.filename or "document.pdf"
        _, file_path = MaterialService.save_material_file(content, filename)
        
        mat = MaterialService.create_material_record(
            db=db,
            workspace_id=workspace_id,
            material_type=material_type,
            filename=filename,
            file_path=file_path,
            file_size_bytes=len(content),
            status="uploaded"
        )
        return mat
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error saving workspace material: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload material")

@router.get("/workspaces/{workspace_id}/materials", response_model=List[MaterialResponse])
def get_workspace_materials(workspace_id: str, db: Session = Depends(get_db)):
    ws = db.query(StudentSubject).filter(StudentSubject.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    return MaterialService.get_materials_by_workspace(db, workspace_id)

@router.delete("/workspaces/{workspace_id}/materials/{material_id}")
def delete_workspace_material(workspace_id: str, material_id: str, db: Session = Depends(get_db)):
    mat = db.query(AcademicMaterial).filter(
        AcademicMaterial.id == material_id,
        AcademicMaterial.student_subject_id == workspace_id
    ).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    
    db.delete(mat)
    db.commit()
    return {"status": "deleted", "id": material_id}
