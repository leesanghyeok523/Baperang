from typing import Dict, List, Any
import json

from ..services.llm_service import LLMService
from ..core.prompts import PromptTemplates

class WastePlanAgent:
    """잔반율 기반 식단 생성 에이전트"""  
    
    def __init__(self):
        """에이전트 초기화"""
        self.llm_service = LLMService()

    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        상태를 처리하여 잔반율 기반 식단 생성
        
        Args:
            state: 현재 상태
        Returns:
            Dict: 처리 결과
        """

        leftover_data = state.get("leftover_data", {})
        date_range = state.get("date_range", {})
        menu_pool = state.get("menu_pool", [])

        # 프롬프트 생성
        prompt = PromptTemplates.waste_based_templates(
            leftover_data=leftover_data,
            date_range=date_range,
            menu_pool=menu_pool
        )

        # LLM 호출
        waste_plan = await self.llm_service.generate_structured_response(prompt)

        # 결과 반환
        return {"waste_plan": waste_plan}
    
class NutritionPlanAgent:
    """영양소 기반 식단 생성 에이전트"""

    def __init__(self):
        """에이전트 초기화"""
        self.llm_service = LLMService()

    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        상태를 처리하여 영양소 기반 식단 생성

        Args:
            state: 현재 상태
        Returns:
            Dict: 처리 결과
        """
        # 필요한 데이터 추출
        preference_data = state.get("preference_data", {})
        date_range = state.get("date_range", {})
        menu_pool = state.get("menu_pool", {})

        # 프롬프트 생성
        prompt = PromptTemplates.nutrition_based_template(
            preference_data=preference_data,
            date_range=date_range,
            menu_pool=menu_pool
        )

        # LLM 호출
        nutrition_plan = await self.llm_service.generate_structured_response(prompt)

        # 결과 반환
        return {"nutrition_plan" : nutrition_plan}
    
class IntegrationAgent:
    """식단 통합 에이전트"""

    def __init__(self):
        """에이전트 초기화"""
        self.llm_service = LLMService()

    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        잔반율 식단과 영양소 기반 식단을 통합

        Args:
            state: 현재 상태

        Returns:
            Dict: 처리 결과
        """
        # 필요한 데이터 추출
        waste_plan = state.get("waste_plan", {})
        nutrition_plan = state.get("nutrition_plan", {})

        # 프롬프트 생성
        prompt = PromptTemplates.integration_template(
            waste_plan=waste_plan,
            nutrition_plan=nutrition_plan
        )

        # LLM 호출
        integrated_plan = await self.llm_service.generate_structured_response(prompt)

        # 통합 식단 평가 (메트릭 계산)
        metrics = self._calculate_metrics(integrated_plan, state)

        # 결과 반환
        return {
            "integrated_plan": integrated_plan,
            "metrics": metrics
        }
    
    def _calculate_metrics(self, plan: Dict[str, List[str]], state: Dict[str, Any]) -> Dict[str, Any]:
        """
        식단 평가 메트릭 계산(현재는 쓸지 안 쓸지 모름)

        Args:
            plan: 통합 식단
            state: 현재 상태
        Returns:
            Dict: 평가 메트릭
        """
        # 선호도 데이터 추출
        preference_data = state.get("preference_data", {}).get("average_rating", {})

        # 잔반율 데이터 추출
        leftover_data = state.get("leftover_data", {})

        # 선호도 평균 계산
        total_pref = 0
        count_pref = 0

        # 잔반율 평균 계산
        total_leftover = 0
        count_leftover = 0

        # 각 메뉴에 대해 계산
        for date, menus in plan.items():
            for menu in menus:
                # 선호도 집계
                if menu in preference_data:
                    total_pref += preference_data[menu]
                    count_pref += 1
                
                # 잔반율 집계
                if menu in leftover_data:
                    total_leftover += preference_data[menu]
                    count_leftover += 1
        
        # 평균 계산
        avg_preference = total_pref / count_pref if count_pref > 0 else 0
        avg_leftover = total_leftover / count_leftover if count_leftover > 0 else 0

        # 결과 반환
        return {
            "avg_preference" : avg_preference,
            "avg_leftover" : avg_leftover,
            "menu_count" : sum(len(menus) for menus in plan.values())
        }