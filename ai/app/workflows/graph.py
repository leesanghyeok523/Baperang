# LangGraph 워크플로우 정의 (식단 에이전트)
import asyncio
from typing import Dict, List, Any

from .agents import WastePlanAgent, NutritionPlanAgent, IntegrationAgent
from ..config import settings

class MenuPlanningWorkflow:
    """식단 계획 워크플로우"""

    def __init__(self):
        """워크플로우 초기화"""
        # 에이전트 초기화
        self.waste_agent = WastePlanAgent()
        self.nutrition_agent = NutritionPlanAgent()
        self.integration_agent = IntegrationAgent()
    
    async def run_workflow(self, init_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        워크플로우 실행

        Args:
            init_state: 초기 상태
        Returns:
            Dict: 최종 결과
        """
        # 디버그 로그
        if settings.DEBUG:
            print(f"[WORKFLOW] Starting workflow with state: {init_state}")
        
        # 1. 병렬로 잔반율 기반 식단과 영양소 기반 식단 생성
        waste_task = asyncio.create_task(self.waste_agent.process(init_state))
        nutrition_task = asyncio.create_task(self.nutrition_agent.process(init_state))

        # 병렬 실행 대기
        waste_result, nutrition_result = await asyncio.gather(waste_task, nutrition_task)

        # 2. 상태 업데이터
        state = {**init_state, **waste_result, **nutrition_result}

        # 디버그 로그
        if settings.DEBUG:
            print(f"[WORKFLOW] Intermediate state after agents : {state.keys()}")
        
        # 3. 통합 에이전트 실행
        final_result = await self.integration_agent.process(state)

        # 4. 최종 상태 업데이트
        state.update(final_result)

        # 디버그 로그
        if settings.DEBUG:
            print(f"[WORKFLOW] Workflow completed with result keys : {final_result.keys()}")
        
        return state