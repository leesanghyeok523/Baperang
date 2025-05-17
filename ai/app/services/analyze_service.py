import time
from typing import Dict, Any
import aiohttp
import random
import boto3
import os
import asyncio
from ..config import settings
import requests
import cv2
import numpy as np
from .custom_model import analyze_food_image_custom, load_resnet_model, load_midas_model

# 메모리 캐시를 위한 딕셔너리
reference_cache = {}

def download_image(url):
    start = time.time()
    resp = requests.get(url, stream=True)
    img_arr = np.asarray(bytearray(resp.content), dtype=np.uint8)
    img = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
    elapsed = time.time() - start
    if settings.DEBUG:
        print(f"[TIMING] download_image: {elapsed:.3f}s for {url}")
    return img


def crop_center(img, crop_ratio=0.1, cache_key=None):
    start = time.time()
    h, w = img.shape[:2]
    ch, cw = int(h * crop_ratio), int(w * crop_ratio)
    startx = w//2 - cw//2
    starty = h//2 - ch//2
    cropped = img[starty:starty+ch, startx:startx+cw]
    
    # 캐시 키가 제공된 경우 메모리에 저장
    if cache_key is not None:
        reference_cache[cache_key] = cropped
        
    elapsed = time.time() - start
    if settings.DEBUG:
        print(f"[TIMING] crop_center: {elapsed:.3f}s")
    return cropped


class AnalyzeService:
    """잔반 분석 서비스"""
    
    def __init__(self):
        if settings.DEBUG:
            print("[ANALYZE] Initializing analyze service")

    async def analyze_image(self, image_url: str) -> Dict[str, Any]:
        start = time.time()
        leftoverRate = round(random.uniform(0.1, 0.5) * 100, 1)
        elapsed = time.time() - start
        if settings.DEBUG:
            print(f"[TIMING] analyze_image: {elapsed:.3f}s for {image_url}")
            print(f"[ANALYZE] Leftover rate: {leftoverRate}%")
        return leftoverRate
        
    async def analyze_leftover_images(self, before_images: Dict[str, str], 
                                      after_images: Dict[str, str], 
                                      student_info: Dict[str, Any]) -> Dict[str, Any]:
        total_start = time.time()
        before_amounts = {}
        after_amounts = {}
        leftover_rates = {}

        # 모델 가중치 파일 경로 설정 + 로딩 시간 측정
        load_start = time.time()
        weights_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'weights', 'new_opencv_ckpt_b84_e200.pth')
        resnet_model = load_resnet_model(weights_path, device='cuda')
        midas_model, midas_transform = load_midas_model(device='cuda')
        load_elapsed = time.time() - load_start
        if settings.DEBUG:
            print(f"[TIMING] Model load: {load_elapsed:.3f}s")

        for category in before_images.keys():
            if category in after_images:
                # 이미지 다운로드
                dl_start = time.time()
                before_img = download_image(before_images[category])
                after_img = download_image(after_images[category])
                dl_elapsed = time.time() - dl_start
                if settings.DEBUG:
                    print(f"[TIMING] download two images for {category}: {dl_elapsed:.3f}s")

                # 중앙 crop (reference) - 메모리에 캐싱
                ref_start = time.time()
                cache_key = f"reference_{category}"
                reference = crop_center(before_img, cache_key=cache_key)
                ref_elapsed = time.time() - ref_start
                if settings.DEBUG:
                    print(f"[TIMING] crop_center for {category}: {ref_elapsed:.3f}s")

                # 식전 이미지 분석
                pre_start = time.time()
                before_result = analyze_food_image_custom(
                    target_image_path=before_img,
                    reference_image_path=reference,
                    resnet_model=resnet_model,
                    midas_model=midas_model,
                    midas_transform=midas_transform,
                    image_name=before_images[category],
                )
                pre_elapsed = time.time() - pre_start
                if settings.DEBUG:
                    print(f"[TIMING] analyze before image for {category}: {pre_elapsed:.3f}s")

                # 식후 이미지 분석
                post_start = time.time()
                after_result = analyze_food_image_custom(
                    target_image_path=after_img,
                    reference_image_path=reference,
                    resnet_model=resnet_model,
                    midas_model=midas_model,
                    midas_transform=midas_transform,
                    image_name=after_images[category],
                )
                post_elapsed = time.time() - post_start
                if settings.DEBUG:
                    print(f"[TIMING] analyze after image for {category}: {post_elapsed:.3f}s")

                # 각 모델별 결과 추출
                before_backproj = before_result['backproj_percentage'] if before_result else 0.0
                after_backproj = after_result['backproj_percentage'] if after_result else 0.0
                before_volume = before_result['food_volume_cm3'] if before_result else 0.0
                after_volume = after_result['food_volume_cm3'] if after_result else 0.0
                before_resnet = before_result['resnet_result'][2] if before_result else 0.0
                after_resnet = after_result['resnet_result'][2] if after_result else 0.0

                # before/after 딕셔너리 저장
                before_amounts[category] = {
                    'backproj': float(round(before_backproj, 1)),
                    'food_volume_cm3': float(round(before_volume, 2)),
                    'resnet': float(round(before_resnet, 1))
                }
                after_amounts[category] = {
                    'backproj': float(round(after_backproj, 1)),
                    'food_volume_cm3': float(round(after_volume, 2)),
                    'resnet': float(round(after_resnet, 1))
                }

                # leftover 계산
                if before_backproj > 0:
                    leftover_backproj = max(0, (before_backproj - after_backproj) / before_backproj * 100)
                else:
                    leftover_backproj = 0.0
                if before_resnet > 0:
                    leftover_resnet = max(0, (before_resnet - after_resnet) / before_resnet * 100)
                else:
                    leftover_resnet = 0.0
                if before_volume > 0:
                    leftover_volume_pct = max(0, (before_volume - after_volume) / before_volume * 100)
                else:
                    leftover_volume_pct = 0.0

                # 가중치 적용 (예외 처리)
                # 1. after의 backproj가 20 이하라면 backproj 1.0, resnet/midas 0
                if after_backproj <= 20:
                    w_backproj, w_volume, w_resnet = 1.0, 0.0, 0.0
                # 2. resnet leftover가 0.0이면 backproj 0.5, midas 0.5
                elif leftover_resnet == 0.0:
                    w_backproj, w_volume, w_resnet = 0.5, 0.5, 0.0
                # 3. 기본 가중치
                else:
                    w_backproj, w_volume, w_resnet = 0.4, 0.3, 0.3

                final_leftover = (
                    w_backproj * leftover_backproj +
                    w_volume * leftover_volume_pct +
                    w_resnet * leftover_resnet
                )

                leftover_rates[category] = {
                    'backproj': float(round(leftover_backproj, 1)),
                    'food_volume_pct': float(round(leftover_volume_pct, 1)),
                    'resnet': float(round(leftover_resnet, 1)),
                    'final': float(round(final_leftover, 1))
                }

        total_elapsed = time.time() - total_start
        if settings.DEBUG:
            print(f"[TIMING] Total analyze_leftover_images: {total_elapsed:.3f}s")
            print(f"[ANALYZE] Processed images for {student_info.get('name')}")
            print(f"[ANALYZE] Before: {before_amounts}")
            print(f"[ANALYZE] After: {after_amounts}")
            print(f"[ANALYZE] Leftover: {leftover_rates}")

        leftoverRate_final = {k: round(100 - v['final'], 2) for k, v in leftover_rates.items()}
        return {
            "leftoverRate": leftoverRate_final,
            "studentInfo": student_info
        }

    async def _calculate_leftover(self, before_url: str, after_url: str) -> float:
        # 더미 구현
        return round(random.uniform(1.0, 35.0), 1)


