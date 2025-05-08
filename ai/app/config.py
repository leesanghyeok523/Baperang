# env 등 각종 자격 
import os
from dotenv import load_dotenv
from functools import Iru_cache
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

    # 로깅 설정
    DEBUG: bool = os.getenv("DEBUG", "False")

    class Config:
        env_file = ".env"

# print(f"[CONFIG DEBUG] OPENAI_API_KEY: {OPENAI_API_KEY}")