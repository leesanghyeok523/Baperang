# app.py
from flask import Flask, render_template, Response, jsonify
import threading, time, os, logging, requests, boto3, cv2, queue
import numpy as np
from ultralytics import YOLO
from smartcard.CardMonitoring import CardMonitor,CardObserver
from smartcard.System import readers
from smartcard.util import toHexString
from smartcard.Exceptions import NoCardException
from botocore.client import Config
from flask_cors import CORS
import base64


app = Flask(__name__)
# CORS 설정 추가 - 프론트엔드의 요청을 허용
CORS(app, resources={r"/*": {"origins": "*"}})

# SERVER_URL = 'http://localhost:8000/api/v1/student/nfc/receive'
SERVER_URL = 'https://httpbin.org/post'
AWS_ACCESS_KEY_ID ="AKIAXKPVYNBMQHTUYXCT"
AWS_SECRET_ACCESS_KEY = "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"
AWS_DEFAULT_REGION = "ap-northeast-2"
BUCKET                = "e102"

client = boto3.client('s3',
                      aws_access_key_id=AWS_ACCESS_KEY_ID,
                      aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                       region_name=AWS_DEFAULT_REGION,
                    )

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)

pk_queue = queue.Queue()

def extract_ndef_text():
    r = readers()
    if not r:
        logging.error("NFC not found.")
        return None

    reader = r[0]
    try:
        conn = reader.createConnection()
        conn.connect()
    except Exception as e:
        logging.error(f"connect faild: {e}")
        return None


    ndef_data = []
    for block in range(4, 16):
        cmd = [0xFF, 0xB0, 0x00, block, 4]
        response, sw1, sw2 = conn.transmit(cmd)
        if sw1 == 0x90:
            ndef_data.extend(response)
        else:
            logging.warning(f"block {block} read faild: {sw1:02X} {sw2:02X}")
            break

    try:
        idx = ndef_data.index(0xD1)
        if ndef_data[idx + 3] != 0x54:
            logging.error("Not NDEF text code.")
            return None

        length = ndef_data[idx + 2] - 3
        lang_len = ndef_data[idx + 4]
        text_bytes = ndef_data[idx + 5 + lang_len: idx + 5 + lang_len + length]
        text_data = ''.join(chr(b) for b in text_bytes)
        logging.info(f"NFC read data: {text_data}")
        return text_data
    except Exception as e:
        logging.error(f"NDEF phasing faild: {e}")
        return None


class NFCObserver(CardObserver):
    def update(self, observable, actions):
        added, _ = actions
        for _ in added:
            try:
                text_data = extract_ndef_text()
                if text_data is not None:
                    pk_queue.put(text_data)
                    logging.info("✨ pk save")

            except NoCardException:
                logging.warning("Not card")
            except Exception as e:
                logging.error(f"NFC read error: {e}")


def start_nfc_monitor():
    monitor = CardMonitor()
    observer = NFCObserver()
    monitor.addObserver(observer)
    logging.info("start")


class TrayDetector:
    def __init__(self, camera_id=0):
        self.camera_id = camera_id
        self.focus_threshold        = 700.0
        self.region_presence_threshold = 2000.0
        self.detection_count     = 0
        self.required_detections = 5
        self.cooldown_time       = 5
        self.vert_split_ratio = (11, 15)
        self.top_col_ratios = (11, 13, 11)
        self.bot_col_ratios = (17, 15)


detector = TrayDetector()

# 최신 Flask 버전에서는 before_first_request 대신 다른 방법 사용
def boot_services():
    threading.Thread(target=start_nfc_monitor, daemon=True).start()
    logging.info("service reset")

# 서버 시작 시 초기화 코드
with app.app_context():
    boot_services()
    

