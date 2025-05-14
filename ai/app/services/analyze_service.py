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


def download_image(url):
    start = time.time()
    resp = requests.get(url, stream=True)
    img_arr = np.asarray(bytearray(resp.content), dtype=np.uint8)
    img = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
    elapsed = time.time() - start
    if settings.DEBUG:
        print(f"[TIMING] download_image: {elapsed:.3f}s for {url}")
    return img


def crop_center(img, crop_ratio=0.5):
    start = time.time()
    h, w = img.shape[:2]
    ch, cw = int(h * crop_ratio), int(w * crop_ratio)
    startx = w//2 - cw//2
    starty = h//2 - ch//2
    cropped = img[starty:starty+ch, startx:startx+cw]
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
        weights_path = os.path.join('app', 'weigths', 'new_opencv_ckpt_b84_e200.pth')
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

                # 중앙 crop (reference)
                ref_start = time.time()
                reference = crop_center(before_img)
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
                    output_dir='./results',
                    image_name=before_images[category]
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
                    output_dir='./results',
                    image_name=after_images[category]
                )
                post_elapsed = time.time() - post_start
                if settings.DEBUG:
                    print(f"[TIMING] analyze after image for {category}: {post_elapsed:.3f}s")

                # 음식량 추출 및 잔반율 계산
                before_amount = before_result['final_percentage'] if before_result else 0.0
                after_amount = after_result['final_percentage'] if after_result else 0.0
                leftover_rate = max(0, before_amount - after_amount)

                before_amounts[category] = round(before_amount, 1)
                after_amounts[category] = round(after_amount, 1)
                leftover_rates[category] = round(leftover_rate, 1)

        total_elapsed = time.time() - total_start
        if settings.DEBUG:
            print(f"[TIMING] Total analyze_leftover_images: {total_elapsed:.3f}s")
            print(f"[ANALYZE] Processed images for {student_info.get('name')}")
            print(f"[ANALYZE] Before: {before_amounts}")
            print(f"[ANALYZE] After: {after_amounts}")
            print(f"[ANALYZE] Leftover: {leftover_rates}")

        return {
            "leftoverRate": after_amounts,
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

        # 중앙 crop
        crop_start = time.time()
        reference = crop_center(before_img)
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
