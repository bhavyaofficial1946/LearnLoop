import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from backend.app.schemas.syllabus import SyllabusExtractResponse
from backend.app.services.syllabus_service import SyllabusService
from backend.app.services.material_service import MaterialService

router = APIRouter(prefix="/syllabus", tags=["syllabus"])
logger = logging.getLogger("learnloop.api.syllabus")

@router.post("/extract-pdf", response_model=SyllabusExtractResponse)
async def extract_pdf_syllabus(file: UploadFile = File(...)):
    try:
        content = await file.read()
        MaterialService.validate_pdf_file(file, content)
        filename = file.filename or "syllabus.pdf"
        
        result = SyllabusService.process_pdf_syllabus(content, filename)
        return result
    except ValueError as e:
        logger.warning(f"Syllabus PDF extraction failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error parsing syllabus PDF: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="We couldn't process this PDF. You can enter the syllabus manually instead."
        )
