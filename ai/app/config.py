# env 등 각종 자격 
import os
from dotenv import load_dotenv
from functools import lru_cache # Least Recently Used Cache_함수호출결과 캐싱
from pydantic_settings import BaseSettings

load_dotenv()

class Settings(BaseSettings):
    """ 애플리케이션 설정 """
    # API 키 및 서비스 접속 정보
    OPENAI_API_KEY:str = os.getenv("OPENAI_API_KEY", "")

    # 벡터 DB 연결 시 사용
    # DATABASE_URL:str = os.getenv("DATABASE_URL", "")

    # LLM 설정
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4")
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.2"))

    # API 설정
    API_TITLE: str = "AI system"
    API_VERSION: str = "0.0.1"

    # 로깅 설정 -> DEBUG 면 로그에 민감한 것 설정
    DEBUG: bool = os.getenv("DEBUG", "False")

    class Config:
        env_file = ".env"

# print(f"[CONFIG DEBUG] OPENAI_API_KEY: {OPENAI_API_KEY}")

@lru_cache
def get_settings() -> Settings:
    """설정 싱글톤 인스턴스(항상 동일한 인스턴스) 반환"""
    return Settings()

# 설정 인스턴스 생성
settings = get_settings()

# 디버그 로그
if settings.DEBUG:
    print(f"[CONFIG] DEBUG mode: {settings.DEBUG}")
    print(f"[CONFIG] OPENAI_API_KEY: {settings.OPENAI_API_KEY[:4] if settings.OPENAI_API_KEY else 'Not set'}...")
    print(f"[CONFIG] LLM_MODEL: {settings.LLM_MODEL}")