import time
from typing import Dict, Any, List
import aiohttp
import random
import boto3
import os
import asyncio
from ..config import settings
import requests
import cv2
import numpy as np
from .custom_model import analyze_food_image_custom, load_resnet_model, load_midas_model, preprocess_image_for_midas
from .worker_utils import reseed_every_thread
import torch

# RNG 시드 고정
SEED = 42
random.seed(SEED)         # 파이썬 표준 RNG
np.random.seed(SEED)      # NumPy RNG
torch.manual_seed(SEED)   # PyTorch
cv2.setRNGSeed(SEED)      # OpenCV RNG

# CPU 스레드 수 제한
torch.set_num_threads(1)
os.environ["OMP_NUM_THREADS"] = "1"

# 메모리 캐시를 위한 딕셔너리
reference_cache = {}

async def download_image_async(url: str, session: aiohttp.ClientSession) -> np.ndarray:
    """비동기로 이미지 다운로드"""
    start = time.time()
    try:
        async with session.get(url) as response:
            if response.status != 200:
                raise Exception(f"이미지 다운로드 실패: HTTP {response.status}")
            
            # 바이너리 데이터 읽기
            content = await response.read()
            
            # numpy 배열로 변환
            img_arr = np.frombuffer(content, dtype=np.uint8)
            
            # 이미지 디코딩
            img = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
            
            if img is None:
                raise Exception("이미지 디코딩 실패")
            
            elapsed = time.time() - start
            if settings.DEBUG:
                print(f"[TIMING] download_image_async: {elapsed:.3f}s for {url}")
            return img
            
    except Exception as e:
        if settings.DEBUG:
            print(f"[ERROR] download_image_async failed for {url}: {str(e)}")
        raise Exception(f"이미지 다운로드 실패: {str(e)}")

def crop_center(img, crop_ratio=0.1, cache_key=None):
    start = time.time()
    h, w = img.shape[:2]
    ch, cw = int(h * crop_ratio), int(w * crop_ratio)
    startx = w//2 - cw//2
    starty = h//2 - ch//2
    cropped = img[starty:starty+ch, startx:startx+cw]
    
    if cache_key is not None:
        reference_cache[cache_key] = cropped
        
    elapsed = time.time() - start
    if settings.DEBUG:
        print(f"[TIMING] crop_center: {elapsed:.3f}s")
    return cropped

def preprocess_image_for_midas(img: np.ndarray) -> np.ndarray:
    """MiDaS 모델을 위한 이미지 전처리"""
    # 원본 이미지의 비율 유지하면서 크기 조정
    h, w = img.shape[:2]
    target_size = 384
    
    # 비율 계산
    ratio = target_size / max(h, w)
    new_h, new_w = int(h * ratio), int(w * ratio)
    
    # 이미지 리사이즈
    img = cv2.resize(img, (new_w, new_h))
    
    # 패딩 추가하여 정사각형으로 만들기
    square_img = np.zeros((target_size, target_size, 3), dtype=np.uint8)
    y_offset = (target_size - new_h) // 2
    x_offset = (target_size - new_w) // 2
    square_img[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = img
    
    return square_img

def _analyze_with_reseed(*args, **kwargs):
    """RNG 시드를 다시 고정하고 이미지 분석 수행"""
    reseed_every_thread()
    return analyze_food_image_custom(*args, **kwargs)

async def analyze_image_parallel(
    image: np.ndarray,
    reference: np.ndarray,
    resnet_model: Any,
    midas_model: Any,
    midas_transform: Any,
    image_name: str
) -> Dict[str, Any]:
    """단일 이미지 분석을 비동기로 실행"""
    start = time.time()
    
    # CPU 바운드 작업을 별도의 스레드에서 실행
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        lambda: _analyze_with_reseed(
            target_image_path=image,
            reference_image_path=reference,
            resnet_model=resnet_model,
            midas_model=midas_model,
            midas_transform=midas_transform,
            image_name=image_name,
        )
    )
    
    elapsed = time.time() - start
    if settings.DEBUG:
        print(f"[TIMING] analyze_image_parallel for {image_name}: {elapsed:.3f}s")
    return result

