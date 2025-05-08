from typing import Dict, List, Any, Optional
import aiohttp
import json
import random
from ..config import settings
from collections import defaultdict
import statistics
import asyncio

class MenuService:
    """메뉴 관리 서비스"""

    def __init__(self):
        """메뉴 서비스 초기화"""
        pass
    
    def extract_menu_data(self, historical_data: Dict[str, Dict[str, Dict[str,Any]]]) -> Dict[str, Any]:
        """
        Spring에서 받은 날짜별 메뉴 데이터에서 유용한 정보 추출

        Args:
            historical_data: {날짜: {메뉴: {잔반율, 선호도, 카테고리, 영양소: {kcal, fat, ...}}}}
        Returns:
            Dict: 추출된 메뉴 데이터        
        """

        # 결과 저장용 구조
        menu_pool = set()
        menu_categories = {}
        menu_nutrition = {}
        menu_preference = {}
        menu_leftover = {}

        # 카테고리별 메뉴 그룹핑
        categorized_menus = defaultdict(list)

        # 메뉴별 통계 수집 (여러 날짜에 걸친 값들)
        preference_stats = defaultdict(list)
        leftover_stats = defaultdict(list)

        nutrition_keys = set()

        # 날짜별 데이터 순회
        for date, daily_menus in historical_data.items():
            # 일별 메뉴 순회
            for menu_name, menu_info in daily_menus.items():
                # 메뉴 풀에 추가
                menu_pool.add(menu_name)

                # 카테고리 정보 저장(제공된 카테고리 사용) -> 나중에 변경
                if "category" in menu_info:
                    category = menu_info["category"]
                    menu_categories[menu_name] = category
                    categorized_menus[category].append(menu_name)
                  
                # 영양소 정보 수집
                if "nutrition" in menu_info and isinstance(menu_info["nutrition"], dict):
                    # 아직 이 메뉴의 영양소 정보가 없으면 세 딕셔너리 생성
                    if menu_name not in menu_nutrition:
                        menu_nutrition[menu_name] = {}

                    # 모든 영양소 키-값 쌍 추출
                    for nutrient_key, nutrient_value in menu_info["nutrition"].items():
                        # 영양소 키 집합에 추가
                        nutrition_keys.add(nutrient_key)
                        
                        # 메뉴의 영양소 정보 업데이트
                        menu_nutrition[menu_name][nutrient_key] = nutrient_value
                
                # 선호도 통계 수집
                if "preference" in menu_info:
                    preference_stats[menu_name].append(menu_info['preference'])
                
                # 잔반율 통계 수집
                if "leftover" in menu_info:
                    leftover_stats[menu_name].append(menu_info["leftover"])
        # 메뉴별 평균 선호도 계산
        for menu_name, values in preference_stats.items():
            # 기본값 3.0
            menu_preference[menu_name] = statistics.mean(values) if values else 3.0

        # 메뉴별 평균 잔반율 계산
        for menu_name, values in leftover_stats.items():
            # 기본값 0.2
            menu_leftover[menu_name] = statistics.mean(values) if values else 0.2
        
        # 결과 반환
        return {
            "menu_pool": list(menu_pool),
            "menu_categories": menu_categories,
            "categorized_menus": categorized_menus,
            "menu_nutrition": menu_nutrition,
            "menu_preference": menu_preference,
            "menu_leftover": menu_leftover,
            "nutrition_keys": list(nutrition_keys)
        }

    def prepare_for_llm(self, historical_data: Dict[str, Dict[str, Dict[str,Any]]]) -> Dict[str, Any]:
        """
        LLM 요청을 위한 데이터 준비 (토큰 최적화)

        Args:
            historical_data: Spring에서 받은 날짜별 메뉴 데이터

        Returns:
            Dict: LLM 입력용 최적화된 데이터
        """

        # 메뉴 데이터 추출
        menu_data = self.extract_menu_data(historical_data)

        # 이미 카테고리화된 메뉴 사용
        categorized_menu = menu_data["cateogorized_menus"]

        # 카테고리별 선호도 데이터 구성
        categorized_preference = {}
        for category, menus in categorized_menu.items():
            category_prefs = {}
            for menu in menus:
                if menu in menu_data["menu_preference"]:
                    category_prefs[menu] = menu_data["menu_preference"][menu]

            # 선호도 기준 상위 10개만 포함
            if category_prefs:
                sorted_items = sorted(category_prefs.items(), key=lambda x: x[1], reverse=True)
                top_items = sorted_items[:10]
                categorized_preference

        # 카테고리별 잔반율 데이터 구성
        categorized_leftover = {}
        for category, menus in categorized_menu.items():
            category_leftover = {}
            for menu in menus:
                if menu in menu_data["menu_leftover"]:
                    category_leftover[menu] = menu_data["menu_leftover"][menu]
            
            # 잔반율 기준 상위 10개 포함
            if category_leftover:
                sorted_items = sorted(category_leftover.items(), key=lambda x: x[1], reverse=True)
                top_items = sorted_items[:10]
                categorized_leftover[category] = dict(top_items)

        # 카테고리별 메뉴 수 제한 (토큰 절약)
        optimized_menu_pool = {}
        for category, menus in categorized_menu.items():
            optimized_menu_pool[category] = menus[:20] if len(menus) > 20 else menus
        
        # 영양소 정보 구성
        # 발견된 영양소 키 중 우선순위가 높은 것들 선택
        priority_nutrients = ['kcal', 'protein', 'fat', 'carbo']
        nutrition_info = {}

        # 발견된 영양소 키 중 우선순위가 있는 것 먼저 포함, 나머지는 선택적 포함
        available_keys = set(menu_data["nutrition_keys"])
        selected_keys = [k for k in priority_nutrients if k in available_keys]

        # 추가 영양소 키
        remaining_keys = [k for k in available_keys if k not in priority_nutrients]
        if remaining_keys:
            selected_keys.extend(remaining_keys[:3])

        # 메뉴별 영양소 정보 구성
        for menu, nutrients in menu_data["menu_nutrition"].items():
            nutrition_info[menu] = {k: nutrients.get(k) for k in selected_keys if k in nutrients}
        
        # LLM 입력용 최적화 데이터
        return {
            "menu_pool": optimized_menu_pool,
            "preference_data": {"average_rating": categorized_preference},
            "leftover_data": categorized_leftover,
            "nutrition_data": nutrition_info,
            "nutrition_keys": selected_keys  # 선택된 영양소 키
        }
    
    def validate_menu_plan(self, plan: Dict[str, List[str]], menu_pool_by_category: Dict[str, List[str]]) -> Dict[str, List[str]]:
        """
        LLM이 생성한 식단 계획 검증 및 수정

        Args:
            plan: 생성된 식단 계획
            menu_pool_by_category: 카테고리 별 메뉴 풀
        
        Returns:
            Dict: 검증 및 수정된 식단 계획
        """
        # 전체 메뉴 풀 생성
        all_menus = []
        for menus in menu_pool_by_category.values():
            all_menus.extend(menus)
          
        validated_plan = {}

        # 각 날짜별 식단 검증
        for date, menus in plan.items():
            valid_menus = []

            # 메뉴가 실제 메뉴 풀에 있는지 확인
            for menu in menus:
                if menu in all_menus:
                    valid_menus.append(menu)
                else:
                    # 유사한 메뉴 찾기
                    similar_menu = self._find_similar_menu(menu, all_menus)
                    if similar_menu:
                        valid_menus.append(similar_menu)
            
            # 검증된 메뉴 저장
            validated_plan[date] = valid_menus
        
        return validated_plan

    def _find_similar_menu(self, menu: str, menu_pool: List[str]) -> Optional[str]:
        """메뉴 풀에서 유사한 메뉴 찾기"""
        for valid_menu in menu_pool:
            # 3글자 이상 부분 문자열이 일치하면 유사 메뉴로 간주
            # => 나중에 수정해야 함
            if len(menu) >= 3 and menu[:3] in valid_menu:
                return valid_menu
        return None
    
    def calculate_nutrition_metrics(self, plan: Dict[str, List[str]], menu_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        생성된 식단의 영양소 정보 계산

        Args:
            plan: 검증된 식단 계획
            menu_data: 메뉴 데이터 (영양소 정보 포함)
        
        Returns:
            Dict: 영양소 지표
        """
        # 영양소 정보
        menu_nutrition = menu_data["menu_nutrition"]
        nutrition_keys = menu_data.get("nutrition_keys", ['kcal', 'protein', 'fat', 'carbo'])

        # 일별 영양소 합계
        daily_nutrition = {}

        # 각 날짜별 영양소 합계 계산
        for date, menus in plan.items():
            daily_total = {key: 0 for key in nutrition_keys}

            # 각 메뉴의 영양소 합산
            for menu in menus:
                if menu in menu_nutrition:
                    for key in nutrition_keys:
                        if key in menu_nutrition[menu]:
                            daily_total[key] += menu_nutrition[menu][key]
        
            daily_nutrition[date] = daily_total
        
        # 전체 기간 평균 계산
        avg_nutrition = {key: 0 for key in nutrition_keys}
        for daily_total in daily_nutrition.values():
            for key in nutrition_keys:
                avg_nutrition[key] += daily_total[key]
        
        # 평균 계산
        days_count = len(daily_nutrition)
        if days_count > 0:
            for key in avg_nutrition:
                avg_nutrition[key] /= days_count
        
        # 영양소 비율 계산 (탄수화물, 단백질, 지방)
        nutrition_ratio = {}
        if ('carbo' in avg_nutrition and 'protein' in avg_nutrition and 'fat' in avg_nutrition):
            total_macros = avg_nutrition['carbo'] + avg_nutrition['protein'] + avg_nutrition['fat']
            if total_macros > 0:
                nutrition_ratio = {
                    'carbo': round(avg_nutrition['carbo'] / total_macros * 100, 1),
                    'protein': round(avg_nutrition['protein'] / total_macros * 100, 1),
                    'fat': round(avg_nutrition['fat'] / total_macros * 100, 1)
                }
        
        return {
            "daily_nutrition": daily_nutrition,
            "avg_nutrition": avg_nutrition,
            "nutrition_ratio": nutrition_ratio
        }

    def generate_alternatives(self, plan: Dict[str,List[str]], menu_data:Dict[str,Any]) -> Dict[str, Dict[str, List[str]]]:
        """
        각 메뉴별 대체 메뉴 생성

        Args:
            plan: 검증된 식단 계획
            menu_data: 메뉴 데이터
        Returns:
            Dict: 날짜별, 메뉴별 대체 메뉴 목록
        """
        # 메뉴별 카테고리 매핑
        menu_categories = menu_data["menu_categories"]
        categorized_menus = menu_data["categorized_menus"]
        menu_preference = menu_data["menu_preference"]

        alternatives = {}

        # 날짜별 대체 메뉴 생성
        for date, menus in plan.items():
            date_alternatives = {}

            # 메뉴별 대체 메뉴 생성
            for menu in menus:
                # 메뉴 카테고리 확인
                category = menu_categories.get(menu, '기타')

                # 같은 카테고리에서 대체 메뉴 선택
                alt_menus = []
                if category in categorized_menus:
                    # 같은 카테고리의 다른 메뉴들
                    same_category_menus = [m for m in categorized_menus[category] if m != menu]

                    # 선호도 기준으로 정렬
                    sorted_menus = sorted(
                        same_category_menus,
                        key=lambda m: menu_preference.get(m,0),
                        reverse=True
                    )

                    # 최대 3개 선택
                    alt_menus = sorted_menus[:3]
                # 대체 메뉴 저장
                date_alternatives[menu] = alt_menus

            alternatives[date] = date_alternatives

        return alternatives
    
    async def get_menu_data(self, menu_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        메뉴 데이터 조회
        
        ver1. 더미데이터 생성용
        
        Args:
            menu_ids: 조회할 메뉴 ID 목록 (None이면 전체)
        Returns:
            List[Dict]: 메뉴 정보 목록

        """

        menu_data = [
            {
                "menu_id": "M001",
                "menu_name": "돈삼겹숙주덮밥",
                "calories": 699.96,
                "carbs": 92.09,
                "fat": 21.40,
                "protein": 29.31,
                "sodium": 1182.88
            },
            {
                "menu_id": "M002",
                "menu_name": "실파계란국",
                "calories": 193.04,
                "carbs": 5.35,
                "fat": 11.11,
                "protein": 16.19,
                "sodium": 1263.97
            },
            {
                "menu_id": "M003",
                "menu_name": "당면김말이강정",
                "calories": 323.25,
                "carbs": 24.21,
                "fat": 15.56,
                "protein": 18.34,
                "sodium": 413.14
            }
        ]

        # 메뉴 ID 필터링 (있으면)
        if menu_ids:
            return [menu for menu in menu_data if menu["menu_id"] in menu_ids]
        return menu_data
    
    async def get_menu_categories(self) -> Dict[str, List[str]]:
        """
        카테고리별 메뉴 목록 조회 (더미데이터 생성용)

        Returns:
            Dict[str, List[str]]: 카테고리별 메뉴 목록
        """
        return {
            "밥류": ["돈삼겹숙주덮밥", "김치볶음밥", "비빔밥"],
            "국류": ["실파계란국", "미역국", "된장국"],
            "반찬류": ["당면김말이강정", "시금치나물", "깍두기"]
        }
    
    async def get_menu_preference(self, menu_names: List[str]) -> Dict[str, float]:
        """
        메뉴별 선호도 조회(더미데이터 생성용)
        
        Args:
            menu_names: 조회할 메뉴명 목록
        Returns:
            Dict[str, float]: 메뉴별 선호도
        """
        preference_data = {
            "돈삼겹숙주덮밥": 4.5,
            "실파계란국": 3.8,
            "당면김말이강정": 4.2,
            "김치볶음밥": 4.3,
            "미역국": 3.5,
            "된장국": 3.7,
            "시금치나물": 3.0,
            "깍두기": 4.0,
            "비빔밥": 4.7
        }

        # 요청 메뉴만 필터링
        return {menu: score for menu, score in preference_data.items() if menu in menu_names}
    
    async def get_menu_leftover(self, menu_names: List[str]) -> Dict[str, float]:
        """
        메뉴별 잔반율 조회(더미데이터 생성용)

        Args:
            menu_names: 조회할 메뉴명 목록
        
        Returns:
            Dict[str, float]: 메뉴별 잔반율
        """
        
        leftover_data = {
            "돈삼겹숙주덮밥": 0.15,
            "실파계란국": 0.25,
            "당면김말이강정": 0.10,
            "김치볶음밥": 0.18,
            "미역국": 0.30,
            "된장국": 0.28,
            "시금치나물": 0.40,
            "깍두기": 0.20,
            "비빔밥": 0.12
        }

        return {menu: rate for menu, rate in leftover_data.items() if menu in menu_names}