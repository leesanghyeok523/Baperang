# 멀티 에이전트용 프롬프트 템플릿
from typing import Dict, Any

# 잔반량 기반 프롬프트
WASTE_TEMPLATE = """
당신은 급식 메뉴를 계획하는 영양사입니다.
지난달 날짜별 잔반율은 다음과 같습니다:
{data}
각 날짜별로 잔반을 줄이기 위한 메뉴 초안을 'YYYY-MM-DD: 메뉴1, 메뉴2, ...' 형식으로 작성해주세요.
"""

# 영양소 기반 프롬프트
NUTRITION_TEMPLATE = """
당신은 영양학에 정통한 식단 플래너입니다.
목표 영양소는 다음과 같습니다:
{data}
각 날짜별로 영양 목표를 만족하는 메뉴 초안을 'YYYY-MM-DD: 메뉴1, 메뉴2, ...' 형식으로 작성해주세요.
"""

# 통합 프롬프트
INTEGRATION_TEMPLATE = """
당신은 잔반 최소화 에이전트와 영양 균형 에이전트의 결과를 조화롭게 결합하는 관리자입니다.
잔반 초안: {waste}
영양소 초안: {nutrition}
위 두 결과를 고려해 최종 식단을 날짜별 'YYYY-MM-DD: 메뉴1, 메뉴2, ...' 형식으로 출력해주세요.
"""

# 프롬프트 생성 함수
def make_waste_prompt(data: Dict[str, float]) -> str:
    summary = "\n".join(f"{d}: {r}" for d, r in data.items())
    return WASTE_TEMPLATE.format(data=summary)

def make_nutrition_prompt(data: Dict[str, Any]) -> str:
    summary = ", ".join(f"{k}={v}" for k, v in data.items())
    return NUTRITION_TEMPLATE.format(data=summary)

def make_integration_prompt(waste: str, nutrition: str) -> str:
    return INTEGRATION_TEMPLATE.format(waste=waste, nutrition=nutrition)

print(__file__)