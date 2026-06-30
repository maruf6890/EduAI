import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
)

ALLOWED_TYPES = {
    "image/jpeg":       "image",
    "image/png":        "image",
    "image/gif":        "image",
    "image/webp":       "image",
    "application/pdf":  "raw",
    "application/msword": "raw",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "raw",
    "application/vnd.ms-powerpoint": "raw",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "raw",
    "application/zip":  "raw",
    "application/x-zip-compressed": "raw",
}

MAX_SIZE_MB = 10


async def upload_file_to_cloudinary(file: UploadFile, folder: str) -> dict:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' not allowed. Allowed: images, PDF, Word, PowerPoint, ZIP",
        )

    contents = await file.read()

    if len(contents) / (1024 * 1024) > MAX_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size is {MAX_SIZE_MB}MB",
        )

    resource_type = ALLOWED_TYPES[file.content_type]

    ct = file.content_type
    if ct.startswith("image/"):
        file_type = "image"
    elif ct == "application/pdf":
        file_type = "pdf"
    elif "word" in ct:
        file_type = "docx"
    elif "powerpoint" in ct or "presentation" in ct:
        file_type = "pptx"
    elif "zip" in ct:
        file_type = "zip"
    else:
        file_type = "other"

    try:
        result = cloudinary.uploader.upload(
            contents,
            folder=folder,
            resource_type=resource_type,
            use_filename=True,
            unique_filename=True,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}",
        )

    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
        "original_filename": file.filename,
        "file_type": file_type,
        "size_bytes": len(contents),
    }


async def delete_file_from_cloudinary(public_id: str, resource_type: str = "raw") -> None:
    try:
        cloudinary.uploader.destroy(public_id, resource_type=resource_type)
    except Exception:
        pass