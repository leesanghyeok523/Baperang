from typing import Dict, List, Any

def get_leftover_data() -> Dict[str, float]:
    # PoC 용 더미 데이터
    return {
        "2025-05-02": 0.45,
        "2025-05-03": 0.30,
        "2025-05-04": 0.20,
    }

def get_nutrition_data() -> Dict[str, Dict[str, Any]]:
    # PoC 용 영양 목표
    return {
        "calories": 2000,
        "protien": 50,
        "carbs": 300,
        "fat": 70,
    }