from fastapi import APIRouter
from backend.app.api.routes.students import router as students_router
from backend.app.api.routes.subjects import router as subjects_router
from backend.app.api.routes.workspaces import router as workspaces_router
from backend.app.api.routes.syllabus import router as syllabus_router
from backend.app.api.routes.materials import router as materials_router
from backend.app.api.routes.diagnostics import router as diagnostics_router

api_router = APIRouter()
api_router.include_router(students_router)
api_router.include_router(subjects_router)
api_router.include_router(workspaces_router)
api_router.include_router(syllabus_router)
api_router.include_router(materials_router)
api_router.include_router(diagnostics_router)
