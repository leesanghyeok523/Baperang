# 이미지 처리·Inference·부피·LLM 워크플로우 함수 모음
from typing import Dict, List
from langchain.chat_models import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from prompts import make_waste_prompt, make_nutrition_prompt, integration_prompt
from utils import get_leftover_data, get_nutrition_data

# LLM 클라이언트 초기화
llm_gpt4 = ChatOpenAI(
    model="gpt-4",
    temperature=0.2
    )
llm_claude = ChatAnthropic(
    model="claude-2",
    temperature=0.2
    )

async def generate_waste_plan() -> Dict[str, List[str]]:
    """
    잔반율을 개선하는 방향으로 식단 생성
    """
    data = get_leftover_data()
    prompt = make_waste_prompt(data)
    resp = await llm_claude.apredict(messages=[{"role": "user", "content": prompt}])
    # 응답을 파싱하여 JSON으로 변환
    # 응답 예시: {"2025-05-02": ["식사1", "식사2"], "2025-05-03": ["식사3"], "2025-05-04": ["식사4"]}
    # PoC 용으로는 간단 파싱
    return parse_plan_text(resp)

async def generate_nutrition_plan() -> Dict[str, List[str]]:
    """
    영양소 개선 식단 생성
    """
    data = get_nutrition_data()
    prompt = make_nutrition_prompt(data)
    resp = await llm_gpt4.apredict(messages=[{"role": "user", "content": prompt}])
    return parse_plan_text(resp)


async def integrate_plans(waste: Dict[str, List[str]], nutrition: Dict[str, List[str]]) -> Dict[str, List[str]]:
    """
    잔반율과 영양소를 통합하여 식단 생성
    """
    prompt = integration_prompt(waste=waste, nutrition=nutrition)
    resp = await llm_gpt4.apredict(messages=[{"role": "user", "content": prompt}])
    return parse_plan_text(resp)


# 파싱 함수
def parse_plan_text(text: str) -> Dict[str, List[str]]:
    plan = {}
    for line in text.splitlines():
        if ":" in line:
            date, menus = line.split(":")
            items = [m.strip() for m in menus.split(",")]
            plan[date.strip()] = items
    return plan


# 이미지 key를 받아서 잔반 반환 함수
async def analyze_leftover(image_s3_key: str) -> Dict[str, float]:
    """
    실제라면 S3에서 이미지 내려받고 YOLO/Depth 분석을 하겠지만,
    PoC 단계에서는 utils.get_dummy_leftover_data() 를 그대로 반환합니다.
    """
    # 나중에 S3 다운로드 + YOLO 추론 + 부피 계산 로직으로 대체
    return get_leftover_data()