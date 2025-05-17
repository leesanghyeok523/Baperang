# FAST API 진입점, router 등록
from fastapi import FastAPI
import uvicorn
import datetime
from .config import settings
from .api.routes import router

if settings.DEBUG:
    print(f"[MAIN] Initailizing {settings.API_TITLE} v{settings.API_VERSION}")

app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION
)
app.include_router(router)

# 상태 확인 엔드포인트
@app.get("/health")
async def health_check():
    """애플리케이션 상태 확인 엔드포인트"""
    if settings.DEBUG:
        print(f"[HEALTH] Health check called at {datetime.datetime.now()}")
    return {"status": "healty", "version": settings.API_VERSION}

# 메인 실행함수
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=settings.DEBUG, log_level="debug" if settings.DEBUG else "info")