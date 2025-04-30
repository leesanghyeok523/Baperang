import httpx

try:
    response = httpx.get("https://api.openai.com/v1/models", timeout=5)
    print("연결 성공:", response.status_code)
except httpx.RequestError as e:
    print("연결 실패:", e)

# import requests

# try:
#     response = requests.get("https://api.openai.com/v1/models", timeout=5)
#     print("연결 성공:", response.status_code)
# except requests.RequestException as e:
#     print("연결 실패:", e)