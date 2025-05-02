# 1) Python 3.10 베이스 이미지
FROM python:3.10.11-slim

# 2) 작업 디렉토리
WORKDIR /app

# 3) 의존성 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4) 애플리케이션 복사
COPY app/ ./app

# 5) 포트 노출
EXPOSE 8001

# 6) 실행 커맨드 (예: uvicorn)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
