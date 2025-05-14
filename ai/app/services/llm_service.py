import json, time
import os
import asyncio

from typing import Dict, Any, List, Optional
from openai import OpenAI

from ..config import settings
openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

# schema 정의부
waste_plan_fn: Dict[str, Any] = {
    "name": "waste_plan",
    "description": "잔반율을 최소화하는 식단 플랜 생성",
    "parameters": {
        "type": "object",
        "properties": {
            "plan": {
                "type": "object",
                "description": "날짜별 카테고리화된 메뉴 구성 (날짜를 키로, 메뉴명-카테고리 매핑을 값으로)",
                "additionalProperties": {
                    "type": "object",
                    "description": "메뉴 이름을 키로, 카테고리를 값으로 하는 매핑",
                    "additionalProperties": {
                        "type": "string",
                        "enum": ["soup", "rice", "main", "side"]
                    }
                }
            }
        },
        "required": ["plan"]
    }
}

nutrition_plan_fn: Dict[str, Any] = {
    "name": "nutrition_plan",
    "description": "영양 균형을 고려한 식단 플랜",
    "parameters": {
        "type": "object",
        "properties": {
            "plan": {
                "type": "object",
                "description": "날짜별 카테고리화된 메뉴 구성 (날짜를 키로, 메뉴명-카테고리 매핑을 값으로)",
                "additionalProperties": {
                    "type": "object",
                    "description": "메뉴 이름을 키로, 카테고리를 값으로 하는 매핑",
                    "additionalProperties": {
                        "type": "string",
                        "enum": ["soup", "rice", "main", "side"]
                    }
                }
            }
        },
        "required": ["plan"]
    }
}

integration_plan_fn: Dict[str, Any] = {
    "name": "integration_plan",
    "description": "영양 균형과 선호도를 고려한 균형적인 식단 플랜",
    "parameters": {
        "type": "object",
        "properties": {
            "plan": {
                "type": "object",
                "description": "날짜별 카테고리화된 메뉴 구성 (날짜를 키로, 메뉴명-카테고리 매핑을 값으로)",
                "additionalProperties": {
                    "type": "object",
                    "description": "메뉴 이름을 키로, 카테고리를 값으로 하는 매핑",
                    "additionalProperties": {
                        "type": "string",
                        "enum": ["soup", "rice", "main", "side"]
                    }
                }
            }
        },
        "required": ["plan"]
    }
}

class LLMService:
    """LLM 서비스 클래스"""

    def __init__(self, model_name: Optional[str]=None, temperature: Optional[float] = None):
        """
        LLM 서비스 초기화

        Args:
            model_name: gpt-4(기본)
            temperature: 0.2(기본)
        """

        self.model_name = model_name or settings.LLM_MODEL
        self.temperature = temperature or settings.LLM_TEMPERATURE

        # 캐싱 딕셔너리
        self.response_cache: Dict[str, str] = {}

        # 캐시 사용 여부 설정
        self.use_cache = settings.DEBUG and os.getenv("USE_LLM_CACHE", "True").lower() == "true"

        if self.use_cache and settings.DEBUG:
            print(f"[LLM] 캐싱 활성화: 동일한 프롬프트에 대한 중복 API 호출 방지")

        # LLM 클라이언트 초기화
        self.llm = OpenAI(
            # model_name=self.model_name,
            # temperature=self.temperature,
            api_key=settings.OPENAI_API_KEY
        )

        # 로깅
        if settings.DEBUG:
            print(f"[LLM] Initialized with model: {self.model_name}, temp: {self.temperature}")
    
    async def generate_structured_response(self, prompt: str,
                                           function_def: Dict[str, Any] = None, system_prompt: Optional[str] = None
                                           ) -> Dict[str, Any]:
        """
        구조화된 JSON 응답 생성

        Args:
            prompt: 사용자 프롬프트
            system_prompt: 시스템 프롬프트
        
        Returns:
            Dict: 파싱된 JSON객체
        """

        # (1) JSON 전용 시스템 메시지
        system = system_prompt or f"당신은 함수 호출만을 사용해 응답하는 AI입니다. {function_def['name']} 함수를 사용하여 결과를 반환하세요."

        # (2) 메시지 페이로드를 dict로 구성
        messages = [
            {"role": "system", "content": system},
            {"role": "user",   "content": prompt}
        ]

        if settings.DEBUG:
            print(f"[LLM][generate_structured_response] Requesting structured response")
            start_time = time.time()

        print(f"시스템 프롬프트: {system}")
        print(f"사용자 프롬프트: {prompt}")
        

        # function calling을 위한 openai SDK 적용
        resp = await asyncio.to_thread(
            openai_client.chat.completions.create,
            model=self.model_name,
            messages=messages,
            temperature=self.temperature,
            functions=[function_def],
            function_call="auto"
            # function_call={"name": function_def["name"]}
        )
        
        print("[DEBUG] resp = :", resp)

        message = resp.choices[0].message

        print("[DEBUG] function_call =", message.function_call)
        print("[DEBUG] function_call.name =", message.function_call.name)
        print("[DEBUG] function_call.arguments =", message.function_call.arguments)

        if message.function_call:
            try:
                print(f"원본 함수 호출 응답: {message.function_call.arguments}")
                payload = json.loads(message.function_call.arguments)
                if len(payload) == 0:
                    print(f"[ERROR] 빈 응답이 반환되었습니다. 프롬프트 내용을 확인하세요.")
                    # 대체 로직 구현 또는 오류 발생
                    return {}

                if "plan" in payload:
                    return payload["plan"]
                else:
                    return payload
            except Exception as e:
                print(f"[ERROR] 응답 처리 중 오류: {str(e)}")
                raise