# 식단 통합 로직
from typing import Dict, List, Any, Optional
import asyncio
from ..services.menu_service import MenuService
from ..config import settings

class MenuIntegrator:
    """메뉴 통합 로직"""

    def __init__(self, menu_service: MenuService = None):
        """
        통합기 초기화

        Args:
            menu_service: 메뉴 서비스 (선택)
        """
        self.menu_service = menu_service or MenuService()

    async def integrate_plans(self, waste_plan: Dict[str, List[str]], nutrition_plan: [Dict, List[str]],
                              menu_pool: Dict[str, List[str]]) -> Dict[str, Any]:
        """
        잔반 기반 식단과 영양 기반 식단 통합

        Args:
            waste_plan: 잔반율 기반 식단
            nutrition_plan: 영양소 기반 식단
            menu_poll: 사용 가능한 메뉴 풀
        Returns:
            Dict: 통합된 식단과 메트릭
        """
        if settings.DEBUG:
            print(f"[INTEGRATOR] Validating and enriching integrated plan")
        
        # 통합 식단 검증
        validated_plan = await self.menu_service.validate_menu_plan_async(waste_plan, menu_pool)

        # 대체 메뉴 생성
        alternatives = await self.generate_alternatives(validated_plan, menu_pool)

        # 통합 메트릭 계산
        metrics = self.calculate_integration_metrics(waste_plan, nutrition_plan, validated_plan)

        return {
            "integrated_plan": validated_plan,
            "alternatives": alternatives,
            "metrics": metrics
        }
    
    async def generate_alternatives(self, plan: Dict[str, List[str]], menu_pool: Dict[str, List[str]]) -> Dict[str, Dict[str, List[str]]]:
        """
        날짜별 대체 메뉴 생성

        Args:
            plan: 통합 식단
            menu_pool: 메뉴 풀
        
        Retruns:
            Dict: 날짜별 대체 메뉴
        """
        # 메뉴 서비스에 위임
        if self.menu_service:
            return await self.menu_service.generate_alternatives_async(plan, {"categorized_menus": menu_pool})

        # 간단한 대체 구현(메뉴 서비스 없는 경우)
        alternatvies = {}

        for date, menus in plan.items():
            date_alternatives = {}

            for menu in menus:
                # 메뉴 카테고리 추정
                category = self._infer_category(menu, menu_pool)

                # 같은 카테고리에서 대체 메뉴 선택
                if category and category in menu_pool:
                    candidates = [m for m in menu_pool[category] if m != menu]
                    alt_menus = candidates[:3] if candidates else []
                    date_alternatives[menu] = alt_menus
                else:
                    date_alternatives[menu] = []
            
            alternatvies[date] = date_alternatives
        
        return alternatvies
    
    def _infer_category(self, menu: str, menu_pool: Dict[str, List[str]]) -> str:
        pass

    def calculate_integration_metrics(self, waste_plan: Dict[str, List[str]],
                                      nutrition_plan: Dict[str, List[str]],
                                      integrated_plan: Dict[str, List[str]]) -> Dict[str, Any]:
        """
        통합 메트릭 계산

        Args:
            waste_plan: 잔반율 기반 식단
            nutrition_plan: 영양소 기반 식단
            integrated_plan: 통합 식단
        Returns:
            Dict: 메트릭
        """
        # 일치율 계산
        waste_match_count = 0
        nutrition_match_count = 0
        total_items = 0

        for date, menus in integrated_plan.items():
            total_items += len(menus)
            
            # 잔반율 기반 식단과 일치 항목 수
            if date in waste_plan:
                waste_match_count += len(set(menus) & set(waste_plan[date]))
            
            # 영양소 기반 식단과 일치 항목 수
            if date in nutrition_plan:
                nutrition_match_count += len(set(menus) & set(nutrition_plan[date]))
        
        # 일치율 계산
        waste_match_ratio = waste_match_count / total_items if total_items > 0 else 0
        nutrition_match_ratio = nutrition_match_count / total_items if total_items > 0 else 0
        
        # 다양성 지수 계산 (중복되지 않는 메뉴 비율)
        all_menus = []
        for menus in integrated_plan.values():
            all_menus.extend(menus)
        
        unique_menus = len(set(all_menus))
        diversity_index = unique_menus / len(all_menus) if all_menus else 0
        
        return {
            "waste_match_ratio": round(waste_match_ratio, 2),
            "nutrition_match_ratio": round(nutrition_match_ratio, 2),
            "diversity_index": round(diversity_index, 2),
            "unique_menu_count": unique_menus,
            "total_menu_count": len(all_menus)
        }