from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    internal_api_key: str = "changeme"
    max_upload_bytes: int = 10 * 1024 * 1024  # 10 MB
    max_source_chars: int = 100000

settings = Settings()
