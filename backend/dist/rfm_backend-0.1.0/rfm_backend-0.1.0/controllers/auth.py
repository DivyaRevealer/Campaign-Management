from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from models.user import User
from schemas.user import UserLogin, Token
from auth.jwt import create_access_token
from database import get_db

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    print("📥 Login attempt:", user.username)

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    new_hash = pwd_context.hash("admin123")
    print(new_hash)
    db_user = db.query(User).filter(User.username == user.username).first()
    print("🔎 User from DB:", db_user)

    if not db_user:
        print("❌ No such user")
        raise HTTPException(status_code=401, detail="Invalid username or password")

    print("🔐 Stored hash:", db_user.password)
    print("🔑 Submitted password:", user.password)

    try:
        if not pwd_context.verify(user.password, db_user.password):
            print("❌ Password verification failed")
            raise HTTPException(status_code=401, detail="Invalid username or password")
    except Exception as e:
        print("❗ Exception during password verification:", e)
        raise HTTPException(status_code=500, detail="Internal error verifying password")

    print("✅ Login successful for:", db_user.username)
    token = create_access_token({"sub": db_user.username})
    return {"access_token": token, "token_type": "bearer"}
