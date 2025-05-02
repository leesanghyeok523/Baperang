from pydantic import BaseModel
from typing import List, Dict, Any

# 식단 생성 요청 To LLM
class PlanRequest(BaseModel):
    leftover_data: Dict[str, float]
    preference_data: Dict[str, Dict[str, float]]

# 식단 생성 응답 From LLM
class PlanResponse(BaseModel):
    # 날짜별 메뉴 리스트
    plan: Dict[str, List[str]]



# 잔반 데이터 요청
class AnalyzeRequest(BaseModel):
    """S3에 저장된 이미지 키를 받아서 잔반 분석을 요청합니다."""
    image_s3_key: str

# 잔반 데이터 응답
class AnalyzeResponse(BaseModel):
    """메뉴별 잔반율을 반환합니다."""
    leftover: Dict[str, float]