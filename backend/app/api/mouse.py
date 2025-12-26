from fastapi import APIRouter
from pydantic import BaseModel
from app.services.mouse_service import move_mouse, click_mouse 

router = APIRouter()

class MoveRequest(BaseModel):
    dx: int
    dy: int

class ClickRequest(BaseModel):
    button: str = 'left'

@router.post("/move")
def move(req: MoveRequest):
    move_mouse(req.dx, req.dy)
    return {"ok": True}

@router.post("/click")
def click(req: ClickRequest):
    click_mouse(req.button)
    return {"ok": True}