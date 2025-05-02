# ai/Dockerfile

# 1) Python 베이스 이미지
FROM python:3.10.11-slim

# 2) 작업 디렉토리
WORKDIR /app

# 3) 의존성 복사 및 설치 (context: ai/)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4) 실제 애플리케이션 복사 (context: ai/app → 컨테이너 /app/)
COPY app/ ./app

# 5) 엔트리포인트 설정
EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
