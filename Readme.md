# 밥이랑 (Baperang) - AI 기반 스마트 급식 관리 시스템

## 프로젝트 소개
밥이랑은 AI 기술을 활용한 스마트 급식 관리 시스템입니다. 급식소의 식단 계획, 영양 분석, 식자재 관리 등을 자동화하고 최적화하여 효율적인 급식 운영을 지원합니다.

### 주요 기능
- 🤖 AI 기반 식단 계획 및 영양 분석
- 📊 실시간 식수 인원 및 잔반량 모니터링
- 📱 NFC 기반 학생 식수 관리
- 📈 데이터 기반 식자재 소요량 예측
- 📋 영양사 맞춤형 식단 관리 도구

## 기술 스택

### Frontend
- React 19.0.0
- TypeScript 5.7.2
- Vite 6.3.1
- TailwindCSS 3.4.1
- Chart.js 4.4.9
- Zustand 5.0.3

### Backend
- Spring Boot 3.4.5
- Java 17
- Spring Security
- Spring Data JPA
- QueryDSL 5.0.0
- MySQL/PostgreSQL
- JWT

### AI
- Python 3.8+
- PyTorch 2.1+
- FastAPI 0.110+
- YOLOv8
- MiDaS/DPT (깊이 추정)
- LangChain 0.0.268+

### Hardware
- Python
- Flask
- NFC Reader Integration

## 설치 방법

### 필수 요구사항
- Node.js 18+
- Java 17
- Python 3.8+
- Docker & Docker Compose
- MySQL/PostgreSQL
- NFC Reader (하드웨어 연동 시)

### 설치 단계

1. 저장소 클론
```bash
git clone https://github.com/your-username/baperang.git
cd baperang
```

2. Frontend 설정
```bash
cd frontend
npm install
npm run dev
```

3. Backend 설정
```bash
cd backend/baperang
./gradlew build
./gradlew bootRun
```

4. AI 서비스 설정
```bash
cd ai
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

5. 하드웨어 설정
```bash
cd hardware
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## 프로젝트 구조
```
baperang/
├── frontend/          # React 기반 프론트엔드
├── backend/          # Spring Boot 기반 백엔드
├── ai/              # AI 서비스
└── hardware/        # 하드웨어 연동 서비스
```

## 개발 가이드라인

### 브랜치 전략
- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발 브랜치
- `hotfix/*`: 긴급 수정 브랜치

### 커밋 컨벤션
- `Feat`: 새로운 기능
- `Fix`: 버그 수정
- `Docs`: 문서 수정
- `Style`: 코드 포맷팅
- `Refactor`: 코드 리팩토링
- `Test`: 테스트 코드
- `Chore`: 빌드 업무 수정

## API 문서
- Frontend API: [링크]
- Backend API: [링크]
- AI Service API: [링크]

## 기여 방법
1. Fork the Project
2. Create your Feature Branch
3. Commit your Changes
4. Push to the Branch
5. Open a Pull Request

## 라이선스
이 프로젝트는 MIT 라이선스를 따릅니다.

## 팀원
- Frontend: [팀원명]
- Backend: [팀원명]
- AI: [팀원명]
- Hardware: [팀원명]

## 문의
- 이메일: [이메일 주소]
- 프로젝트 링크: [GitHub 저장소 링크]
