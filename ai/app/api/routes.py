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
    DailyMenu,
    MenuInfo
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
            print(f"[ROUTE][generate_menu_plan] Menu Pool provided with {len(request.menuPool)} items")
        start_time = time.time()
    else:
        # 더미데이터 반환(spring확인용)
        return PlanResponse(
            plan={"2025-06-01":{"된장찌개":{"category":"soup","alternatives":["미역국","북어국","콩나물국"]},"김치볶음밥":{"category":"rice","alternatives":["잡곡밥","흰밥","비빔밥"]},"돈까스":{"category":"main","alternatives":["고등어구이","제육볶음","불고기"]},"배추김치":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]},"콩나물무침":{"category":"side","alternatives":["시금치나물","도라지무침","깍두기"]}},"2025-06-02":{"미역국":{"category":"soup","alternatives":["된장찌개","북어국","콩나물국"]},"잡곡밥":{"category":"rice","alternatives":["흰밥","김치볶음밥","비빔밥"]},"고등어구이":{"category":"main","alternatives":["돈까스","제육볶음","불고기"]},"시금치나물":{"category":"side","alternatives":["콩나물무침","도라지무침","깍두기"]},"깍두기":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-03":{"북어국":{"category":"soup","alternatives":["미역국","된장찌개","콩나물국"]},"흰밥":{"category":"rice","alternatives":["잡곡밥","김치볶음밥","비빔밥"]},"제육볶음":{"category":"main","alternatives":["돈까스","고등어구이","불고기"]},"오이무침":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]},"무생채":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-04":{"계란국":{"category":"soup","alternatives":["미역국","된장찌개","북어국"]},"비빔밥":{"category":"rice","alternatives":["잡곡밥","흰밥","김치볶음밥"]},"닭갈비":{"category":"main","alternatives":["돈까스","고등어구이","제육볶음"]},"배추김치":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]},"감자볶음":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-05":{"감자국":{"category":"soup","alternatives":["미역국","된장찌개","북어국"]},"덮밥":{"category":"rice","alternatives":["잡곡밥","흰밥","김치볶음밥"]},"오징어볶음":{"category":"main","alternatives":["돈까스","고등어구이","제육볶음"]},"콩나물무침":{"category":"side","alternatives":["시금치나물","도라지무침","깍두기"]},"김구이":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-06":{"맑은국":{"category":"soup","alternatives":["미역국","된장찌개","북어국"]},"잡곡밥":{"category":"rice","alternatives":["흰밥","김치볶음밥","비빔밥"]},"떡갈비":{"category":"main","alternatives":["돈까스","고등어구이","제육볶음"]},"도라지무침":{"category":"side","alternatives":["시금치나물","콩나물무침","깍두기"]},"깍두기":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-07":{"김치찌개":{"category":"soup","alternatives":["미역국","된장찌개","북어국"]},"볶음밥":{"category":"rice","alternatives":["잡곡밥","흰밥","김치볶음밥"]},"불고기":{"category":"main","alternatives":["돈까스","고등어구이","제육볶음"]},"숙주나물":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]},"배추김치":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-08":{"어묵국":{"category":"soup","alternatives":["미역국","된장찌개","북어국"]},"흰밥":{"category":"rice","alternatives":["잡곡밥","김치볶음밥","비빔밥"]},"치킨커틀릿":{"category":"main","alternatives":["돈까스","고등어구이","제육볶음"]},"오이무침":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]},"무생채":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-09":{"미역국":{"category":"soup","alternatives":["된장찌개","북어국","콩나물국"]},"카레라이스":{"category":"rice","alternatives":["잡곡밥","흰밥","김치볶음밥"]},"고등어구이":{"category":"main","alternatives":["돈까스","제육볶음","불고기"]},"시금치나물":{"category":"side","alternatives":["콩나물무침","도라지무침","깍두기"]},"깍두기":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-10":{"된장찌개":{"category":"soup","alternatives":["미역국","북어국","콩나물국"]},"잡곡밥":{"category":"rice","alternatives":["흰밥","김치볶음밥","비빔밥"]},"돈까스":{"category":"main","alternatives":["고등어구이","제육볶음","불고기"]},"배추김치":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]},"감자볶음":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-11":{"북어국":{"category":"soup","alternatives":["미역국","된장찌개","콩나물국"]},"비빔밥":{"category":"rice","alternatives":["잡곡밥","흰밥","김치볶음밥"]},"제육볶음":{"category":"main","alternatives":["돈까스","고등어구이","불고기"]},"콩나물무침":{"category":"side","alternatives":["시금치나물","도라지무침","깍두기"]},"김구이":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-12":{"계란국":{"category":"soup","alternatives":["미역국","된장찌개","북어국"]},"덮밥":{"category":"rice","alternatives":["잡곡밥","흰밥","김치볶음밥"]},"닭갈비":{"category":"main","alternatives":["돈까스","고등어구이","제육볶음"]},"도라지무침":{"category":"side","alternatives":["시금치나물","콩나물무침","깍두기"]},"깍두기":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-13":{"감자국":{"category":"soup","alternatives":["미역국","된장찌개","북어국"]},"볶음밥":{"category":"rice","alternatives":["잡곡밥","흰밥","김치볶음밥"]},"오징어볶음":{"category":"main","alternatives":["돈까스","고등어구이","제육볶음"]},"숙주나물":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]},"배추김치":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-14":{"맑은국":{"category":"soup","alternatives":["미역국","된장찌개","북어국"]},"흰밥":{"category":"rice","alternatives":["잡곡밥","김치볶음밥","비빔밥"]},"떡갈비":{"category":"main","alternatives":["돈까스","고등어구이","제육볶음"]},"오이무침":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]},"무생채":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-15":{"김치찌개":{"category":"soup","alternatives":["미역국","된장찌개","북어국"]},"잡곡밥":{"category":"rice","alternatives":["흰밥","김치볶음밥","비빔밥"]},"불고기":{"category":"main","alternatives":["돈까스","고등어구이","제육볶음"]},"시금치나물":{"category":"side","alternatives":["콩나물무침","도라지무침","깍두기"]},"깍두기":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-16":{"어묵국":{"category":"soup","alternatives":["미역국","된장찌개","북어국"]},"카레라이스":{"category":"rice","alternatives":["잡곡밥","흰밥","김치볶음밥"]},"치킨커틀릿":{"category":"main","alternatives":["돈까스","고등어구이","제육볶음"]},"배추김치":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]},"감자볶음":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-17":{"미역국":{"category":"soup","alternatives":["된장찌개","북어국","콩나물국"]},"비빔밥":{"category":"rice","alternatives":["잡곡밥","흰밥","김치볶음밥"]},"고등어구이":{"category":"main","alternatives":["돈까스","제육볶음","불고기"]},"콩나물무침":{"category":"side","alternatives":["시금치나물","도라지무침","깍두기"]},"김구이":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-18":{"된장찌개":{"category":"soup","alternatives":["미역국","북어국","콩나물국"]},"덮밥":{"category":"rice","alternatives":["잡곡밥","흰밥","김치볶음밥"]},"돈까스":{"category":"main","alternatives":["고등어구이","제육볶음","불고기"]},"도라지무침":{"category":"side","alternatives":["시금치나물","콩나물무침","깍두기"]},"깍두기":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-19":{"북어국":{"category":"soup","alternatives":["미역국","된장찌개","콩나물국"]},"볶음밥":{"category":"rice","alternatives":["잡곡밥","흰밥","김치볶음밥"]},"제육볶음":{"category":"main","alternatives":["돈까스","고등어구이","불고기"]},"숙주나물":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]},"배추김치":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-20":{"계란국":{"category":"soup","alternatives":["미역국","된장찌개","북어국"]},"흰밥":{"category":"rice","alternatives":["잡곡밥","김치볶음밥","비빔밥"]},"닭갈비":{"category":"main","alternatives":["돈까스","고등어구이","제육볶음"]},"오이무침":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]},"무생채":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-21":{"감자국":{"category":"soup","alternatives":["미역국","된장찌개","북어국"]},"잡곡밥":{"category":"rice","alternatives":["흰밥","김치볶음밥","비빔밥"]},"오징어볶음":{"category":"main","alternatives":["돈까스","고등어구이","제육볶음"]},"시금치나물":{"category":"side","alternatives":["콩나물무침","도라지무침","깍두기"]},"깍두기":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-22":{"맑은국":{"category":"soup","alternatives":["미역국","된장찌개","북어국"]},"비빔밥":{"category":"rice","alternatives":["잡곡밥","흰밥","김치볶음밥"]},"떡갈비":{"category":"main","alternatives":["돈까스","고등어구이","제육볶음"]},"배추김치":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]},"감자볶음":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-23":{"김치찌개":{"category":"soup","alternatives":["미역국","된장찌개","북어국"]},"덮밥":{"category":"rice","alternatives":["잡곡밥","흰밥","김치볶음밥"]},"불고기":{"category":"main","alternatives":["돈까스","고등어구이","제육볶음"]},"콩나물무침":{"category":"side","alternatives":["시금치나물","도라지무침","깍두기"]},"김구이":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-24":{"어묵국":{"category":"soup","alternatives":["미역국","된장찌개","북어국"]},"볶음밥":{"category":"rice","alternatives":["잡곡밥","흰밥","김치볶음밥"]},"치킨커틀릿":{"category":"main","alternatives":["돈까스","고등어구이","제육볶음"]},"도라지무침":{"category":"side","alternatives":["시금치나물","콩나물무침","깍두기"]},"깍두기":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-25":{"미역국":{"category":"soup","alternatives":["된장찌개","북어국","콩나물국"]},"흰밥":{"category":"rice","alternatives":["잡곡밥","김치볶음밥","비빔밥"]},"고등어구이":{"category":"main","alternatives":["돈까스","제육볶음","불고기"]},"숙주나물":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]},"배추김치":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-26":{"된장찌개":{"category":"soup","alternatives":["미역국","북어국","콩나물국"]},"잡곡밥":{"category":"rice","alternatives":["흰밥","김치볶음밥","비빔밥"]},"돈까스":{"category":"main","alternatives":["고등어구이","제육볶음","불고기"]},"오이무침":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]},"무생채":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-27":{"북어국":{"category":"soup","alternatives":["미역국","된장찌개","콩나물국"]},"카레라이스":{"category":"rice","alternatives":["잡곡밥","흰밥","김치볶음밥"]},"제육볶음":{"category":"main","alternatives":["돈까스","고등어구이","불고기"]},"배추김치":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]},"감자볶음":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-28":{"계란국":{"category":"soup","alternatives":["미역국","된장찌개","북어국"]},"비빔밥":{"category":"rice","alternatives":["잡곡밥","흰밥","김치볶음밥"]},"닭갈비":{"category":"main","alternatives":["돈까스","고등어구이","제육볶음"]},"콩나물무침":{"category":"side","alternatives":["시금치나물","도라지무침","깍두기"]},"깍두기":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-29":{"감자국":{"category":"soup","alternatives":["미역국","된장찌개","북어국"]},"덮밥":{"category":"rice","alternatives":["잡곡밥","흰밥","김치볶음밥"]},"오징어볶음":{"category":"main","alternatives":["돈까스","고등어구이","제육볶음"]},"시금치나물":{"category":"side","alternatives":["콩나물무침","도라지무침","깍두기"]},"김구이":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}},"2025-06-30":{"맑은국":{"category":"soup","alternatives":["미역국","된장찌개","북어국"]},"흰밥":{"category":"rice","alternatives":["잡곡밥","김치볶음밥","비빔밥"]},"떡갈비":{"category":"main","alternatives":["돈까스","고등어구이","제육볶음"]},"도라지무침":{"category":"side","alternatives":["시금치나물","콩나물무침","깍두기"]},"배추김치":{"category":"side","alternatives":["시금치나물","콩나물무침","도라지무침"]}}})
    
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
        # # 요청된 모델로 응답
        # return PlanResponse(
        #     plan=integrated_plan,
        #     metrics=result.get("metrics", {})
        # )


        # # 메뉴 형식을 DailyMenu로 변환
        # formatted_plan = {}
        # for date, menus in integrated_plan.items():
        #     soup_menu = menus[0]
        #     rice_menu = menus[1]
        #     main_menu = menus[2]
        #     side_menu = menus[3:5]

        #     # 필요한 menu_data 구조 구성
        #     complete_menu_data = {
        #         "categorized_menus": processed_data["menu_pool"],
        #         "menu_categories": menu_to_category,  # 카테고리 매핑 추가
        #         "menu_preference": processed_data.get("menu_preference", {})  # 선호도 정보 추가
        #     }
            
        #     print("[ROUTES] before_generate_alternatives : ", processed_data["menu_pool"])
            
        #     # 대체 메뉴 생성
        #     alternatives = menu_service.generate_alternatives(
        #         {date: menus},
        #         complete_menu_data
        #     ).get(date, {})

        #     # DailyMenu 구성
        #     formatted_plan[date] = DailyMenu(
        #         soup=MenuOption(
        #             primary=soup_menu,
        #             alternatives=alternatives.get(soup_menu, [])[:3]
        #         ),
        #         rice=MenuOption(
        #             primary=rice_menu,
        #             alternatives=alternatives.get(rice_menu, [])[:3]
        #         ),
        #         main=MenuOption(
        #             primary=main_menu,
        #             alternatives=alternatives.get(main_menu, [])[:3]
        #         ),
        #         side=[
        #             MenuOption(
        #                 primary=side_m,
        #                 alternatives=alternatives.get(side_m, [])[:3]  # side_m 사용 (개별 메뉴 항목)
        #             ) for side_m in side_menu[:2]
        #         ]
        #     )

        # # 결과 지표 구성
        # metrics = result.get("metrics", {})

        # if settings.DEBUG:
        #     print(f"[ROUTE][generate_menu_plan] Response prepared with {len(formatted_plan)} dates")
        #     print(f"[ROUTE][generate_menu_plan] Processing time: {time.time() - start_time:.4f} seconds")

        # return PlanResponse(
        #     plan=formatted_plan,
        #     metrics=metrics
        # )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"식단 생성 중 오류: {str(e)}")


@router.post("/health-report")
async def create_health_report():
    pass

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