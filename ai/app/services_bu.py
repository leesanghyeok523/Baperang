# 이미지 처리·Inference·부피·LLM 워크플로우 함수 모음
import os
from typing import Dict, List
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

from .config import OPENAI_API_KEY
from .core.prompts import make_waste_prompt, make_nutrition_prompt, make_integration_prompt
from .utils import get_leftover_data, get_nutrition_data

print("[DEBUG] OPENAI_API_KEY", OPENAI_API_KEY)

# LLM 클라이언트 초기화
llm_gpt4 = ChatOpenAI(
    model_name="gpt-4",
    temperature=0.2,
    openai_api_key=OPENAI_API_KEY,
    )

print(f"[DEBUG] config.OPENAI_API_KEY: {OPENAI_API_KEY}")

# 이미지 key를 받아서 잔반 반환 함수
async def analyze_leftover(image_s3_key: str) -> Dict[str, float]:
    """
    실제라면 S3에서 이미지 내려받고 YOLO/Depth 분석을 하겠지만,
    PoC 단계에서는 utils.get_dummy_leftover_data() 를 그대로 반환합니다.
    """
    # 나중에 S3 다운로드 + YOLO 추론 + 부피 계산 로직으로 대체
    return get_leftover_data()

async def generate_waste_plan(leftover_data: Dict[str, float]) -> Dict[str, List[str]]:
    """
    잔반율을 개선하는 방향으로 식단 생성
    """
    prompt = make_waste_prompt(leftover_data)
    resp = await llm_gpt4.ainvoke([HumanMessage(content=prompt)])
    # 응답을 파싱하여 JSON으로 변환
    # 응답 예시: {"2025-05-02": ["식사1", "식사2"], "2025-05-03": ["식사3"], "2025-05-04": ["식사4"]}
    # PoC 용으로는 간단 파싱
    return parse_plan_text(resp.content)

async def generate_nutrition_plan(preference_data: Dict[str, Dict[str, float]]) -> Dict[str, List[str]]:
    """
    영양소 개선 식단 생성
    """
    ratings = preference_data.get("average_rating", {})
    prompt = make_nutrition_prompt(ratings)
    resp = await llm_gpt4.ainvoke([HumanMessage(content=prompt)])
    return parse_plan_text(resp.content)


async def integrate_plans(waste: Dict[str, List[str]], nutrition: Dict[str, List[str]]) -> Dict[str, List[str]]:
    """
    잔반율과 영양소를 통합하여 식단 생성
    """
    prompt = make_integration_prompt(waste=waste, nutrition=nutrition)
    resp = await llm_gpt4.ainvoke([HumanMessage(content=prompt)])
    return parse_plan_text(resp.content)


# 파싱 함수
def parse_plan_text(text: str) -> Dict[str, List[str]]:
    plan: Dict[str, List[str]] = {}
    for line in text.splitlines():
        if ":" in line:
            date, menus = line.split(":")
            items = [m.strip() for m in menus.split(",")]
            plan[date.strip()] = items
    return plan


