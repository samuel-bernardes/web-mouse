from fastapi import FastAPI
from app.api.mouse import router as mouse_router
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(title="Web Mouse")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mouse_router, prefix="/mouse")

@app.get("/health")
def health():
    return {"status": "ok"}
