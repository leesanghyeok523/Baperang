# env 등 각종 자격 
import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

print(f"[CONFIG DEBUG] OPENAI_API_KEY: {OPENAI_API_KEY}")