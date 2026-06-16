"""Unit tests for the document extractor and the ephemeral BM25 RAG index."""
import io

import pytest

from src.agent.rag import DocumentIndex, chunk_text


# ── Chunking ─────────────────────────────────────────────────────────────────

def test_chunk_text_overlaps_and_covers():
    words = " ".join(f"w{i}" for i in range(100))
    chunks = chunk_text(words, chunk_size=30, overlap=10)
    assert len(chunks) >= 4
    # Every chunk has at most chunk_size words
    assert all(len(c.split()) <= 30 for c in chunks)
    # Last original word appears in the final chunk (full coverage)
    assert "w99" in chunks[-1]


def test_chunk_text_empty():
    assert chunk_text("", 30, 10) == []


# ── Retrieval ────────────────────────────────────────────────────────────────

def test_retrieve_ranks_discriminative_terms():
    text = (
        "Photosynthesis converts sunlight into chemical energy in plants. " * 10
        + "Mitochondria produce ATP via cellular respiration in animal cells. " * 3
    )
    idx = DocumentIndex(text, chunk_size=20, overlap=5)
    assert bool(idx) is True
    hits = idx.retrieve("ATP cellular respiration mitochondria", k=3)
    assert hits, "expected at least one chunk for a discriminative query"
    assert any("ATP" in h for h in hits)


def test_build_context_dedupes_and_caps():
    text = "alpha beta gamma delta epsilon zeta eta theta iota kappa " * 40
    idx = DocumentIndex(text, chunk_size=15, overlap=3)
    ctx = idx.build_context(["alpha beta", "gamma delta"], k_per_query=3, max_chars=200)
    assert 0 < len(ctx) <= 200


def test_empty_document_index_is_falsy_and_safe():
    idx = DocumentIndex("", 20, 5)
    assert bool(idx) is False
    assert idx.retrieve("anything") == []
    # Fallback path: no chunks -> empty context, never raises
    assert idx.build_context(["q"]) == ""



