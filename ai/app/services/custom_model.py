# 음식양추정/음식양추정/quantity_est/custom_model.py
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import cv2
from PIL import Image
import matplotlib.pyplot as plt
import os
import time
from datetime import datetime
import argparse

# 한글 폰트 설정
plt.rcParams['font.family'] = 'Malgun Gothic'  # 윈도우 기본 한글 폰트
plt.rcParams['axes.unicode_minus'] = False     # 마이너스 기호 깨짐 방지

# 모델 관련 임포트
from torchvision import transforms, models

# 역투영 알고리즘 함수
def back_projection(target_img, reference_img):
    """역투영 알고리즘으로 두 이미지 간의 유사성 측정"""
    # BGR에서 HSV로 변환
    hsv_target = cv2.cvtColor(target_img, cv2.COLOR_BGR2HSV)
    hsv_reference = cv2.cvtColor(reference_img, cv2.COLOR_BGR2HSV)
    
    # 히스토그램 계산
    roi_hist = cv2.calcHist([hsv_reference], [0, 1], None, [180, 256], [0, 180, 0, 256])
    cv2.normalize(roi_hist, roi_hist, 0, 255, cv2.NORM_MINMAX)
    
    # 역투영 수행
    dst = cv2.calcBackProject([hsv_target], [0, 1], roi_hist, [0, 180, 0, 256], 1)
    
    # 필터링 및 마스킹
    disc = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    cv2.filter2D(dst, -1, disc, dst)
    
    # 임계값 적용
    _, thr = cv2.threshold(dst, 50, 255, 0)
    thr = cv2.merge((thr, thr, thr))
    result_img = cv2.bitwise_and(target_img, thr)
    
    # 잔반 비율 계산 (검은색 픽셀 비율)
    h, w = result_img.shape[:2]
    black_pixels = np.sum(np.all(result_img == [0, 0, 0], axis=2))
    proportion = (black_pixels / (h * w)) * 100
    
    return proportion, result_img

# MiDaS 모델 로드 및 깊이 추정 함수
def load_midas_model(device='cuda'):
    """MiDaS 깊이 추정 모델 로드"""
    try:
        print("MiDaS DPT_Large 모델 로드 중...")
        midas = torch.hub.load("intel-isl/MiDaS", "DPT_Large")
        midas.to(device)
        midas.eval()
        
        # 입력 변환 설정
        midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms")
        transform = midas_transforms.dpt_transform
        
        return midas, transform
    except Exception as e:
        print(f"MiDaS 모델 로드 중 오류 발생: {e}")
        return None, None

def predict_depth(image, midas_model, midas_transform, device='cuda', img_base=None):
    """MiDaS로 깊이 맵 생성 및 깊이 가중치 적용"""
    if midas_model is None or midas_transform is None:
        return None, 0, None
    
    # 이미지 변환
    if isinstance(image, np.ndarray):
        img = image
    else:
        img = np.array(image)
    
    # 이미지가 RGBA인 경우 RGB로 변환
    if len(img.shape) > 2 and img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)
    
    # MiDaS 입력 형식으로 변환
    input_batch = midas_transform(img).to(device)
    
    # 깊이 추정
    with torch.no_grad():
        prediction = midas_model(input_batch)
        prediction = torch.nn.functional.interpolate(
            prediction.unsqueeze(1),
            size=img.shape[:2],
            mode="bicubic",
            align_corners=False,
        ).squeeze()
    
    # CPU로 이동 및 넘파이 배열로 변환
    depth_map = prediction.cpu().numpy()
    
    # 정규화
    depth_min = depth_map.min()
    depth_max = depth_map.max()
    if depth_max - depth_min > 0:
        depth_map = (depth_map - depth_min) / (depth_max - depth_min)
    
    # 깊이 맵에서 음식 부피 추정 및 깊이 가중치 적용 비율 계산
    volume_estimate, food_mask, weighted_ratio = estimate_volume_from_depth_with_weight(depth_map, img_base=img_base)
    
    # 가중치 적용 비율을 MiDaS 결과로 사용 (기존 volume_estimate 대신)
    return depth_map, weighted_ratio, food_mask

