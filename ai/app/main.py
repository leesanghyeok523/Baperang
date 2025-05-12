# FAST API 진입점, router 등록
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from .api.routes import router
from .config import settings

app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION
)
app.include_router(router)

# 상태 확인 엔드포인트
@app.get("/health")
async def health_check():
    """애플리케이션 상태 확인 엔드포인트"""
    return {"status": "healty", "version": settings.API_VERSION}

# 메인 실행함수
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=settings.DEBUG, log_level="debug" if settings.DEBUG else "info")