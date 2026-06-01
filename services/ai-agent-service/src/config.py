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


settings = Settings()