def estimate_volume_from_depth_with_weight(depth_map, threshold_method='kmeans', img_base=None):
    """깊이 맵에서 음식 부피 추정 (K-means 클러스터링 방식) 및 깊이 가중치 적용"""
    # 깊이 맵을 1차원 배열로 변환
    depth_flat = depth_map.flatten().reshape(-1, 1).astype(np.float32)
    
    # K-means 클러스터링으로 깊이 값을 2개 그룹으로 분류
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
    _, labels, centers = cv2.kmeans(depth_flat, 2, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
    
    # 두 클러스터의 중심값 확인
    center_0 = centers[0][0]
    center_1 = centers[1][0]
    
    # 클러스터 크기 계산 (각 클러스터에 속한 픽셀 수)
    cluster_0_size = np.sum(labels == 0)
    cluster_1_size = np.sum(labels == 1)
    cluster_0_ratio = cluster_0_size / len(labels)
    cluster_1_ratio = cluster_1_size / len(labels)
    
    # 1. 깊이 값 비교로 음식/배경 구분 (MiDaS에서는 작은 값이 더 먼 곳)
    # 2. 클러스터 크기 고려 (음식은 일반적으로 이미지의 일부분)
    # 음식 클러스터 선택 규칙:
    # - 더 작은 값(더 깊은 부분)을 음식으로
    # - 단, 클러스터 크기가 매우 작은 경우(노이즈) 무시
    MIN_CLUSTER_RATIO = 0.05  # 최소 클러스터 크기 (5%)
    
    # 기본적으로 깊은 부분(값이 작은)을 음식으로 선택하되, 크기 제한 적용
    if center_0 < center_1:
        if cluster_0_ratio > MIN_CLUSTER_RATIO:
            food_cluster = 0
        else:
            food_cluster = 1  # 크기가 너무 작으면 대신 배경 클러스터 사용
    else:
        if cluster_1_ratio > MIN_CLUSTER_RATIO:
            food_cluster = 1
        else:
            food_cluster = 0  # 크기가 너무 작으면 대신 배경 클러스터 사용
    
    # 음식 클러스터가 너무 큰 경우(이미지의 80% 이상) - 과대추정 방지
    selected_ratio = cluster_0_ratio if food_cluster == 0 else cluster_1_ratio
    if selected_ratio > 0.8:
        # 이미지의 25%만 음식으로 판단하도록 임계값 조정
        # percentile 기반 접근법으로 전환
        if center_0 < center_1:  # 작은 값이 음식
            threshold = np.percentile(depth_map, 25)  # 하위 25%만 음식으로
        else:
            threshold = np.percentile(depth_map, 75)  # 상위 25%만 음식으로
        
        # 조정된 임계값으로 마스크 생성
        food_mask = depth_map < threshold if center_0 < center_1 else depth_map > threshold
    else:
        # 마스크 생성
        labels = labels.reshape(depth_map.shape)
        food_mask = labels == food_cluster
    
    # 마스크 정제
    kernel = np.ones((5, 5), np.uint8)
    food_mask = food_mask.astype(np.uint8) * 255
    food_mask = cv2.morphologyEx(food_mask, cv2.MORPH_CLOSE, kernel)
    food_mask = cv2.morphologyEx(food_mask, cv2.MORPH_OPEN, kernel)
    food_mask = food_mask > 0
    
    # 음식 영역의 깊이 통계 계산
    masked_depth = depth_map.copy()
    masked_depth[~food_mask] = np.nan
    
    # 평균 깊이 계산
    avg_depth = np.nanmean(masked_depth) if np.sum(food_mask) > 0 else 0
    
    # 음식 영역 비율
    food_ratio = np.sum(food_mask) / depth_map.size
    
    # 비식판 영역의 깊이 값 평균 계산 (배경)
    tray_mask = ~food_mask
    if np.any(tray_mask):
        tray_depth_avg = np.nanmean(depth_map[tray_mask])
    else:
        # 없으면 평균 깊이 사용
        tray_depth_avg = np.mean(depth_map)
    
    # 음식 마스크 영역에 대해 높이 계산
    food_depth = np.zeros_like(depth_map)
    weighted_ratio = 0
    
    if np.any(food_mask):
        # 깊이 차이 계산 (음식과 배경의 깊이 차이)
        # MiDaS에서는 작은 값이 더 먼 곳이므로, 배경 - 음식 = 양수값 (음식이 더 깊음)
        food_depth[food_mask] = tray_depth_avg - masked_depth[food_mask]
        
        # 음수 값은 0으로 (배경보다 얕은 부분은 고려하지 않음)
        food_depth = np.maximum(0, food_depth)
        
        max_depth = np.max(food_depth)
        mean_depth = np.mean(food_depth[food_depth > 0]) if np.any(food_depth > 0) else 0
        
        # 깊이 가중치를 고려한 음식량 비율 계산
        # 1. 이미지 전체가 최대 깊이로 채워졌을 때의 총 부피 계산
        max_possible_volume = depth_map.size * max_depth
        
        # 2. 실제 음식 부피 계산
        actual_volume = np.sum(food_depth)
        
        # 3. 가중치가 적용된 비율 계산 (퍼센트로 변환)
        if max_possible_volume > 0:
            weighted_ratio = (actual_volume / max_possible_volume) * 100
    
    # 깊이 가중치를 적용한 음식 비율이 너무 높게 나오는 것을 방지하기 위한 스케일링
    # 최대 60%로 제한 (경험적 값)
    weighted_ratio = min(60, weighted_ratio)
    
    # 기존 볼륨 추정 - 면적과 깊이 모두 고려
    area_weight = 0.7
    depth_weight = 0.3
    volume_estimate = min(100, (area_weight * food_ratio * 100) + 
                           (depth_weight * (1 - avg_depth) * 100))
    
    return volume_estimate, food_mask, weighted_ratio

# ResNet 모델 로드 및 예측 함수
def load_resnet_model(weights_path, device='cuda'):
    """사전 훈련된 ResNet 모델 로드"""
    try:
        # 절대 경로로 변환
        abs_weights_path = os.path.abspath(weights_path)
        if not os.path.exists(abs_weights_path):
            print(f"가중치 파일을 찾을 수 없습니다: {abs_weights_path}")
            raise FileNotFoundError(f"가중치 파일을 찾을 수 없습니다: {abs_weights_path}")
            
        checkpoint = torch.load(abs_weights_path, map_location=device, weights_only=False)
        model = checkpoint['model_ft']
        model.load_state_dict(checkpoint['state_dict'], strict=False)
        
        # 평가 모드로 설정
        model.to(device)
        model.eval()
        
        return model
    except Exception as e:
        print(f"ResNet 모델 로드 중 오류 발생: {e}")
        # 오류 발생 시 응급 처치로 사전 훈련된 모델 사용
        try:
            print("사전 훈련된 ResNet50 모델을 대체로 사용합니다...")
            model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
            # 마지막 레이어 수정 (5개 클래스: Q1-Q5)
            num_ftrs = model.fc.in_features
            model.fc = nn.Linear(num_ftrs, 5)
            model.to(device)
            model.eval()
            return model
        except Exception as e2:
            print(f"대체 모델 로드 실패: {e2}")
            return None

def predict_resnet(image, model, device='cuda'):
    """ResNet 모델로 음식량 예측"""
    if model is None:
        return None, None, None
    
    # 이미지 전처리
    preprocess = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    # PIL 이미지로 변환
    if isinstance(image, np.ndarray):
        image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    
    # 텐서로 변환
    img_tensor = preprocess(image).unsqueeze(0).to(device)
    
    # 예측
    with torch.no_grad():
        outputs = model(img_tensor)
        probs = F.softmax(outputs, dim=1)
        
    # 결과 추출
    probs = probs.cpu().numpy().squeeze()
    class_idx = np.argmax(probs)
    
    # 클래스 이름과 확률
    class_names = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5']
    class_name = class_names[class_idx]
    
    # 새로운 스케일로 변환 (Q1:10%, Q2:30%, Q3:50%, Q4:70%, Q5:90%)
    resnet_percentage = {
        'Q1': 10.0,
        'Q2': 30.0,
        'Q3': 50.0,
        'Q4': 70.0,
        'Q5': 90.0
    }
    percentage = resnet_percentage[class_name]
    
    return class_name, probs[class_idx], percentage

# 새로운 가중치 조정 함수
def adjust_weights(backproj_result, resnet_result=None):
    """
    역투영 결과와 ResNet 결과에 따라 가중치 조정
    Args:
        backproj_result: 역투영 결과 (검은색 픽셀 비율 %)
        resnet_result: ResNet 결과 (클래스, 확률, 백분율) (옵션)
    Returns:
        weights: 조정된 가중치 (역투영, MiDaS, ResNet)
    """
    backproj_score = 100 - backproj_result

    # 1. 역투영 점수 0~20%면 최우선
    if 0 <= backproj_score <= 20:
        return (1.0, 0.0, 0.0)
    # 2. ResNet 확률이 80% 이상이면
    if resnet_result is not None:
        _, resnet_prob, _ = resnet_result
        if resnet_prob >= 0.8:
            return (0.3, 0.0, 0.7)
    # 3. 기본 가중치
    return (0.5, 0.3, 0.2)

# 새로운 결과 융합 함수
def combine_results_custom(backproj_result, midas_result, resnet_result, weights):
    """
    세 모델의 결과를 가중치에 따라 융합 (사용자 정의 방식)
    
    Args:
        backproj_result: 역투영 결과 (검은색 픽셀 비율 %)
        midas_result: MiDaS 결과 (볼륨 추정값)
        resnet_result: ResNet 결과 (클래스, 확률, 백분율)
        weights: 각 모델의 가중치 (역투영, MiDaS, ResNet)
    
    Returns:
        final_percentage: 최종 음식량 백분율
        confidence: 신뢰도
        details: 상세 정보
    """
    # 가중치 정규화
    w_sum = sum(weights)
    w_backproj, w_midas, w_resnet = [w/w_sum for w in weights]
    
    # ResNet 결과 추출
    resnet_class, resnet_prob, resnet_percentage = resnet_result
    
    # 역투영 결과 정규화 (0-100%)
    backproj_score = 100 - backproj_result
    
    # MiDaS 결과 정규화 (0-100으로 스케일링, 그대로 사용)
    # 과대평가 방지를 위해 스케일링 팩터 조정 (이전: 2.0 -> 현재: 1.0)
    midas_percentage = min(100, midas_result)
    
    # 가중 평균 계산
    weighted_percentage = (w_backproj * backproj_score + 
                         w_midas * midas_percentage + 
                         w_resnet * resnet_percentage)
    
    # 신뢰도 계산 (각 모델의 예측이 얼마나 일치하는지)
    score_diffs = [
        abs(backproj_score - weighted_percentage),
        abs(midas_percentage - weighted_percentage) if w_midas > 0 else 0,
        abs(resnet_percentage - weighted_percentage)
    ]
    score_diffs = [diff for diff in score_diffs if diff != 0]  # 0 가중치 모델은 제외
    avg_diff = sum(score_diffs) / len(score_diffs) if score_diffs else 0
    confidence = max(0, 100 - avg_diff) / 100  # 0-1 범위의 신뢰도
    
    # 상세 정보
    details = {
        'backproj_percentage': backproj_score,
        'midas_percentage': midas_percentage,
        'resnet_percentage': resnet_percentage,
        'weighted_percentage': weighted_percentage,
        'weights': {'backproj': w_backproj, 'midas': w_midas, 'resnet': w_resnet}
    }
    
    return weighted_percentage, confidence, details

# 결과 시각화 함수 (수정됨)
def visualize_results_custom(image, backproj_img, depth_map, depth_mask,
                             backproj_result, midas_result, resnet_result,
                             final_result, weights, output_path=None):
    """세 모델의 결과를 새로운 방식으로 시각화"""
    fig, axs = plt.subplots(2, 3, figsize=(15, 10))
    
    # 원본 이미지
    axs[0, 0].imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    axs[0, 0].set_title('원본 이미지')
    axs[0, 0].axis('off')
    
    # 역투영 결과
    axs[0, 1].imshow(cv2.cvtColor(backproj_img, cv2.COLOR_BGR2RGB))
    # 역투영 점수 계산 (0-100%)
    backproj_score = 100 - backproj_result
    axs[0, 1].set_title(f'역투영 결과 (음식량: {backproj_score:.1f}%)')
    axs[0, 1].axis('off')
    
    # 깊이 맵과 마스크
    if depth_map is not None:
        # 깊이 맵과 마스크 결합해서 시각화
        depth_vis = np.zeros((*depth_map.shape, 3), dtype=np.uint8)
        
        # 깊이맵을 컬러맵으로 변환 (plasma)
        plasma_cm = plt.cm.plasma
        plasma_norm = plt.Normalize(vmin=0, vmax=1)
        depth_colored = plasma_cm(plasma_norm(depth_map))[:, :, :3]  # alpha 채널 제거
        depth_colored = (depth_colored * 255).astype(np.uint8)
        
        # 깊이맵 위에 마스크 윤곽선 표시
        if depth_mask is not None:
            # 기본 이미지는 깊이맵
            depth_vis = depth_colored
            
            # 마스크 윤곽선 추출
            mask_uint8 = depth_mask.astype(np.uint8) * 255
            contours, _ = cv2.findContours(mask_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # 윤곽선 그리기
            cv2.drawContours(depth_vis, contours, -1, (255, 255, 255), 2)
            
            # 스케일링 팩터 제거 (MiDaS 결과 그대로 표시)
            midas_percentage = min(100, midas_result)
            axs[0, 2].imshow(depth_vis)
            axs[0, 2].set_title(f'깊이 맵 + K-means 음식 영역 (음식량: {midas_percentage:.1f}%)')
        else:
            axs[0, 2].imshow(depth_map, cmap='plasma')
            midas_percentage = min(100, midas_result)
            axs[0, 2].set_title(f'깊이 맵 (음식량: {midas_percentage:.1f}%)')
    else:
        axs[0, 2].text(0.5, 0.5, '깊이 맵 없음', ha='center', va='center')
    axs[0, 2].axis('off')
    
    # ResNet 결과
    resnet_class, resnet_prob, resnet_percentage = resnet_result
    axs[1, 0].axis('off')
    axs[1, 0].text(0.5, 0.5, 
                 f'ResNet 예측: {resnet_class}\n'
                 f'확률: {resnet_prob*100:.1f}%\n'
                 f'음식량: {resnet_percentage:.1f}%', 
                 ha='center', va='center', fontsize=12)
    
    # 가중치 시각화
    w_backproj, w_midas, w_resnet = weights
    bars = axs[1, 1].bar(['역투영', 'MiDaS', 'ResNet'], 
                       [w_backproj, w_midas, w_resnet],
                       color=['#3498db', '#2ecc71', '#e74c3c'])
    axs[1, 1].set_title('모델 가중치')
    axs[1, 1].set_ylim(0, 1)
    
    # 가중치 값을 막대 위에 표시
    for bar in bars:
        height = bar.get_height()
        axs[1, 1].text(bar.get_x() + bar.get_width()/2., height + 0.02,
                     f'{height:.1f}', ha='center', va='bottom')
    
    # 최종 결과
    final_percentage, confidence, details = final_result
    axs[1, 2].axis('off')
    result_text = f'최종 음식량: {final_percentage:.1f}%\n'
    result_text += f'신뢰도: {confidence*100:.1f}%\n\n'
    result_text += f'역투영: {details["backproj_percentage"]:.1f}%\n'
    result_text += f'MiDaS: {details["midas_percentage"]:.1f}%\n'
    result_text += f'ResNet({resnet_class}): {details["resnet_percentage"]:.1f}%'
    axs[1, 2].text(0.5, 0.5, result_text, ha='center', va='center', fontsize=12)
    
    plt.tight_layout()
    
    # 이미지 저장
    if output_path:
        plt.savefig(output_path)
        plt.close()
        return output_path
    else:
        return fig

# 메인 분석 함수
def analyze_food_image_custom(target_image_path, reference_image_path, 
                             resnet_model, midas_model, midas_transform,
                             output_dir='./results', image_name=None):
    """
    세 모델을 사용하여 음식 이미지 분석 (사용자 정의 방식)
    """
    # 결과 디렉토리 생성
    os.makedirs(output_dir, exist_ok=True)
    
    # 이미지 로드
    if isinstance(target_image_path, str):
        target_img = cv2.imread(target_image_path)
    else:
        target_img = target_image_path
        
    if isinstance(reference_image_path, str):
        reference_img = cv2.imread(reference_image_path)
    else:
        reference_img = reference_image_path
    
    if target_img is None or reference_img is None:
        return None
    
    # 1. 역투영 분석
    backproj_result, backproj_img = back_projection(target_img, reference_img)
    
    # 2. MiDaS 깊이 분석
    if midas_model is not None and midas_transform is not None:
        depth_map, midas_result, depth_mask = predict_depth(target_img, midas_model, midas_transform)
    else:
        depth_map, midas_result, depth_mask = None, 0, None
    
    # 3. ResNet 분류
    if resnet_model is not None:
        resnet_result = predict_resnet(target_img, resnet_model)
    else:
        resnet_result = ('Q3', 0.5, 50.0)  # 기본값
    
    # 4. 역투영 결과에 따라 가중치 조정
    weights = adjust_weights(backproj_result, resnet_result)
    
    # 5. 결과 융합
    final_result = combine_results_custom(backproj_result, midas_result, resnet_result, weights)
    
    # 6. 결과 시각화
    try:
        if image_name is not None:
            img_base = os.path.splitext(os.path.basename(image_name))[0]
        elif isinstance(target_image_path, str):
            img_name = os.path.basename(target_image_path)
            img_base = os.path.splitext(img_name)[0]
        else:
            img_base = "uploaded_image"
    except Exception:
        img_base = "uploaded_image"
    viz_path = os.path.join(output_dir, f"{img_base}_analysis.png")
    visualize_results_custom(
        target_img, backproj_img, depth_map, depth_mask,
        backproj_result, midas_result, resnet_result,
        final_result, weights, viz_path
    )
    
    # 결과 정리
    final_percentage, confidence, details = final_result
    result_dict = {
        'image_path': target_image_path,
        'backproj_result': backproj_result,
        'backproj_percentage': details['backproj_percentage'],
        'midas_result': midas_result,
        'midas_percentage': details['midas_percentage'],
        'resnet_result': resnet_result,
        'weights': weights,
        'final_percentage': final_percentage,
        'confidence': confidence,
        'details': details,
        'visualization_path': viz_path
    }
    
    return result_dict

# 메인 함수
def main():
    parser = argparse.ArgumentParser(description='사용자 정의 음식량 추정 시스템')
    parser.add_argument('--target', type=str, required=True, help='분석할 대상 이미지 경로')
    parser.add_argument('--reference', type=str, required=True, help='참조 이미지 경로 (깨끗한 음식)')
    parser.add_argument('--weights', type=str, default='./weights/new_opencv_ckpt_b84_e200.pth', help='ResNet 모델 가중치 경로')
    parser.add_argument('--output', type=str, default='./results', help='결과 저장 디렉토리')
    parser.add_argument('--no-midas', action='store_true', help='MiDaS 모델 사용 안함')
    
    args = parser.parse_args()
    
    # 장치 설정
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"사용 중인 장치: {device}")
    
    # 모델 로드
    print("ResNet 모델 로드 중...")
    resnet_model = load_resnet_model(args.weights, device)
    
    # MiDaS 모델 로드 (옵션)
    midas_model, midas_transform = None, None
    if not args.no_midas:
        print("MiDaS 모델 로드 중...")
        midas_model, midas_transform = load_midas_model(device)
    
    # 시작 시간
    start_time = time.time()
    print(f"\n분석 시작: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 이미지 분석
    result = analyze_food_image_custom(
        args.target, args.reference,
        resnet_model, midas_model, midas_transform,
        args.output
    )
    
    # 결과 출력
    if result:
        backproj_score = 100 - result['backproj_result']
        resnet_class, resnet_prob, resnet_percentage = result['resnet_result']
        w_backproj, w_midas, w_resnet = result['weights']
        
        print("\n=== 음식량 분석 결과 ===")
        print(f"역투영 음식량: {backproj_score:.1f}% (가중치: {w_backproj:.1f})")
        
        midas_percentage = result['midas_percentage']
        if w_midas > 0:
            print(f"MiDaS 음식량: {midas_percentage:.1f}% (가중치: {w_midas:.1f})")
        else:
            print("MiDaS 모델: 사용 안함 (가중치: 0.0)")
        
        print(f"ResNet 예측: {resnet_class} (확률: {resnet_prob*100:.1f}%, 음식량: {resnet_percentage:.1f}%, 가중치: {w_resnet:.1f})")
        print("-" * 50)
        print(f"최종 음식량: {result['final_percentage']:.1f}% (신뢰도: {result['confidence']*100:.1f}%)")
        print(f"시각화 파일: {result['visualization_path']}")
    
    # 종료 시간
    end_time = time.time()
    elapsed_time = end_time - start_time
    print("\n===============================================================")
    print(f"종료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"총 실행 시간: {elapsed_time:.2f}초")

if __name__ == '__main__':
    main() 