def gen_frames():
    cap = cv2.VideoCapture(detector.camera_id, cv2.CAP_DSHOW)
    fourcc = cv2.VideoWriter_fourcc(*'MJPG')
    cap.set(cv2.CAP_PROP_FOURCC, fourcc)
    cap.set(cv2.CAP_PROP_AUTOFOCUS, 1)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  800)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 600)

    if not cap.isOpened():
        logging.error("camera open error")
        return

    logging.info("tray detect start(exit: 'q')")
    last_capture = 0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # 현재 시간 기록
            now = time.time()
            
            # 프레임 기본 처리
            h, w = frame.shape[:2]
            gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            focus = cv2.Laplacian(gray, cv2.CV_64F).var()

            r_top, r_bot = detector.vert_split_ratio
            split_y = int(h * r_top / (r_top + r_bot))

            regions = {}

            sum_top = sum(detector.top_col_ratios)
            acc = 0
            for name, ratio in zip(("side_1","side_2","side_3"),
                                   detector.top_col_ratios):
                x1 = int(w * acc / sum_top)
                acc += ratio
                x2 = int(w * acc / sum_top)
                regions[name] = (x1, 0, x2, split_y)

            sum_bot = sum(detector.bot_col_ratios)
            acc = 0
            for name, ratio in zip(("rice","soup"),
                                   detector.bot_col_ratios):
                x1 = int(w * acc / sum_bot)
                acc += ratio
                x2 = int(w * acc / sum_bot)
                regions[name] = (x1, split_y, x2, h)

            region_ok = True
            for name,(x1,y1,x2,y2) in regions.items():
                roi = gray[y1:y2, x1:x2]
                var = roi.var()
                cv2.rectangle(frame,(x1,y1),(x2,y2),(0,255,0),2)
                if var < detector.region_presence_threshold:
                    region_ok = False

            cv2.putText(frame,f"Focus:{focus:.0f}",
                        (10,30), cv2.FONT_HERSHEY_SIMPLEX,
                        0.8,(0,255,255),2)
            
            # 태깅 후에만 식판 검출 수행
            if (focus >= detector.focus_threshold and
                region_ok and
                now - last_capture > detector.cooldown_time and
                not pk_queue.empty()):

                text = pk_queue.get()
                student_pk, grade, class_num, number, name, gender, status = text.split()

                # 서버에 정보 전송
                payload = {
                    'pk':     int(student_pk),
                    'grade':  int(grade),
                    'class':  int(class_num),
                    'num':    int(number),
                    'name':   name,
                    'gender': gender,
                    'status': status,
                    's3_url': {}
                }
                    
                for rname,(x1,y1,x2,y2) in regions.items():
                    crop = frame[y1:y2, x1:x2]
                    fname = f"{name}_{status}_{rname}.jpg"
                    cv2.imwrite(fname, crop)

                    client.upload_file(
                        Filename=fname, Bucket=BUCKET, Key=fname,
                        ExtraArgs={'ACL':'public-read',
                                   'ContentType':'image/jpeg'}
                    )
                    os.remove(fname)
                    payload['s3_url'][rname] = (
                      f'https://{BUCKET}.s3.{AWS_DEFAULT_REGION}.amazonaws.com/{fname}'
                    )
                    logging.info(f"Uploaded {rname}")

                try:
                    resp = requests.post(SERVER_URL, json=payload, timeout=5)
                    logging.info(f"POST {resp.status_code}")
                except Exception as e:
                    logging.error(f"POST error: {e}")

                last_capture = now
                detector.detection_count = 0
                
                # 텍스트 표시
                cv2.putText(frame, "식판을 인식해주세요", (int(w*0.3), 30), 
                          cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)
            else:
                # 태깅 전 상태 - 안내 메시지만 표시
                cv2.putText(frame, "학생증을 인식시켜주세요", (int(w*0.3), 30), 
                          cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)

            # 디버깅 화면 표시
            cv2.imshow("Camera", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
            
            # 웹으로 프레임 전송
            ret2, buf = cv2.imencode('.jpg', frame)
            if not ret2:
                continue
            frame_bytes = buf.tobytes()
            yield (
                b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' +
                frame_bytes + b'\r\n'
            )
    
    except Exception as e:
        logging.error(f"detect loop error: {e}")
    finally:
        cap.release()
        cv2.destroyAllWindows()
    
    



@app.route('/')
def index():
    return render_template('index.html')


@app.route('/video_feed')
def video_feed():
    return Response(
        gen_frames(),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )

# 카메라 프레임을 base64로 변환하여 반환하는 엔드포인트
@app.route('/camera-stream')
def camera_stream():
    try:
        # 카메라 캡처
        cap = cv2.VideoCapture(detector.camera_id)
        if not cap.isOpened():
            return jsonify({"error": "카메라를 열 수 없습니다"}), 500
            
        ret, frame = cap.read()
        cap.release()
        
        if not ret:
            return jsonify({"error": "카메라에서 이미지를 캡처할 수 없습니다"}), 500
        
        # 기본 크기 설정
        h, w = frame.shape[:2]
        
        # NFC 태깅 정보가 있는지 확인 (큐가 비어있지 않으면 태깅된 상태)
        tagged = not pk_queue.empty()
        
        if tagged:
            # 태깅 후 식판 검출 실행
            det = detector.detect_tray(frame)
            raw = det.boxes.data.cpu().numpy() if det.boxes is not None else np.empty((0, 6))
            boxes = raw[:, :4].astype(int)
            
            # ROI 영역 표시
            x1, y1 = int(w*0.1), int(h*0.1)
            x2, y2 = int(w*0.9), int(h*0.9)
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255,0,0), 2)
            
            # 검출된 객체에 사각형 그리기
            for (x1b, y1b, x2b, y2b) in boxes:
                cv2.rectangle(frame, (x1b, y1b), (x2b, y2b), (0,255,0), 2)
                
            # 텍스트 표시
            cv2.putText(frame, "식판을 인식해주세요", (int(w*0.3), 30), 
                      cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)
        else:
            # 태깅 전 - 안내 텍스트만 표시
            cv2.putText(frame, "학생증을 인식시켜주세요", (int(w*0.3), 30), 
                      cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)
        
        # 이미지를 base64로 인코딩
        _, buffer = cv2.imencode('.jpg', frame)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return jsonify({
            "streamUrl": f"data:image/jpeg;base64,{img_base64}",
            "timestamp": time.time(),
            "tagged": tagged
        })
    except Exception as e:
        logging.error(f"카메라 스트림 에러: {e}")
        return jsonify({"error": str(e)}), 500

# NFC 태깅 정보를 반환하는 엔드포인트
@app.route('/nfc-info')
def nfc_info():
    try:
        if not pk_queue.empty():
            # 큐에서 데이터를 꺼내지 않고 확인만 함 (peek)
            with pk_queue.mutex:
                if pk_queue.queue:
                    text_data = pk_queue.queue[0]  # 첫 번째 항목만 확인
                    student_pk, grade, class_num, number, student_name, gender, status = text_data.split()
                    
                    return jsonify({
                        "pk": student_pk,
                        "grade": grade,
                        "class": class_num,
                        "number": number,
                        "name": student_name,
                        "gender": gender,
                        "status": status,
                        "isTagged": True
                    })
        
        # 태깅된 정보가 없는 경우
        return jsonify({
            "isTagged": False
        })
    except Exception as e:
        logging.error(f"NFC 정보 제공 에러: {e}")
        return jsonify({"error": str(e), "isTagged": False}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
