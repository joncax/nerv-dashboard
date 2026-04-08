from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apps import router as apps_router
from k8s_pods import router as k8s_router
from system import router as system_router
from disks import router as disks_router
from folders import router as folders_router

app = FastAPI(title="nerv-dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(apps_router, prefix="/apps", tags=["apps"])
app.include_router(k8s_router, prefix="/pods", tags=["pods"])
app.include_router(system_router, prefix="/system", tags=["system"])
app.include_router(disks_router, prefix="/disks", tags=["disks"])
app.include_router(folders_router, prefix="/disks/folders", tags=["folders"])

@app.get("/health")
def health():
    return {"status": "ok"}
