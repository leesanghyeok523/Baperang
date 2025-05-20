# 밥이랑 (Baperang) - AI 기반 스마트 급식 관리 시스템

<div align="center">
  <img src="https://github.com/your-username/baperang/raw/main/assets/logo.png" alt="밥이랑 로고" width="200"/>
  <p><i>스마트한 급식 관리, 건강한 식생활의 시작</i></p>
</div>

## 프로젝트 소개

밥이랑(Baperang)은 AI 기술을 활용한 차세대 스마트 급식 관리 시스템입니다. 급식소의 식단 계획, 영양 분석, 식자재 관리, 잔반량 모니터링 등을 자동화하고 최적화하여 효율적인 급식 운영을 지원합니다. 학교, 기업, 병원 등 다양한 단체 급식 환경에 적용할 수 있으며, 맞춤형 영양 관리와 식품 폐기물 감소에 기여합니다.

### 주요 기능

- 🤖 **AI 기반 식단 계획 및 영양 분석**: 영양 균형과 선호도를 고려한 최적 식단 자동 생성
- 📊 **실시간 식수 인원 및 잔반량 모니터링**: AI 이미지 분석을 통한 정확한 잔반량 측정
- 📱 **NFC 기반 학생 식수 관리**: 비접촉식 출입 및 식수 인원 자동 집계
- 📈 **데이터 기반 식자재 소요량 예측**: 식수 인원과 메뉴에 따른 최적 발주량 산출
- 📋 **영양사 맞춤형 식단 관리 도구**: 직관적인 UI로 식단 계획 및 관리 효율화
- 📲 **학생/학부모 피드백 시스템**: 선호도 조사와 영양 정보 제공으로 참여 독려

## 시스템 구성도

<div align="center">
  <img src="https://github.com/your-username/baperang/raw/main/assets/system-architecture.png" alt="시스템 구성도" width="800"/>
</div>

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
- YOLOv8 (식품 인식)
- MiDaS/DPT (깊이 추정)
- OpenCV (이미지 처리)
- LangChain 0.0.268+ (식단 추천)

### Hardware
- Python
- Flask
- NFC Reader Integration
- Embedded Linux

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

2. 환경 설정
```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 환경 변수 설정
```

3. Docker Compose 실행 (권장)
```bash
docker-compose up -d
```

### 수동 설치 (개발용)

1. Frontend 설정
```bash
cd frontend
npm install
npm run dev
```

2. Backend 설정
```bash
cd backend/baperang
./gradlew build
./gradlew bootRun
```

3. AI 서비스 설정
```bash
cd ai
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

4. 하드웨어 설정
```bash
cd hardware
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## 주요 기능 상세 설명

### 1. AI 기반 식단 관리
- 영양소 균형 자동 계산
- 급식 선호도 기반 메뉴 추천
- 식품 알레르기 자동 감지
- 계절 및 지역 특산물 연계 식단

### 2. 잔반량 모니터링 시스템
- 다중 AI 모델 융합 분석 (역투영, 깊이 추정, ResNet)
- 음식 종류별 잔반량 자동 측정
- 개인/학급/학년별 통계 대시보드
- 시각적 분석 리포트 자동 생성

### 3. NFC 기반 식수 관리
- 학생증/카드 기반 비접촉 체크인
- 실시간 식수 인원 집계
- 학생 출결 연동 가능
- 결제 시스템 통합 지원

### 4. 식자재 관리 및 발주 시스템
- 식수 인원 기반 소요량 자동 계산
- 식자재 재고 관리 및 알림
- 공급업체 연동 자동 발주
- 식재료 이력 추적

### 5. 데이터 분석 대시보드
- 영양사용 관리 패널
- 학교/기관 관리자용 통계
- 학생/학부모용 영양 정보
- 데이터 기반 개선 제안

