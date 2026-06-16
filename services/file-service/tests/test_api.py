import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.config import settings
import io
import json

client = TestClient(app)

def test_extract_document_no_auth():
    response = client.post("/documents/extract", files={"file": ("test.txt", b"hello", "text/plain")})
    assert response.status_code == 401

def test_extract_document_unsupported_type():
    headers = {"X-Internal-Api-Key": settings.internal_api_key}
    response = client.post("/documents/extract", headers=headers, files={"file": ("test.txt", b"hello", "text/plain")})
    assert response.status_code == 415

def test_anki_generate_no_auth():
    response = client.post("/anki/generate", data={"title": "Test", "questions_json": "[]"})
    assert response.status_code == 401

def test_anki_generate_invalid_json():
    headers = {"X-Internal-Api-Key": settings.internal_api_key}
    response = client.post(
        "/anki/generate", 
        headers=headers, 
        data={"title": "TestDeck", "questions_json": "invalid-json"}
    )
    assert response.status_code == 400

def test_anki_generate_valid():
    headers = {"X-Internal-Api-Key": settings.internal_api_key}
    questions = [{"question": "Q1", "answer": "A1"}]
    response = client.post(
        "/anki/generate", 
        headers=headers, 
        data={"title": "TestDeck", "questions_json": json.dumps(questions)}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/apkg"
    assert "TestDeck.apkg" in response.headers["content-disposition"]
    assert len(response.content) > 0
