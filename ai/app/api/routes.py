from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from typing import Dict, List, Any
from ..config import settings
import time

from ..core import dummy

from .models import (
    PlanRequest,
    PlanResponse,
    AnalyzeRequest,           
    AnalyzeResponse,
    ReportRequest,
    ReportResponse
)

from ..services.menu_service import MenuService
from ..services.analyze_service import AnalyzeService
from ..workflows.graph import MenuPlanningWorkflow
from ..services.report_service import ReportService
import asyncio

router = APIRouter(prefix="/ai")


# 서비스 의존성
def get_menu_service():
    return MenuService()

def get_analyze_service():
    return AnalyzeService()

def get_workflow_service():
    return MenuPlanningWorkflow()

def get_report_service():
    return ReportService()


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
            print(f"[ROUTE][generate_menu_plan] Menu Pool provided with {len(request.menuPool)} items")
        start_time = time.time()
    else:
        # 더미데이터 반환(spring확인용)
        return PlanResponse(
            plan=dummy.report_plan)
    
    """
    통합 식단 계획 생성 엔드포인트
    
    선호도와 잔반율, 영양 데이터 기반으로 식단 셍성
    """
    try:
        menu_data = request.menuData
        menu_pool = request.menuPool

        if settings.DEBUG:
            print(f"[ROUTE][generate_menu_plan] Preparing data for LLM")

        # 메뉴 데이터 추출 및 LLM 입력용으로 변환(토큰 절약)
        processed_data = menu_service.prepare_for_llm(menu_data, menu_pool)

        if settings.DEBUG:
            print(f"[ROUTE][generate_menu_plan] Data prepared, running workflow")

        # 워크 플로우 실행
        print(f"[ROUTE][generate_menu_plan] Before awaiting workflow")
        result = await workflow.run_workflow(processed_data)
        print(f"[ROUTE][generate_menu_plan] After awaiting workflow, result type: {type(result)}")

        print("[ROUTE][generate_menu_plan] After awaiting workflow, result : ", result)
        print("[ROUTE][generate_menu_plan] After awaiting workflow, processed_data : ", processed_data)


        # # 카테고리별 메뉴 매핑 생성(반대 방향 매핑)
        # menu_to_category = {}
        # for category, menu_list in processed_data["menu_pool"].items():
        #     for menu in menu_list:
        #         menu_to_category[menu] = category

        # 통합 식단 검증 - 메뉴 풀 활용
        integrated_plan = result["integrated_plan"]
        
        print("[ROUTES][generate_menu_plan] start formatting :", integrated_plan)
        
        # 메뉴 기반 형식으로 직접 변환
        menu_based_plan = {}
        for date, menu_categories in integrated_plan.items():
            # menus는 딕셔너리: {'된장찌개': 'soup', '김치볶음밥': 'rice', ...}
            
            print("[ROUTES][generate_menu_plan] start creating alternatives : ", menu_categories)

            # 카테고리별 메뉴 추출
            soup_menu = next((menu for menu, category in menu_categories.items() if category == "soup"), None)
            rice_menu = next((menu for menu, category in menu_categories.items() if category == "rice"), None)
            main_menu = next((menu for menu, category in menu_categories.items() if category == "main"), None)
            side_menu = [menu for menu, category in menu_categories.items() if category == "side"]

            # 메뉴 별 대체 메뉴 (dict 직접 사용)
            menu_map = {}

            # 각 카테고리별 대체 메뉴 생성
            if soup_menu:
                soup_alternatives = [m for m in processed_data["menu_pool"]["soup"] if m != soup_menu][:3]
                menu_map[soup_menu] = {
                    "category": "soup",
                    "alternatives": soup_alternatives
                }

            if rice_menu:
                rice_alternatives = [m for m in processed_data["menu_pool"]["rice"] if m != rice_menu][:3]
                menu_map[rice_menu] = {
                    "category": "rice",
                    "alternatives": rice_alternatives
                }

            if main_menu:
                main_alternatives = [m for m in processed_data["menu_pool"]["main"] if m != main_menu][:3]
                menu_map[main_menu] = {
                    "category": "main",
                    "alternatives": main_alternatives
                }

            # 사이드 메뉴 처리
            for side_m in side_menu:
                side_alternatives = [m for m in processed_data["menu_pool"]["side"] if m != side_m][:3]
                menu_map[side_m] = {
                    "category": "side",
                    "alternatives": side_alternatives
                }
    
            menu_based_plan[date] = menu_map

        print("menu_based_plan : ", menu_based_plan)

        return PlanResponse(
            plan=menu_based_plan,
            # metrics=result.get("metrics", {})
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"식단 생성 중 오류: {str(e)}")


@router.post("/health-report", response_model=ReportResponse)
async def create_health_report(
    request: ReportRequest,
    report_service:ReportService = Depends(get_report_service)
):
    dummy_analyze: str = "BMI 지수 21.1는 정상 상태입니다. 현재 건강한 상태를 유지하고 있습니다."
    dummy_plan: str = "적정량의 음식을 선택해 잔반을 줄이세요."
    dummy_opinion: str = "식습관 개선과 영양 균형에 주의가 필요합니다. 정기적인 운동과 균형 잡힌 식단 관리를 통해 건강 상태를 개선하시기 바랍니다."
    
    if settings.DEBUG:
        print("[ROUTE][create_health_report] start create report")
        print(f"요청 데이터: {request}")
        try:
            report = await report_service.create_health_report(
                bmi=request.bmi,
                leftover=request.leftover,
                leftover_most=request.leftoverMost,
                leftover_least=request.leftoverLeast,
                nutrient=request.nutrient
            )
            print("생성결과 : ",report)
            # 리포트 응답 반환
            return ReportResponse(
                analyzeReport=report["analyzeReport"],
                plan=report["plan"],
                opinion=report["opinion"]
            )
        except Exception as e:
            error_msg = f"리포트 생성 중 오류: {str(e)}"
            if settings.DEBUG:
                print(f"[ERROR] {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)
    else:
        return ReportResponse(
            analyzeReport=dummy_analyze,
            plan=dummy_plan,
            opinion=dummy_opinion
        )

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