def analyze_leftover(before_images, after_images, resnet_model, midas_model, midas_transform):
    start = time.time()
    result = {}
    for key in before_images:
        # 이미지 다운로드
        dl_start = time.time()
        before_img = download_image(before_images[key])
        after_img = download_image(after_images[key])
        dl_elapsed = time.time() - dl_start
        if settings.DEBUG:
            print(f"[TIMING] analyze_leftover download images for {key}: {dl_elapsed:.3f}s")

        # 중앙 crop - 메모리에 캐싱
        crop_start = time.time()
        cache_key = f"reference_{key}_{int(time.time()*1000)}"
        reference = crop_center(before_img, cache_key=cache_key)
        crop_elapsed = time.time() - crop_start
        if settings.DEBUG:
            print(f"[TIMING] analyze_leftover crop_center for {key}: {crop_elapsed:.3f}s")

        # 분석
        proc_start = time.time()
        res = analyze_food_image_custom(
            target_image_path=after_img,
            reference_image_path=reference,
            resnet_model=resnet_model,
            midas_model=midas_model,
            midas_transform=midas_transform
        )
        proc_elapsed = time.time() - proc_start
        if settings.DEBUG:
            print(f"[TIMING] analyze_food_image_custom for {key}: {proc_elapsed:.3f}s")

        result[key] = res['final_percentage'] if res else 0.0

    elapsed = time.time() - start
    if settings.DEBUG:
        print(f"[TIMING] Total analyze_leftover: {elapsed:.3f}s")
    return result
