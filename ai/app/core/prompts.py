# 멀티 에이전트용 프롬프트 템플릿
from typing import Dict, Any, List, Optional
from datetime import datetime, date, timedelta
import calendar
import json

class PromptTemplates:
    """프롬프트 템플릿 모음"""

    @staticmethod
    def get_next_month_range():
        """
        다음 달의 시작일과 종료일 계산
        """
        today = datetime.now()

        # 다음 달 계산
        if today.month == 12:
            next_month = 1
            next_year = today.year + 1
        else:
            next_month = today.month + 1
            next_year = today.year

        # 다음 달 1일
        start_date = date(next_year, next_month, 1)

        # 다음 달 말일
        _, last_day = calendar.monthrange(next_year, next_month)
        end_date = date(next_year, next_month, last_day)

        return {
            "start": start_date.isoformat(),
            "end": end_date.isoformat()
        }
    
    @staticmethod
    def organize_menu_by_category(menu_pool: List[str], categories: Optional[Dict[str, List[str]]]) -> Dict[str, List[str]]:
        """메뉴를 카테고리별로 정리"""
        if categories:
            # 이미 카테고리 정보가 제공된 경우
            return categories
        
        # 간단한 카테고리 추정 로직
        categorized = {
            "soup": [],
            "rice": [],
            "sidedish": [],
            "maindish": []
        }

        category_keywords = {
            "rice": ["밥", "덮밥", "볶음밥", "비빔밥"],
            "soup": ["국", "탕", "찌개", "전골", "스프"],
            "maindish": ["구이", "볶음", "찜", "조림", "불고기", "갈비", "고기", "생선"],
            "sidedish": ["나물", "무침", "장아찌", "샐러드", "김치", "깍두기"],
        }

        # 메뉴 분류
        for menu in menu_pool:
            categorized_flag = False
            for category, keywords in category_keywords.items():
                if any(keyword in menu for keyword in keywords):
                    categorized[category].append(menu)
                    categorized_flag = True
                    break
            if not categorized_flag:
                categorized["기타"].append(menu)
        
        return categorized

    @staticmethod
    def organize_ratings_by_category(ratings: Dict[str, float], categorized_menu: Dict[str, List[str]]) -> Dict[str, Dict[str, float]]:
        """선호도 데이터를 카테고리별로 정리"""
        categorized_ratings = {}

        for category, menus in categorized_menu.items():
            # 각 카테고리 별로 해당 메뉴의 선호도만 추출
            category_ratings ={}

            for menu in menus:
                if menu in ratings:
                    category_ratings[menu] = ratings[menu]

            # 상위 10개만 유지(카테고리별 토큰 최적화)
            if category_ratings:
                sorted_items = sorted(category_ratings.items(), key=lambda x: x[1], reverse=True)
                top_items = sorted_items[:10]
                categorized_ratings[category] = dict(top_items)
        
        return categorized_ratings

    @staticmethod
    def waste_based_templates(leftover_data: Dict[str,float], date_range: Dict[str, Any], menu_pool: List[str], categories: Optional[Dict[str, List[str]]] = None) -> str:
        """
        잔반율 기반 식단 생성 프롬프트
        """
        # 다음 달 날짜 자동 계산
        date_range = PromptTemplates.get_next_month_range()

        # 카테고리별 메뉴 정리
        categorized_menu = PromptTemplates.organize_menu_by_category(menu_pool, categories)

        # 카테고리별 메뉴 제한 (각 카테고리당 최대 20개)
        limited_menu = {}
        for category, menus in categorized_menu.items():
            limited_menu[category] = menus[:20] if len(menus) > 20 else menus

        # 잔반율도 카테고리별로 정리
        categorized_leftover = PromptTemplates.organize_ratings_by_category(leftover_data, categories)

        return f"""
        당신은 학교 급식 메뉴를 계획하는 영양사입니다.
        
        ## 카테고리별 메뉴 풀 (일부)
        ```json
        {json.dumps(limited_menu, ensure_ascii=False, indent=2)}
        ```

        ## 카테고리별 메뉴 잔반율 (낮을수록 선호도 높음)
        ```json
        {json.dumps(categorized_leftover, ensure_ascii=False, indent=2)}
        ```

        ## 목표 기간
        - 시작일: {date_range['start']}
        - 종료일: {date_range['end']}

        ## 요청사항
        1. 잔반율이 낮은 메뉴를 더 자주 포함하고, 잔반율이 높은 메뉴는 개선된 조합으로 제공해주세요.
        2. 각 날짜별로 메뉴 조합을 추천해주세요.
            - soup 1개, rice 1개, main_dish 1개, side_dishes 2개로 생성해주세요.
        3. 기존에 없는 메뉴는 임의로 생성하지 마세요.
        4. 같은 메뉴는 최소 5일 간격으로 배치해주세요

        ## 출력 형식
        날짜별 메뉴 목록을 JSON 형식으로 작성해주세요:
        ```json
        {
          "2025-06-01": ["찹쌀밥", "미역국", "돈육불고기", "시금치나물", "콩나물무침"],
          "2025-06-02": ["잡곡밥", "된장찌개", "고등어구이", "도라지무침", "배추김치"],
          ...
        }
        ```
        """
    
    @staticmethod
    def nutrition_based_template(preference_data: Dict[str, Dict[str, float]], date_range: Dict[str, Any], menu_pool: List[str], categories: Optional[Dict[str, List[str]]]=None) -> str:
        """
        영양소 기반 식단 생성 프롬프트
        """
        # 다음 달 날짜 자동 계산
        date_range = PromptTemplates.get_next_month_range()
        
        # 카테고리별 메뉴 정리
        categorized_menu = PromptTemplates.organize_menu_by_category(menu_pool, categories)
        
        # 카테고리별 메뉴 제한 (각 카테고리당 최대 20개)
        limited_menu = {}
        for category, menus in categorized_menu.items():
            limited_menu[category] = menus[:20] if len(menus) > 20 else menus
        
        # 선호도 데이터 정리 (average_rating 키에서 추출)
        ratings = preference_data.get("average_rating", {})

        # 카테고리별 선호도 정리
        categorized_ratings = PromptTemplates.organize_ratings_by_category(ratings, categorized_menu)


        return f"""
        당신은 영양 균형에 정통한 식단 플래너입니다.

        ## 카테고리별 메뉴 풀
        ```json
        {json.dumps(limited_menu, ensure_ascii=False, indent=2)}
        ```
        
        ## 카테고리별 메뉴 선호도 (높을수록 인기 있음)
        ```json
        {json.dumps(categorized_ratings, ensure_ascii=False, indent=2)}
        ```


        ## 목표 기간
        - 시작일: {date_range['start']}
        - 종료일: {date_range['end']}

        ## 영양목표
        - 영양소	하루 권장 섭취량	점심 한 끼 권장 섭취량
        - 에너지 (kcal)	2,200~2,800	730~930
        - 탄수화물 (g)	300~400	100~133
        - 당류 (g)	≤ 55	≤ 18
        - 지방 (g)	60~93	20~31
        - 단백질 (g)	50~65	17~22
        - 칼슘 (mg)	800~1,000	267~333
        - 인 (mg)	1,200	400
        - 나트륨 (mg)	≤ 2,300	≤ 767
        - 칼륨 (mg)	3,500	1,167
        - 마그네슘 (mg)	340~410	113~137
        - 철 (mg)	11~15	4~5
        - 아연 (mg)	9~11	3~4
        - 콜레스테롤 (mg)	≤ 300	≤ 100

        ## 요청사항
        1. 영양 균형을 고려한 일일 식단을 구성해주세요. (가능하면 한 끼 섭취 권장량을 넘어가지 않게, 최대 하루 섭취 권장량을 넘어가지 않게 식단을 짜주세요.)
        2. 선호도가 높은 메뉴를 적절히 활용하되, 다양성도 고려해주세요.
        3. 기존에 없는 메뉴를 임의로 생성하지 마세요.
        4. 각 날짜별로 메뉴 조합을 추천해주세요.
            - soup 1개, rice 1개, main_dish 1개, side_dishes 2개로 생성해주세요.
        5. 같은 메뉴는 최소 5일 간격으로 배치해주세요.
            
        ## 출력 형식
        날짜별 메뉴 목록을 JSON 형식으로 작성해주세요:
        ```json
        {
          "2025-06-01": ["찹쌀밥", "미역국", "돈육불고기", "시금치나물", "콩나물무침"],
          "2025-06-02": ["잡곡밥", "된장찌개", "고등어구이", "도라지무침", "배추김치"],
          ...
        }
        ```
        """
    
    @staticmethod
    def integration_template(waste_plan: Dict[str, List[str]], nutrition_plan: Dict[str, List[str]]) -> str:
        """
        통합 식단 생성 프롬프트
        """
        return f"""
        당신은 다양한 요구사항을 균형있게 반영하는 메뉴 통합 전문가입니다.


        ## 잔반율 고려 식단(잔반 최소화 에이전트 결과)
        ```json
        {json.dumps(waste_plan, ensure_ascii=False, indent=2)}
        ```

        ## 영양소 고려 식단(영양 균형 에이전트 결과)
        ```json
        {json.dumps(nutrition_plan, ensure_ascii=False, indent=2)}
        ```

        ## 요청사항
        1. 두 식단의 장점을 결합하여 최적의 통합 식단을 생성해주세요.
        2. 잔반이 적으면서도 영양적으로 균형잡힌 식단을 구성해주세요.
        3. 메뉴 간 다양성과 조화를 고려해주세요.
        4. 기존에 없는 메뉴를 임의로 생성하지 마세요.
        5. 각 날짜별로 메뉴 조합을 추천해주세요.
            - soup 1개, rice 1개, main_dish 1개, side_dishes 2개로 생성해주세요.
        6. 같은 메뉴는 최소 5일 간격으로 배치해주세요.
        
        
        ## 출력 형식
        날짜별 메뉴 목록을 JSON 형식으로 작성해주세요:
        ```json
        {
          "2025-06-01": ["찹쌀밥", "미역국", "돈육불고기", "시금치나물", "콩나물무침"],
          "2025-06-02": ["잡곡밥", "된장찌개", "고등어구이", "도라지무침", "배추김치"],
          ...
        }
        ```
        
        또한 각 카테고리별로 대체 메뉴 옵션도 함께 제공해주세요:
        ```json
        {
          "alternatives": {
            "2025-06-01": {
              "밥류": ["잡곡밥", "흰밥"],
              "국류": ["된장국", "콩나물국"],
              "메인반찬": ["제육볶음", "닭갈비"],
              "부반찬": ["무생채", "도라지무침", "오이무침"]
            },
            ...
          }
        }
        ```
        """