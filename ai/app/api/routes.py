from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from typing import Dict, List, Any

from .models import (
    PlanRequest,
    PlanResponse,
    AnalyzeRequest,           
    AnalyzeResponse,          
)

from ..services.menu_service import MenuService
from ..services.analyze_service import AnalyzeService
from ..workflows.graph import MenuPlanningWorkflow
import asyncio


# from ..services import (
#     generate_waste_plan,
#     generate_nutrition_plan,
#     integrate_plans,
#     analyze_leftover
# )

router = APIRouter(prefix="/ai")


# 서비스 의존성
def get_menu_service():
    return MenuService()

def get_analyze_service():
    return AnalyzeService()

def get_workflow_service():
    return MenuPlanningWorkflow()


@router.post("/analyze-leftover", response_model=AnalyzeResponse)
async def analyze_leftover_endpoint(
    request: AnalyzeRequest,
    analyze_service:AnalyzeService = Depends(get_analyze_service)
):
    """
    잔반 이미지 분석 엔드포인트

    이미지를 분석하여 메뉴별 잔반율을 반환

    POST /analyze-leftover
    { "image_s3_key": "2025/05/01/rice_plate.png" }
    → { "leftover": { "밥":0.45, "국":0.30, ... } }
    """
    try:
        result = await analyze_service.analyze_image(request.image_s3_key)
        return AnalyzeResponse(leftover=result["leftover"], confidence=result.get("confidence"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이미지 분석 중 오류: {str(e)}")

@router.post("/menu-plan", response_model=PlanResponse)
async def generate_menu_plan(
    request: PlanRequest,
    menu_service: MenuService = Depends(get_menu_service),
    workflow: MenuPlanningWorkflow = Depends(get_workflow_service)
):
    """
    통합 식단 계획 생성 엔드포인트
    
    선호도와 잔반율, 영양 데이터 기반으로 식단 셍성
    """
    try:
        # 메뉴 데이터 추출 및 LLM 입력용으로 변환
        processed_data = await menu_service.extract_menu_data(request.historical_data)
        optimized_data = await menu_service.prepare_for_llm(request.hstorical_data)

        # 워크 플로우 실행
        result = await workflow.run_workflow(optimized_data)

        # 생성된 식단 검증
        validated_plan = await menu_service.validate_menu_plan(
            result["integrated_plan"],
            optimized_data["menu_pool"]
        )

        # 영양소 지표 계산(선택)
        nutrition_metrics = menu_service.calculate_nutrition_metrics(
            validated_plan,
            processed_data
        )

        # 대체 메뉴 생성
        alternatives = menu_service.generate_alternatives(
            validated_plan,
            processed_data
        )

        # 결과 지표 구성
        metrics = {
            **result.get("metrics", {}),
            "nutrition": nutrition_metrics
        }

        return PlanResponse(
            plan=validated_plan,
            alternatives=alternatives,
            metrics=metrics
        )

        # #초기 상태 생성
        # init_state = {
        #     "leftover_data": request.leftover_data,
        #     "preference_data": request.preference_data,
        #     "menu_pool": request.menu_pool or []
        # }

        # # 비동기 작업으로 실행
        # plan_result = await workflow.run_workflow(init_state)

        # return PlanResponse(
        #     plan=plan_result["integrated_plan"],
        #     metrics=plan_result.get("metrics")
        # )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"식단 생성 중 오류: {str(e)}")


@router.get("/menu-pool", response_model=Dict[str, List[str]])
async def get_menu_pool(
    menu_service: MenuService = Depends(get_menu_service)
):
    """
    사용 가능한 메뉴 풀 조회
    
    카테고리별 메뉴 목록을 반환합니다.
    
    현재로선 사용하지 않을 확률 높음
    """
    try:
        return await menu_service.get_menu_categories()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"메뉴 풀 조회 중 오류: {str(e)}")