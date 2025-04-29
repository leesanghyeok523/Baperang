from fastapi import APIRouter, FastAPI
from app.services import (
    generate_waste_plan,
    generate_nutrition_plan,
    integrate_plans,
    analyze_leftover
)
from pydantic import BaseModel
from typing import Dict, List
from app.models import (
    PlanResponse,
    AnalyzeRequest,           
    AnalyzeResponse,          
)

router = APIRouter()

@router.post("/analyze-leftover", response_model=AnalyzeResponse)
async def analyze_leftover_endpoint(request: AnalyzeRequest):
    """
    POST /analyze-leftover
    { "image_s3_key": "2025/05/01/rice_plate.png" }
    → { "leftover": { "밥":0.45, "국":0.30, ... } }
    """
    data = await analyze_leftover(request.image_s3_key)
    return {"leftover": data}

@router.get("/waste-plan", response_model=PlanResponse)
async def waste_plan():
    plan = await generate_waste_plan()
    return PlanResponse(plan=plan)

@router.get("/nutrition-plan", response_model=PlanResponse)
async def nutrition_plan():
    plan = await generate_nutrition_plan()
    return PlanResponse(plan=plan)

@router.get("/integrated-plan", response_model=PlanResponse)
async def integrated_plan():
    waste = await generate_waste_plan()
    nutrition = await generate_nutrition_plan()
    final = await integrate_plans(waste=waste, nutrition=nutrition)
    return PlanResponse(plan=final)