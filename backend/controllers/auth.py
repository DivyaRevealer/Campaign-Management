from fastapi import APIRouter, Depends, HTTPException,status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt 
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
    #password-- $RFMtcm%03

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


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")  # matches your login endpoint

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    SECRET_KEY = "rfmapplication7890"  # Replace with environment variable in production
    ALGORITHM = "HS256"
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Fetch user from DB
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception

    return user   # Now you return the full user object