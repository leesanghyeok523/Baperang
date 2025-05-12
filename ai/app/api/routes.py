from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from typing import Dict, List, Any
from ..config import settings
import time

from .models import (
    PlanRequest,
    PlanResponse,
    AnalyzeRequest,           
    AnalyzeResponse,
    MenuOption, 
    DailyMenu
)

from ..services.menu_service import MenuService
from ..services.analyze_service import AnalyzeService
from ..workflows.graph import MenuPlanningWorkflow
import asyncio

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
    if settings.DEBUG:
        print(f"[ROUTE][generate_menu_plan] Request Received with {len(request.menuData)} menu data items")
        if request.menuPool:
            print(f"[Route][generate_menu_plan] Menu Pool provided with {len(request.menuPool)} items")
        start_time = time.time()
    """
    통합 식단 계획 생성 엔드포인트
    
    선호도와 잔반율, 영양 데이터 기반으로 식단 셍성
    """
    try:
        menu_data = request.menuData
        menu_pool = request.menuPool

        if settings.DEBUG:
            print(f"[ROUTE][generate_menu_plan] Preparing data for LLM")

        # 메뉴 데이터 추출 및 LLM 입력용으로 변환
        processed_data = await menu_service.prepare_for_llm(menu_data, menu_pool)

        if settings.DEBUG:
            print(f"[ROUTE][generate_menu_plan] Data prepared, running workflow")

        # 워크 플로우 실행
        result = await workflow.run_workflow(processed_data)

        # 통합 식단 검증 - 메뉴 풀 활용
        integrated_plan = result.get("integrated_plan", {})

        # 메뉴 형식을 DailyMenu로 변환
        formatted_plan = {}
        for date, menus in integrated_plan.items():
            if len(menus) >= 5: # 최소 5개의 메뉴가 있는 경우
                # 메뉴 타입별 분류
                soup_menu = next((m for m in menus if menu_pool.get(m) == "soup"), menus[0])
                rice_menu = next((m for m in menus if menu_pool.get(m) == "rice"), menus[1])
                main_menu = next((m for m in menus if menu_pool.get(m) == "main"), menus[2])
                side_menu = next((m for m in menus if menu_pool.get(m) == "side"), menus[3])

                # side가 부족한 경우 다른 메뉴로 보충
                if len(side_menu) < 2:
                    available_menus = [m for m in menus if m not in [soup_menu, rice_menu, main_menu] and m not in side_menu]
                    side_menu.extend(available_menus[:2-len(side_menu)])
                
                # 대체 메뉴 생성
                alternatives = menu_service.generate_alternatives(
                    {date: menus},
                    {"categorized_menus" : processed_data["menu_pool"]}
                ).get(date, {})

                # DailyMenu 구성
                formatted_plan[date] = DailyMenu(
                    soup=MenuOption(
                        primary=soup_menu,
                        alternatives=alternatives.get(soup_menu, [])[:3]
                    ),
                    rice=MenuOption(
                        primary=rice_menu,
                        alternatives=alternatives.get(rice_menu, [])[:3]
                    ),
                    main=MenuOption(
                        primary=main_menu,
                        alternatives=alternatives.get(main_menu, [])[:3]
                    ),
                    side=[
                        MenuOption(
                            primary=side_m,
                            alternatives=alternatives.get(side_menu, [])[:3]
                        ) for side_m in side_menu[:2]
                    ]
                )

        # 결과 지표 구성
        metrics = result.get("metrics", {})

        if settings.DEBUG:
            print(f"[ROUTE][generate_menu_plan] Response prepared with {len(formatted_plan)} dates")
            print(f"[ROUTE][generate_menu_plan] Processing time: {time.time() - start_time:.4f} seconds")

        return PlanResponse(
            plan=formatted_plan,
            metrics=metrics
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"식단 생성 중 오류: {str(e)}")



# 안 쓸 것 같음
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