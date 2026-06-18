from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # GROQ
    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"

    # RabbitMQ
    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"
    rabbitmq_queue_consume: str = "quiz.generate"
    rabbitmq_queue_publish: str = "quiz.generated"

    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db: str = "quizai"

    # Internal
    internal_api_key: str = "changeme"
    
    # Qdrant
    qdrant_url: str = "http://qdrant:6333"

    # Browser Use — deep web search before quiz generation (opt-in per request)
    browser_use_api_key: str = ""                  # empty disables deep search
    browser_use_base_url: str = "https://api.browser-use.com"
    browser_use_timeout: float = 180.0             # overall budget for one research run (s)
    browser_use_poll_interval: float = 3.0         # delay between task status polls (s)
    deep_search_context_chars: int = 6000          # cap on web context fed to the LLM

    # Document upload + RAG (all ephemeral / in-memory)
    max_upload_bytes: int = 15 * 1024 * 1024  # 15 MB hard limit on uploads
    max_source_chars: int = 60000             # cap on forwarded document text
    doc_overview_chars: int = 4000            # slice fed to the planner
    rag_chunk_size: int = 900                 # words per retrieval chunk
    rag_chunk_overlap: int = 150              # word overlap between chunks
    rag_k: int = 3                            # chunks retrieved per subtopic
    rag_context_chars: int = 6000             # cap on grounding context


settings = Settings()
