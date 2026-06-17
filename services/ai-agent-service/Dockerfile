FROM python:3.11-slim

WORKDIR /app

COPY services/ai-agent-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download SentenceTransformer model to avoid runtime DNS issues or slowness
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

COPY services/ai-agent-service/src/ ./src/
COPY shared/ ./shared/

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
