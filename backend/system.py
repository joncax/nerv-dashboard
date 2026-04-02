import os
import psutil
from fastapi import APIRouter

router = APIRouter()

def get_env_path(var: str, default: str) -> str:
    return os.environ.get(var, default)

@router.get("/")
def system_metrics():
    psutil.PROCFS_PATH = get_env_path("HOST_PROC", "/proc")

    ram = psutil.virtual_memory()
    disk = psutil.disk_usage(get_env_path("HOST_DISK", "/"))

    return {
        "ram": {
            "total_gb": round(ram.total / 1024**3, 2),
            "used_gb": round(ram.used / 1024**3, 2),
            "available_gb": round(ram.available / 1024**3, 2),
            "percent": ram.percent,
        },
        "disk": {
            "total_gb": round(disk.total / 1024**3, 2),
            "used_gb": round(disk.used / 1024**3, 2),
            "free_gb": round(disk.free / 1024**3, 2),
            "percent": disk.percent,
        },
    }
