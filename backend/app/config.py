from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/salesdb"
    JWT_SECRET: str = "change-me-in-production-use-at-least-32-chars"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 30
    REDIS_URL: str = "redis://localhost:6379/0"
    UPLOAD_DIR: str = "/tmp/uploads"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
