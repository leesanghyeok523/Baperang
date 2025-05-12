import json
from typing import Dict, Any, List, Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

from ..config import settings

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

        # LLM 클라이언트 초기화
        self.llm = ChatOpenAI(
            model_name=self.model_name,
            temperature=self.temperature,
            openai_api_key=settings.OPENAI_API_KEY
        )

        # 로깅
        if settings.DEBUG:
            print(f"[LLM] Initialized with model: {self.model_name}, temp: {self.temperature}")
    
    async def generate_response(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        프롬프트에 대한 응답 생성

        Args:
            prompt: 사용자 프롬프트
            system_prompt: 시스템 프롬프트 (옵션)

        Returns:
            str: LLM 응답 텍스트
        """
        messages = []

        # 시스템 프롬프트 있는 경우 추가
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))

        
        # 사용자 프롬프트 추가
        messages.append(HumanMessage(content=prompt))

        # LLM 호출
        response = await self.llm.ainvoke(messages)
        return response.content
    
    async def generate_structured_response(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        """
        구조화된 JSON 응답 생성

        Args:
            prompt: 사용자 프롬프트
            system_prompt: 시스템 프롬프트
        
        Returns:
            Dict: 파싱된 JSON객체
        """

        # LLM응답 생성
        response_text = await self.generate_response(prompt, system_prompt)

        # JSON 파싱
        try:
            # JSON 블록 추출
            json_match = response_text.strip()
            if "```json" in json_match:
                json_match = json_match.split("```json")[1].split("```")[0].strip()
            elif "```" in json_match:
                json_match = json_match.split("```")[1].split("```")[0].strip()

            # JSON 파싱
            return json.loads(json_match)
        except Exception as e:
            # 파싱 실패하면 수동 파싱
            try:
                # 줄별로 처리하여 날짜: 메뉴 형식 파싱
                result = {}
                for line in response_text.splitlines():
                    if ":" in line:
                        date, menus = line.split(":", 1)
                        date = date.strip()
                        menus_list = [m.strip() for m in menus.replace("[", "").replace("]","").split(",")]
                        result[date] = menus_list
                return result
            except:
                # 모든 파싱 실패 시 원본 반환
                print(f"[LLM] JSON 파싱 실패: {str(e)}")
                return {"error": "JSON 파싱 실패", "raw_response": response_text}