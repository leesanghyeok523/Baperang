# LangGraph 워크플로우 정의 (식단 에이전트)
import asyncio
from langchain.chat_models import ChatOpenAI
from langgraph import StateGraph, START
from app.services import generate_waste_plan, generate_nutrition_plan, integrate_plans
from app.config import OPENAI_API_KEY


# 1. LLM 클라이언트 초기화
llm_gpt4 = ChatOpenAI(
    model_name="gpt-4",
    temperature=0.2,
    openai_api_key=OPENAI_API_KEY,
    )

# 2. 그래프 빌더 생성
builder = StateGraph(dict)

# 3. 에이전트 노드 등록
builder.add_node(
    lambda state: {"waste_plan": state.update({"waste_plan": generate_waste_plan()}) or state["waste_plan"]},
    name="WastePlanAgent",
)
builder.add_node(
    lambda state: {"nutrition_plan": state.update({"nutrition_plan": generate_nutrition_plan()}) or state["nutrition_plan"]},
    name="NutritionPlanAgent",
)
builder.add_node(
    lambda state: {"integrated_plan": integrate_plans(state["waste_plan"], state["nutrition_plan"])},
    name="IntegrationAgent",
)

# 4. 엣지(흐름) 정의
builder.add_edge(START, "WastePlanAgent")
builder.add_edge(START, "NutritionPlanAgent")
builder.add_edge("WastePlanAgent", "IntegrationAgent")
builder.add_edge("NutritionPlanAgent", "IntegrationAgent")

# 5. 컴파일
graph = builder.compile()

# 6. 실행
def run_multiagent():
    # 상태 초기화
    init_state ={}
    result_state = graph.run(init_state)
    return result_state["integrated_plan"]

if __name__ == "__main__":
    # 테스트 실행
    result = run_multiagent()
    print("최종 플랜",result)