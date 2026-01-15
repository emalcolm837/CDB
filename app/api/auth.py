import psycopg
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import get_db
from app.api.auth_deps import require_admin, get_current_user
from app.db.security import create_access_token
from app.services.user_service import authenticate_user, create_user

from pydantic import BaseModel, Field

class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=200)
    role: str = "viewer"

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/token")
def login(form: OAuth2PasswordRequestForm = Depends(), conn=Depends(get_db)):
    user = authenticate_user(conn, form.username, form.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    token = create_access_token({"sub": user["username"], "role": user["role"]})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/users")
def admin_create_user(
    payload: UserCreate,
    conn=Depends(get_db),
    _admin=Depends(require_admin),
):
    try:
        user_id = create_user(conn, payload.username, payload.password, payload.role)
        return {"user_id": user_id}
    except psycopg.errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="Username already exists")
    
@router.get("/me")
def me(user=Depends(get_current_user)):
    return {"username": user["username"], "role": user["role"]}
