import logging
from fastapi import FastAPI, Depends, File, Header, HTTPException, UploadFile, Form
from fastapi.responses import Response
import json
import genanki
import random
import tempfile
import os

from src.extractor import extract_text, suggest_topic, UnsupportedDocumentError, DocumentExtractionError
from src.config import settings

from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import uuid
from pathlib import Path

_embed_model = None

def get_embed_model():
    global _embed_model
    if _embed_model is None:
        _embed_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embed_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="File Service")

def _require_internal_key(x_internal_api_key: str = Header(default="")) -> None:
    if x_internal_api_key != settings.internal_api_key:
        raise HTTPException(status_code=401, detail="Invalid internal API key")

@app.post("/documents/extract")
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
        del data
        await file.close()

@app.post("/anki/generate")
async def generate_anki(
    title: str = Form(...),
    questions_json: str = Form(...),
    _: None = Depends(_require_internal_key),
) -> Response:
    """
    Takes a title and a JSON string of questions, and returns a .apkg file.
    questions_json format: [{"question": "Q1", "answer": "A1"}, ...]
    """
    try:
        questions = json.loads(questions_json)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format for questions")
        
    deck_id = random.randrange(1 << 30, 1 << 31)
    deck = genanki.Deck(deck_id, title)
    
    model_id = random.randrange(1 << 30, 1 << 31)
    model = genanki.Model(
      model_id,
      'Simple Model',
      fields=[
        {'name': 'Question'},
        {'name': 'Answer'},
      ],
      templates=[
        {
          'name': 'Card 1',
          'qfmt': '{{Question}}',
          'afmt': '{{FrontSide}}<hr id="answer">{{Answer}}',
        },
      ])
      
    for q in questions:
        note = genanki.Note(
          model=model,
          fields=[q.get('question', ''), q.get('answer', '')]
        )
        deck.add_note(note)
        
    package = genanki.Package(deck)
    
    with tempfile.NamedTemporaryFile(delete=False, suffix='.apkg') as temp_file:
        package.write_to_file(temp_file.name)
        temp_file.seek(0)
        content = temp_file.read()
        
    os.unlink(temp_file.name)
    
    return Response(
        content=content,
        media_type="application/apkg",
        headers={"Content-Disposition": f'attachment; filename="{title}.apkg"'}
    )

@app.post("/buddy/upload")
async def buddy_upload(
    file: UploadFile = File(...),
    user_id: str | None = Form(None)
) -> dict:
    data = await file.read()
    try:
        if not data:
            raise HTTPException(status_code=400, detail="Empty file")
        
        try:
            text = extract_text(file.filename or "", data)
        except UnsupportedDocumentError as exc:
            raise HTTPException(status_code=415, detail=str(exc)) from exc
        except DocumentExtractionError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        if not text.strip():
            raise HTTPException(status_code=422, detail="Could not extract readable text")

        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = splitter.split_text(text)

        if not chunks:
            raise HTTPException(status_code=422, detail="No chunks generated from text")

        model = get_embed_model()
        embeddings = model.encode(chunks)

        session_id = str(uuid.uuid4())
        qdrant_url = os.environ.get("QDRANT_URL", "http://qdrant:6333")
        client = QdrantClient(url=qdrant_url)

        client.create_collection(
            collection_name=session_id,
            vectors_config=VectorParams(size=model.get_sentence_embedding_dimension(), distance=Distance.COSINE)
        )

        points = [
            PointStruct(
                id=i,
                vector=embedding.tolist(),
                payload={"text": chunk}
            )
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
        ]

        client.upsert(collection_name=session_id, points=points)

        title = Path(file.filename or "document").stem
        return {"session_id": session_id, "title": title}
    finally:
        del data
        await file.close()

@app.delete("/buddy/{session_id}")
async def buddy_delete(session_id: str) -> dict:
    qdrant_url = os.environ.get("QDRANT_URL", "http://qdrant:6333")
    client = QdrantClient(url=qdrant_url)
    try:
        client.delete_collection(collection_name=session_id)
    except Exception as e:
        logger.error(f"Failed to delete collection {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete session")
    return {"status": "success"}
