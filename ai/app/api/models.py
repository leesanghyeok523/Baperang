from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import date

# 식단 생성 요청 To LLM
class PlanRequest(BaseModel):
    """Spring에서 전달받는 식단 생성 요청"""
    menu_data: Dict[str, Dict[str, Dict[str, Dict[str, Any]]]]  # {날짜: {메뉴명: {잔반율, 선호도, 영양소:{}}}}
    menu_pool: Optional[List[str]] = None # 사용 가능한 메뉴 목록

class MenuOption(BaseModel):
    """카테고리별 메뉴 옵션"""
    primary: str # 주 추천 옵션
    alternatives: List[str] = Field(..., min_items=1, max_items=3) # 최대 대체 메뉴 3개

class DailyMenu(BaseModel):
    """일별 식단 구성"""
    soup: MenuOption
    rice: MenuOption
    main: MenuOption
    side: List[MenuOption]

# 식단 생성 응답 From LLM
class PlanResponse(BaseModel):
    """FastAPI에서 Spring으로 보내는 응답"""
    # 날짜별 메뉴 리스트
    plan: Dict[str, DailyMenu] # {날짜: [메뉴명,]}
    metrics: Optional[Dict[str, Any]] = None # 평균 선호도, 평균 잔반율, 영양 균형, 메뉴 다양성 등 참고 자료

# 잔반 데이터 요청
class AnalyzeRequest(BaseModel):
    """S3에 저장된 이미지 키를 받아서 잔반 분석을 요청합니다."""
    image_s3_key: Dict[str,Any]

# 잔반 데이터 응답
class AnalyzeResponse(BaseModel):
    """메뉴별 잔반율을 반환합니다."""
    leftover: Dict[str, float]
    confidence: Optional[float] = None