## 프로젝트 구조
```
baperang/
├── frontend/          # React 기반 프론트엔드
│   ├── src/
│   │   ├── components/   # UI 컴포넌트
│   │   ├── pages/        # 페이지 컴포넌트
│   │   ├── services/     # API 통신 서비스
│   │   ├── stores/       # 상태 관리 스토어
│   │   └── ...
├── backend/           # Spring Boot 기반 백엔드
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   ├── controllers/  # API 컨트롤러
│   │   │   │   ├── services/     # 비즈니스 로직
│   │   │   │   ├── repositories/ # 데이터 액세스
│   │   │   │   └── ...
│   │   │   ├── resources/
│   │   └── ...
├── ai/                # AI 서비스
│   ├── app/
│   │   ├── services/       # AI 서비스 모듈
│   │   ├── models/         # 모델 정의
│   │   ├── utils/          # 유틸리티 함수
│   │   └── ...
│   ├── weights/            # 모델 가중치 파일
│   └── ...
├── hardware/          # 하드웨어 연동 서비스
│   ├── nfc/               # NFC 리더 모듈
│   ├── camera/            # 카메라 모듈
│   └── ...
├── docker/            # Docker 구성 파일
└── docs/              # 문서 및 가이드
```

## API 문서

각 서비스의 API 문서는 다음 링크에서 확인할 수 있습니다:

- Frontend API: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- Backend API: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
- AI Service API: [http://localhost:8000/docs](http://localhost:8000/docs)

## 개발 가이드라인

### 브랜치 전략
- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발 브랜치 (예: `feature/user-auth`)
- `hotfix/*`: 긴급 수정 브랜치 (예: `hotfix/login-bug`)

### 커밋 컨벤션
- `Feat`: 새로운 기능 추가
- `Fix`: 버그 수정
- `Docs`: 문서 수정
- `Style`: 코드 포맷팅, 세미콜론 누락 등 (기능 변경 없음)
- `Refactor`: 코드 리팩토링
- `Test`: 테스트 코드 추가
- `Chore`: 빌드 업무 수정, 패키지 매니저 설정 등

예시: `Feat: 사용자 로그인 기능 구현`

### 코드 리뷰 가이드라인
- PR 템플릿 사용 (`.github/PULL_REQUEST_TEMPLATE.md`)
- 최소 1명 이상의 리뷰어 승인 필요
- 모든 테스트 통과 확인
- 코드 스타일 가이드 준수 여부 확인

## 기여 방법

1. 프로젝트를 포크합니다.
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`).
3. 변경사항을 커밋합니다 (`git commit -m 'Feat: 놀라운 기능 추가'`).
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`).
5. Pull Request를 생성합니다.

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 팀원

- **Frontend**: 김개발, 이프론트
- **Backend**: 박백엔드, 최서버
- **AI**: 정인공지능, 한딥러닝
- **Hardware**: 강하드웨어, 윤임베디드

## 문의

- 이메일: contact@baperang.com
- 프로젝트 링크: [https://github.com/your-username/baperang](https://github.com/your-username/baperang)
- 웹사이트: [https://baperang.com](https://baperang.com)

## 스크린샷

<div align="center">
  <img src="https://github.com/your-username/baperang/raw/main/assets/screenshot1.png" alt="대시보드" width="400"/>
  <img src="https://github.com/your-username/baperang/raw/main/assets/screenshot2.png" alt="식단 관리" width="400"/>
  <img src="https://github.com/your-username/baperang/raw/main/assets/screenshot3.png" alt="잔반 분석" width="400"/>
  <img src="https://github.com/your-username/baperang/raw/main/assets/screenshot4.png" alt="통계 보고서" width="400"/>
</div>

## 프로젝트 상태

현재 이 프로젝트는 활발히 개발 중이며, 버전 1.0 출시를 목표로 하고 있습니다. 이슈 트래커를 통해 진행 상황을 확인할 수 있습니다.

## 감사의 말

- 지원과 조언을 아끼지 않은 [지원기관/회사명]에게 감사드립니다.
- 이 프로젝트는 [지원 프로그램명]의 지원을 받아 개발되었습니다.
