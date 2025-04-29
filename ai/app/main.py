# FAST API 진입점, router 등록
from fastapi import FastAPI
from app.routers import router

app = FastAPI(title="AI server", version="0.1.0")
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0,0,0", port=8000, log_level="info")