import os
from dotenv import load_dotenv

# Load the .env file
load_dotenv()

# Read values with strip() to clean hidden characters
db_user = os.getenv("DB_USER", "").strip()
db_password = os.getenv("DB_PASSWORD", "").strip()
db_host = os.getenv("DB_HOST", "").strip()
db_port = os.getenv("DB_PORT", "").strip()
db_name = os.getenv("DB_NAME", "").strip()

print("✅ Environment values loaded:")
print("DB_USER     =", repr(db_user))
print("DB_PASSWORD =", repr(db_password))
print("DB_HOST     =", repr(db_host))
print("DB_PORT     =", repr(db_port))
print("DB_NAME     =", repr(db_name))
