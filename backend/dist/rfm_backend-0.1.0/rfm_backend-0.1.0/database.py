
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

# Default MySQL credentials — replace with env vars in production
DB_USER = "root"
DB_PASSWORD = "root"
DB_HOST = "localhost"
DB_NAME = "rfm"

# db_user = 'revealer'
# db_password = 'nbpnbmbbHS'
# db_host = '108.181.186.101'
# db_name = 'rfm'
# db_port='3306'

# db_user = os.getenv("DB_USER", "").strip()
# db_password = os.getenv("DB_PASSWORD", "").strip()
# db_host = os.getenv("DB_HOST", "localhost").strip()
# db_port = os.getenv("DB_PORT", "").strip() or "3306"
# db_name = os.getenv("DB_NAME", "rfm").strip()

# SQLALCHEMY_DATABASE_URL = (
#         f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
#         f"?sql_mode=NO_ENGINE_SUBSTITUTION" )

#app.config["SQLALCHEMY_DATABASE_URI"] = db_url

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
