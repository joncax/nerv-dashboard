import os
import psutil
from fastapi import APIRouter

router = APIRouter()

DISKS = [
    {
        "name": "System",
        "mount_env": "HOST_DISK",
        "mount_default": "/",
        "inodes": True,
    },
    {
        "name": "MyBook500GB",
        "mount_env": "HOST_DISK_MYBOOK",
        "mount_default": "/mnt/MyBook500GB",
        "inodes": False,
    },
    {
        "name": "Passport2TB",
        "mount_env": "HOST_DISK_PASSPORT",
        "mount_default": "/mnt/Passport2TB",
        "inodes": False,
    },
]

def get_status(percent: float) -> str:
    if percent >= 90:
        return "critical"
    if percent >= 75:
        return "warning"
    return "healthy"

@router.get("/")
def get_disks():
    result = []
    for disk in DISKS:
        mount = os.environ.get(disk["mount_env"], disk["mount_default"])
        try:
            usage = psutil.disk_usage(mount)
            entry = {
                "name": disk["name"],
                "mount": mount,
                "total_gb": round(usage.total / 1024**3, 2),
                "used_gb": round(usage.used / 1024**3, 2),
                "free_gb": round(usage.free / 1024**3, 2),
                "percent": usage.percent,
                "status": get_status(usage.percent),
                "inodes": None,
            }
            if disk["inodes"]:
                st = os.statvfs(mount)
                total_inodes = st.f_files
                free_inodes = st.f_ffree
                used_inodes = total_inodes - free_inodes
                inode_percent = round((used_inodes / total_inodes) * 100, 1) if total_inodes > 0 else 0
                entry["inodes"] = {
                    "total": total_inodes,
                    "used": used_inodes,
                    "free": free_inodes,
                    "percent": inode_percent,
                }
            result.append(entry)
        except Exception as e:
            result.append({
                "name": disk["name"],
                "mount": mount,
                "error": str(e),
            })
    return result