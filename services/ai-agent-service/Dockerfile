FROM python:3.11-slim

WORKDIR /app

COPY services/ai-agent-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY services/ai-agent-service/src/ ./src/
COPY shared/ ./shared/

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
