import cv2
from ultralytics import YOLO
import time
import numpy as np

class TrayDetector:
    def __init__(self, model_path='best.pt', camera_id=0):
        # YOLO 객체 검출 모델 초기화
        self.model = YOLO(model_path)
        self.conf_thresh = 0.6

        # 연속 검출 및 쿨다운 설정
        self.detection_count = 0
        self.required_detections = 5    # 안정적 감지로 판단할 연속 감지 횟수
        self.cooldown_time = 5          # 연속 촬영 방지 시간(초)

        # 식판 판별 최소 바운딩 박스 수
        self.min_boxes = 5
        self.camera_id = camera_id

        # 초점 품질 임계값 (Laplacian 분산)
        self.focus_threshold = 950.0

    def detect_tray(self, frame):
        # YOLO 객체 검출
        results = self.model.predict(
            source=frame,
            conf=self.conf_thresh,
            save=False,
            verbose=False
        )
        return results[0]


def main():
    detector = TrayDetector(model_path='best.pt', camera_id=0)
    cap = cv2.VideoCapture(detector.camera_id)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    if not cap.isOpened():
        print("카메라 열기 실패")
        return

    print("식판 감지 중... (종료: 'q')")
    last_capture = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, -1) 

        det = detector.detect_tray(frame)
        # 바운딩 박스 정보 (x1, y1, x2, y2, score, class)
        raw = det.boxes.data.cpu().numpy() if det.boxes is not None else np.empty((0, 6))
        boxes = raw[:, :4].astype(int)
        current_time = time.time()

        # ROI 설정 (전체 프레임의 10% 마진)
        h, w = frame.shape[:2]
        x1_roi, y1_roi = int(w * 0.1), int(h * 0.1)
        x2_roi, y2_roi = int(w * 0.9), int(h * 0.9)
        cv2.rectangle(frame, (x1_roi, y1_roi), (x2_roi, y2_roi), (255, 0, 0), 2)

        # ROI 내 포함되는 박스 개수 계산
        count_in_roi = 0
        for (x1, y1, x2, y2) in boxes:
            if x1 >= x1_roi and y1 >= y1_roi and x2 <= x2_roi and y2 <= y2_roi:
                count_in_roi += 1

        # 상태 표시 (ROI 내 박스 개수, 초점 품질)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        focus_metric = cv2.Laplacian(gray, cv2.CV_64F).var()
        cv2.putText(frame, f"Focus: {focus_metric:.1f}", (10, 70),
            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
    
        # 연속 감지 및 ROI 조건
        if count_in_roi >= detector.min_boxes:
            detector.detection_count += 1
        else:
            detector.detection_count = 0

        # 촬영 조건: 연속 required_detections 회 ROI 내 감지 + 초점 ok + 쿨다운 ok
        if (detector.detection_count >= detector.required_detections and
            focus_metric >= detector.focus_threshold and
            current_time - last_capture > detector.cooldown_time):

            filename = f"tray_{int(current_time)}.jpg"
            cv2.imwrite(filename, frame)
            print(f"[저장] {filename} (Focus: {focus_metric:.1f}, InROI: {count_in_roi})")
            last_capture = current_time
            detector.detection_count = 0

        cv2.imshow("Camera", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    main()
