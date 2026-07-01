from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from app.core.dependencies import get_current_user
from app.db.connection import get_db
from app.schemas.material import UpdateMaterialInput
from app.services import material_service

router = APIRouter(tags=["Materials"])


# ── Upload material + files ───────────────────────────────────────────────────

@router.post("/classrooms/{classroom_id}/materials", status_code=status.HTTP_201_CREATED)
async def upload_material(
    classroom_id: int,
    title: str                      = Form(...),
    description: Optional[str]      = Form(None),
    visibility: str                 = Form("CENTRAL"),
    files: List[UploadFile]         = File(default=[]),
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    visibility = visibility.upper()
    if visibility not in ("CENTRAL", "PRIVATE"):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="visibility must be CENTRAL or PRIVATE")

    return await material_service.upload_material(
        conn,
        classroom_id=classroom_id,
        uploaded_by=current_user["id"],
        title=title,
        description=description,
        visibility=visibility,
        files=files,
    )


# ── Update material info ──────────────────────────────────────────────────────

@router.put("/classrooms/{classroom_id}/materials/{material_id}")
def update_material(
    classroom_id: int,
    material_id: int,
    body: UpdateMaterialInput,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return material_service.update_material(
        conn,
        classroom_id=classroom_id,
        material_id=material_id,
        user_id=current_user["id"],
        title=body.title,
        description=body.description,
    )


# ── Delete material ───────────────────────────────────────────────────────────

@router.delete("/classrooms/{classroom_id}/materials/{material_id}")
def delete_material(
    classroom_id: int,
    material_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return material_service.delete_material(conn, classroom_id, material_id, current_user["id"])


# ── Get central materials ─────────────────────────────────────────────────────

@router.get("/classrooms/{classroom_id}/materials/central")
def get_central_materials(
    classroom_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return material_service.get_central_materials(conn, classroom_id, current_user["id"])


# ── Get private materials (only own) ─────────────────────────────────────────

@router.get("/classrooms/{classroom_id}/materials/private")
def get_private_materials(
    classroom_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return material_service.get_private_materials(conn, classroom_id, current_user["id"])


# ── Get single material ───────────────────────────────────────────────────────

@router.get("/classrooms/{classroom_id}/materials/{material_id}")
def get_material(
    classroom_id: int,
    material_id: int,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_db),
):
    return material_service.get_material(conn, classroom_id, material_id, current_user["id"])