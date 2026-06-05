"""
Internal endpoint: extracts text from an uploaded document (PDF / DOCX / PPTX)
entirely in memory and returns it.

The bytes are never written to disk and are released as soon as the request
completes. This route is called server-to-server by the quiz-service and is
protected by a shared internal API key (not exposed to browsers).
"""
import logging

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile

from ...agent.document import (
    DocumentExtractionError,
    UnsupportedDocumentError,
    extract_text,
    suggest_topic,
)
from ...config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])


def _require_internal_key(x_internal_api_key: str = Header(default="")) -> None:
    if x_internal_api_key != settings.internal_api_key:
        raise HTTPException(status_code=401, detail="Invalid internal API key")


@router.post("/extract")
async def extract_document(
    file: UploadFile = File(...),
    _: None = Depends(_require_internal_key),
) -> dict:
    data = await file.read()
    try:
        if not data:
            raise HTTPException(status_code=400, detail="Empty file")
        if len(data) > settings.max_upload_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"File too large (max {settings.max_upload_bytes // (1024 * 1024)} MB)",
            )

        try:
            text = extract_text(
                file.filename or "", data, max_chars=settings.max_source_chars
            )
        except UnsupportedDocumentError as exc:
            raise HTTPException(status_code=415, detail=str(exc)) from exc
        except DocumentExtractionError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        if len(text.strip()) < 30:
            raise HTTPException(
                status_code=422,
                detail="Could not extract readable text from the document.",
            )

        logger.info(
            "Extracted %d chars from '%s'", len(text), file.filename
        )
        return {
            "filename": file.filename,
            "char_count": len(text),
            "suggested_topic": suggest_topic(text, file.filename or ""),
            "text": text,
        }
    finally:
        # Release the in-memory buffer; nothing is cached or persisted.
        del data
        await file.close()
