import pytest
from src.extractor import suggest_topic, UnsupportedDocumentError, extract_text

def test_suggest_topic_from_filename():
    assert suggest_topic("Hello World", "my_document_name.pdf") == "my document name"

def test_suggest_topic_from_text():
    assert suggest_topic("This is the first line.\nSecond line.", "") == "This is the first line."

def test_extract_text_unsupported_extension():
    with pytest.raises(UnsupportedDocumentError):
        extract_text("unknown.xyz", b"fake-data")