async def process_before_images_parallel(
    before_images: Dict[str, str],
    resnet_model: Any,
    midas_model: Any,
    midas_transform: Any
) -> Dict[str, Dict[str, Any]]:
    """식전 이미지들을 병렬로 처리"""
    async def process_single_image(category: str, url: str) -> tuple[str, Dict[str, Any]]:
        # 이미지 다운로드
        img = await download_image_async(url, session)
        # 중앙 crop
        reference = crop_center(img, cache_key=f"reference_{category}")
        # 분석
        result = await analyze_image_parallel(
            img, reference, resnet_model, midas_model, midas_transform, url
        )
        return category, result

    # aiohttp 세션 생성
    async with aiohttp.ClientSession() as session:
        # 모든 이미지에 대한 태스크 생성
        tasks = [process_single_image(category, url) for category, url in before_images.items()]
        
        # 모든 태스크를 병렬로 실행
        results = await asyncio.gather(*tasks)
        
        # 결과를 딕셔너리로 변환
        return dict(results)

async def process_after_images_parallel(
    after_images: Dict[str, str],
    before_results: Dict[str, Dict[str, Any]],
    resnet_model: Any,
    midas_model: Any,
    midas_transform: Any
) -> Dict[str, Dict[str, Any]]:
    """식후 이미지들을 병렬로 처리"""
    async def process_single_image(category: str, url: str) -> tuple[str, Dict[str, Any]]:
        if category not in before_results:
            return category, None
            
        # 이미지 다운로드
        img = await download_image_async(url, session)
        # 참조 이미지 가져오기
        reference = reference_cache.get(f"reference_{category}")
        if reference is None:
            reference = crop_center(img, cache_key=f"reference_{category}")
        # 분석
        result = await analyze_image_parallel(
            img, reference, resnet_model, midas_model, midas_transform, url
        )
        return category, result

    # aiohttp 세션 생성
    async with aiohttp.ClientSession() as session:
        # 모든 이미지에 대한 태스크 생성
        tasks = [process_single_image(category, url) for category, url in after_images.items()]
        
        # 모든 태스크를 병렬로 실행
        results = await asyncio.gather(*tasks)
        
        # 결과를 딕셔너리로 변환
        return dict(results)

class AnalyzeService:
    """잔반 분석 서비스"""
    
    def __init__(self):
        if settings.DEBUG:
            print("[ANALYZE] Initializing analyze service")
        self.device = torch.device("cpu")
        
        # 모델 싱글톤으로 로드
        weights_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'weights', 'new_opencv_ckpt_b84_e200.pth')
        self.resnet_model = load_resnet_model(weights_path, device='cpu')
        self.midas_model, self.midas_transform = load_midas_model(device='cpu')

    async def analyze_leftover_images(
        self,
        before_images: Dict[str, str],
        after_images: Dict[str, str],
        student_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        total_start = time.time()
        
        # 식전 이미지 병렬 처리
        before_start = time.time()
        before_results = await process_before_images_parallel(
            before_images, self.resnet_model, self.midas_model, self.midas_transform
        )
        before_elapsed = time.time() - before_start
        if settings.DEBUG:
            print(f"[TIMING] Process before images: {before_elapsed:.3f}s")

        # 식후 이미지 병렬 처리
        after_start = time.time()
        after_results = await process_after_images_parallel(
            after_images, before_results, self.resnet_model, self.midas_model, self.midas_transform
        )
        after_elapsed = time.time() - after_start
        if settings.DEBUG:
            print(f"[TIMING] Process after images: {after_elapsed:.3f}s")

        # 결과 처리
        before_amounts = {}
        after_amounts = {}
        leftover_rates = {}

        for category in before_results.keys():
            if category in after_results:
                before_result = before_results[category]
                after_result = after_results[category]

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

                # 가중치 적용
                if after_backproj <= 20:
                    w_backproj, w_volume, w_resnet = 1.0, 0.0, 0.0
                elif leftover_resnet == 0.0:
                    w_backproj, w_volume, w_resnet = 0.5, 0.5, 0.0
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
