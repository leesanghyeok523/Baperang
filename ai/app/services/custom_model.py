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

def remove_small_objects(mask, min_size=500):
    """
    이진 마스크에서 작은 객체(connected component)를 제거
    mask: 2D bool or 0/1 np.ndarray
    min_size: 남길 최소 픽셀 수
    return: 작은 객체가 제거된 마스크
    """
    mask_uint8 = (mask.astype(np.uint8)) * 255
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask_uint8, connectivity=8)
    cleaned_mask = np.zeros_like(mask_uint8)
    for i in range(1, num_labels):  # 0은 배경
        if stats[i, cv2.CC_STAT_AREA] >= min_size:
            cleaned_mask[labels == i] = 255
    return cleaned_mask > 0

# 역투영 알고리즘 함수
def back_projection(
    target_img, reference_img,
    use_channels=(0, 1),        # HSV 채널 선택 (기본값: H+S)
    hist_bins=(180, 256),       # 히스토그램 bin 수 (기본값: 180x256)
    blur_kernel=5,              # 블러 커널 크기 (기본값: 5)
    thresh=50,                  # 임계값 (기본값: 50)
    morph_op=None,              # 모폴로지 연산 (기본값: 없음)
    morph_kernel=5,             # 모폴로지 커널 크기 (기본값: 5)
    morph_iter=1,               # 모폴로지 반복 횟수 (기본값: 1)
    min_size=500,
    use_specular_mask=False,           # 반사광 마스크 사용 여부
    specular_v_thresh=220,             # V 임계값
    specular_s_thresh=40,              # S 임계값
    use_percentile=False,           # percentile 방식 사용 여부
    food_percent=70,                 # 음식으로 인식할 상위 퍼센트(%)
    use_otsu=False,              # Otsu 방식 사용 여부
    use_triangle=False           # Triangle 방식 사용 여부
):
    """역투영 알고리즘 (파라미터 튜닝 지원, 기본값은 기존과 동일)"""
    # 1. HSV 변환
    hsv_t = cv2.cvtColor(target_img, cv2.COLOR_BGR2HSV)
    hsv_r = cv2.cvtColor(reference_img, cv2.COLOR_BGR2HSV)

    # 2. 선택 채널만 추출
    ch_idx = list(use_channels)
    hist_size = [hist_bins[0] if 0 in ch_idx else 1, hist_bins[1] if 1 in ch_idx else 1]
    ranges = [0, 180, 0, 256]
    roi_hist = cv2.calcHist([hsv_r], ch_idx, None, hist_size, ranges)
    cv2.normalize(roi_hist, roi_hist, 0, 255, cv2.NORM_MINMAX)

    # 3. 역투영
    dst = cv2.calcBackProject([hsv_t], ch_idx, roi_hist, ranges, 1)

    # 4. blur
    disc = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (blur_kernel, blur_kernel))
    cv2.filter2D(dst, -1, disc, dst)

    # 5. 임계값 적용
    if use_otsu:
        _, mask = cv2.threshold(dst, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    elif use_percentile:
        percentile = 100 - food_percent
        T = np.percentile(dst, percentile)
        _, mask = cv2.threshold(dst, T, 255, cv2.THRESH_BINARY)
    else:
        _, mask = cv2.threshold(dst, thresh, 255, 0)

    # 6. 모폴로지 연산 (선택적)
    mask = mask
    if morph_op == 'close':
        k = np.ones((morph_kernel, morph_kernel), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k, iterations=morph_iter)
    elif morph_op == 'open':
        k = np.ones((morph_kernel, morph_kernel), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, k, iterations=morph_iter)

    # 7. 음식 마스크 (0이 음식)
    mask_bool = (mask == 0)
    mask_bool = remove_small_objects(mask_bool, min_size=min_size)
    # 반사광 마스크 적용
    if use_specular_mask:
        hsv = cv2.cvtColor(target_img, cv2.COLOR_BGR2HSV)
        specular_mask = (hsv[:,:,2] > specular_v_thresh) & (hsv[:,:,1] < specular_s_thresh)
        mask_bool = mask_bool & (~specular_mask)
    mask_for_bitwise = (~mask_bool).astype(np.uint8) * 255  # 반전
    result_img = cv2.bitwise_and(target_img, target_img, mask=mask_for_bitwise)

    # 8. 잔반 비율 계산 (검은색 픽셀 비율)
    h, w = result_img.shape[:2]
    black_ratio = mask_bool.mean() * 100
    return black_ratio, result_img, mask_bool

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

def predict_depth(image, midas_model, midas_transform, device='cuda', roi_mask=None):
    """MiDaS로 깊이 맵 생성 및 깊이 가중치 적용"""
    if midas_model is None or midas_transform is None:
        return None, 0, None, 0
    
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
    volume_estimate, food_mask, weighted_ratio, food_volume_cm3 = estimate_volume_from_depth_with_weight(depth_map, roi_mask)
    
    return depth_map, weighted_ratio, food_mask, food_volume_cm3

def estimate_volume_from_depth_with_weight(depth_map, roi_mask=None):
    """깊이 맵에서 음식 부피 추정 (ΔZ 기반 부피 적분, 실제 부피 cm³ 포함, food_mask 보강, z_plane 안정화, ΔZ 컷오프 적용)"""
    if roi_mask is None or roi_mask.mean() < 0.05:
        return estimate_volume_from_depth_with_weight_old(depth_map)

    # 1. food_mask 보강 (팽창)
    food_mask = roi_mask.astype(np.uint8)
    food_mask = cv2.dilate(food_mask, np.ones((5,5), np.uint8), iterations=1) > 0

    # 2. z_plane 계산 안정화 (음식 주변 5px 제외)
    tray_mask = ~cv2.erode(food_mask.astype(np.uint8), np.ones((5,5), np.uint8), iterations=1).astype(bool)

    # 음식/트레이 영역별 복사본 생성
    depth_tray = depth_map.copy()
    depth_food = depth_map.copy()
    depth_food[~food_mask] = np.nan
    depth_tray[food_mask] = np.nan

    # 트레이 평균 깊이
    z_plane = np.nanmean(depth_tray[tray_mask]) if np.any(tray_mask) else np.nanmean(depth_tray)

    # ΔZ (음식 높이)
    dz = np.maximum(0, depth_map - z_plane)

    # 3. ΔZ(cm) 컷오프 적용
    try:
        scale_cm_per_unit = np.load('midas_scale.npy')
    except Exception:
        scale_cm_per_unit = 3.0  # fallback: 기존 H_CM
    dz_cm = dz * scale_cm_per_unit
    dz_cutoff = 0.2  # 0.2cm 이상만 음식으로 인정
    food_mask = (dz_cm > dz_cutoff)

    # 평균 높이 (dz_cm>0 영역)
    valid_h = dz_cm[food_mask]
    avg_h_cm = np.nanmean(valid_h) if valid_h.size else 0

    # 실제 부피 계산
    W_CM, L_CM, H_CM = 37.5, 29.0, 3.0
    NX, NY = 2592, 1944
    PIX_AREA = (W_CM / NX) * (L_CM / NY)
    food_pixel_count = np.sum(food_mask)
    food_area_cm2 = food_pixel_count * PIX_AREA
    food_volume_cm3 = food_area_cm2 * avg_h_cm

    # 비율(%)도 보정
    volume_pct = min(60, (food_pixel_count / (NX*NY)) * (avg_h_cm / H_CM) * 100)
    return volume_pct, food_mask, volume_pct, food_volume_cm3

def estimate_volume_from_depth_with_weight_old(depth_map):
    """기존 K-means 기반 부피 추정 방식 (fallback용)"""
    # 깊이 맵을 1차원 배열로 변환
    depth_flat = depth_map.flatten().reshape(-1, 1).astype(np.float32)
    
    # K-means 클러스터링으로 깊이 값을 2개 그룹으로 분류
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
    _, labels, centers = cv2.kmeans(depth_flat, 2, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
    
    # 두 클러스터의 중심값 확인
    center_0 = centers[0][0]
    center_1 = centers[1][0]
    
    # 클러스터 크기 계산
    cluster_0_size = np.sum(labels == 0)
    cluster_1_size = np.sum(labels == 1)
    cluster_0_ratio = cluster_0_size / len(labels)
    cluster_1_ratio = cluster_1_size / len(labels)
    
    # 음식 클러스터 선택
    MIN_CLUSTER_RATIO = 0.05
    if center_0 < center_1:
        if cluster_0_ratio > MIN_CLUSTER_RATIO:
            food_cluster = 0
        else:
            food_cluster = 1
    else:
        if cluster_1_ratio > MIN_CLUSTER_RATIO:
            food_cluster = 1
        else:
            food_cluster = 0
    
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
    
    # 부피 추정
    volume_estimate = min(100, food_ratio * 100)
    
    return volume_estimate, food_mask, volume_estimate, 0

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
                             final_result, weights, output_path=None, food_volume_cm3=None):
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
            axs[0, 2].set_title(f'깊이 맵 + ΔZ 음식 영역 (음식량: {midas_percentage:.1f}%)')
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
    if food_volume_cm3 is not None:
        result_text += f'\n실제 부피: {food_volume_cm3:.2f} cm³'
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
    backproj_result, backproj_img, food_mask = back_projection(target_img, reference_img)
    
    # 2. MiDaS 깊이 분석
    if midas_model is not None and midas_transform is not None:
        depth_map, midas_result, depth_mask, food_volume_cm3 = predict_depth(target_img, midas_model, midas_transform, roi_mask=food_mask)
    else:
        depth_map, midas_result, depth_mask, food_volume_cm3 = None, 0, None, 0
    
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
    
    # 시각화 결과 저장
    viz_path = os.path.join(output_dir, f"{img_base}_analysis.png")
    visualize_results_custom(
        target_img, backproj_img, depth_map, depth_mask,
        backproj_result, midas_result, resnet_result,
        final_result, weights, viz_path, food_volume_cm3
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
        'food_volume_cm3': food_volume_cm3,
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
        print(f"실제 부피: {result['food_volume_cm3']:.2f} cm³")
        print(f"시각화 파일: {result['visualization_path']}")
    
    # 종료 시간
    end_time = time.time()
    elapsed_time = end_time - start_time
    print("\n===============================================================")
    print(f"종료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"총 실행 시간: {elapsed_time:.2f}초")

if __name__ == '__main__':
    main() 