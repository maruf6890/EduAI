import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5433"))
DB_NAME = os.getenv("DB_NAME", "edu_ai")
DB_USER = os.getenv("DB_USER", "pg")
DB_PASSWORD = os.getenv("DB_PASSWORD", "pg1234")
