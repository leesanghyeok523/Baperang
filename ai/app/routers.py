from fastapi import APIRouter, FastAPI
from .services import (
    generate_waste_plan,
    generate_nutrition_plan,
    integrate_plans,
    analyze_leftover
)
from pydantic import BaseModel
from typing import Dict, List
from .models import (
    PlanRequest,
    PlanResponse,
    AnalyzeRequest,           
    AnalyzeResponse,          
)

router = APIRouter()

@router.post("/ai/analyze-leftover", response_model=AnalyzeResponse)
async def analyze_leftover_endpoint(request: AnalyzeRequest):
    """
    POST /analyze-leftover
    { "image_s3_key": "2025/05/01/rice_plate.png" }
    → { "leftover": { "밥":0.45, "국":0.30, ... } }
    """
    data = await analyze_leftover(request.image_s3_key)
    return {"leftover": data}

@router.get("/ai/waste-plan", response_model=PlanResponse)
async def waste_plan():
    plan = await generate_waste_plan()
    return PlanResponse(plan=plan)

@router.get("/ai/nutrition-plan", response_model=PlanResponse)
async def nutrition_plan():
    plan = await generate_nutrition_plan()
    return PlanResponse(plan=plan)

@router.post("/ai/integrated-plan", response_model=PlanResponse)
async def integrated_plan(request: PlanRequest):
    """
    POST /integrated-plan
    {
      "leftover_data": { "2025-02-01": 0.42, ... },
      "preference_data": {
        "average_rating": {
          "제육볶음": 4.5,
          ...
        }
      }
    }
    →
    {
      "plan": {
        "2025-05-01": ["김치찌개", "밥"],
        ...
      }
    }
    """
    waste = await generate_waste_plan(request.leftover_data)
    nutrition = await generate_nutrition_plan(request.leftover_data)
    final = await integrate_plans(waste=waste, nutrition=nutrition)
    return PlanResponse(plan=final)