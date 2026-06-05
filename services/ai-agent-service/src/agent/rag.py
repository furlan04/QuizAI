"""
Ephemeral, in-memory RAG retrieval used to ground quiz generation in an
uploaded document.

The index is built per request from the document text and discarded when the
request ends — nothing is embedded into a model, persisted, or cached. Retrieval
is lexical (BM25), so there are no model downloads and no external calls.
"""
import re

from rank_bm25 import BM25Okapi

_TOKEN_RE = re.compile(r"[a-zA-Z0-9àèéìòùáéíóúäöü']+", re.UNICODE)


def _tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall(text.lower())


def chunk_text(text: str, chunk_size: int = 900, overlap: int = 150) -> list[str]:
    """Split text into overlapping word windows (cheap, model-free)."""
    words = text.split()
    if not words:
        return []
    if chunk_size <= 0:
        return [text]

    step = max(1, chunk_size - overlap)
    chunks: list[str] = []
    for start in range(0, len(words), step):
        window = words[start:start + chunk_size]
        if not window:
            break
        chunks.append(" ".join(window))
        if start + chunk_size >= len(words):
            break
    return chunks


class DocumentIndex:
    """BM25 index over the chunks of a single document. In-memory only."""

    def __init__(self, text: str, chunk_size: int = 900, overlap: int = 150):
        pairs = [
            (chunk, _tokenize(chunk))
            for chunk in chunk_text(text, chunk_size, overlap)
        ]
        pairs = [(chunk, tokens) for chunk, tokens in pairs if tokens]
        self.chunks = [chunk for chunk, _ in pairs]
        self._tokenized = [tokens for _, tokens in pairs]
        self._bm25 = BM25Okapi(self._tokenized) if self._tokenized else None

    def __bool__(self) -> bool:
        return self._bm25 is not None

    def retrieve(self, query: str, k: int = 3) -> list[str]:
        if not self._bm25:
            return []
        query_tokens = _tokenize(query)
        if not query_tokens:
            return []
        scores = self._bm25.get_scores(query_tokens)
        ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
        return [self.chunks[i] for i in ranked[:k] if scores[i] > 0]

    def build_context(self, queries, k_per_query: int = 3, max_chars: int = 6000) -> str:
        """
        Retrieve the most relevant chunks for the given queries (e.g. subtopics),
        de-duplicate them, and concatenate up to max_chars of grounding context.
        """
        seen: set[str] = set()
        ordered: list[str] = []
        for query in queries:
            for chunk in self.retrieve(query, k_per_query):
                key = chunk[:80]
                if key in seen:
                    continue
                seen.add(key)
                ordered.append(chunk)

        # Fallback for very short or low-overlap documents: use the leading chunks.
        if not ordered:
            ordered = self.chunks[:3]

        context = ""
        for chunk in ordered:
            if len(context) + len(chunk) + 2 > max_chars:
                break
            context += chunk + "\n\n"
        return context.strip()
