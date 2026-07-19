import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "college_app")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-prod")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))

USE_HTTPS = os.getenv("USE_HTTPS", "false").lower() == "true"
SSL_CERT_PATH = os.getenv("SSL_CERT_PATH", "./certs/cert.pem")
SSL_KEY_PATH = os.getenv("SSL_KEY_PATH", "./certs/key.pem")

BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
VERIFICATION_TOKEN_EXPIRE_MINUTES = int(os.getenv("VERIFICATION_TOKEN_EXPIRE_MINUTES", "1440"))
APP_URL = os.getenv("APP_URL", "http://localhost:3000")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@collegeapp.com")
FROM_NAME = os.getenv("FROM_NAME", "College App")

BACKEND_URL = os.getenv("BACKEND_URL", "")
BACKEND_WS_HOST = ""
if BACKEND_URL:
    BACKEND_WS_HOST = BACKEND_URL.replace("https://", "").replace("http://", "").rstrip("/")

STREAMS = {
    "science": {
        "label": "Science Stream",
        "combinations": {
            "PCMB": ["Physics", "Chemistry", "Mathematics", "Biology"],
            "PCMC": ["Physics", "Chemistry", "Mathematics", "Computer Science"],
            "PCME": ["Physics", "Chemistry", "Mathematics", "Electronics"]
        }
    },
    "commerce": {
        "label": "Commerce Stream",
        "combinations": {
            "CEBA": ["Computer Science", "Economics", "Business Studies", "Accountancy"],
            "SEBA": ["Statistics", "Economics", "Business Studies", "Accountancy"]
        }
    },
    "arts": {
        "label": "Arts (Humanities) Stream",
        "combinations": {
            "DEFAULT": ["History", "Political Science", "Economics", "Sociology",
                        "Geography", "Kannada", "English"]
        }
    },
}

LANGUAGES = [
    "Information Technology (NSQF)",
    "Automobile (NSQF)",
    "English",
    "Kannada",
    "Hindi",
    "Urdu",
    "Sanskrit (where available)"
]
