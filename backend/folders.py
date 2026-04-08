import os
import subprocess
from fastapi import APIRouter, HTTPException

router = APIRouter()

DISK_MOUNTS = {
    "system": os.environ.get("HOST_DISK", "/"),
    "mybook": os.environ.get("HOST_DISK_MYBOOK", "/mnt/MyBook500GB"),
    "passport": os.environ.get("HOST_DISK_PASSPORT", "/mnt/Passport2TB"),
}

def parse_du_output(output: str, mount: str) -> list:
    lines = output.strip().split("\n")
    entries = []
    for line in lines:
        parts = line.split("\t", 1)
        if len(parts) != 2:
            continue
        size_str, path = parts
        if path.rstrip("/") == mount.rstrip("/"):
            continue
        size_bytes = parse_size(size_str)
        entries.append({
            "path": path,
            "size_human": size_str,
            "size_bytes": size_bytes,
        })
    entries.sort(key=lambda x: x["size_bytes"], reverse=True)
    return entries

def parse_size(size_str: str) -> int:
    size_str = size_str.strip()
    units = {"K": 1024, "M": 1024**2, "G": 1024**3, "T": 1024**4}
    if size_str[-1] in units:
        try:
            return int(float(size_str[:-1]) * units[size_str[-1]])
        except ValueError:
            return 0
    try:
        return int(size_str)
    except ValueError:
        return 0

@router.get("/{disk}")
def get_folders(disk: str):
    mount = DISK_MOUNTS.get(disk.lower())
    if not mount:
        raise HTTPException(status_code=404, detail=f"Unknown disk: {disk}. Valid options: {list(DISK_MOUNTS.keys())}")

    if not os.path.isdir(mount):
        raise HTTPException(status_code=503, detail=f"Mount point not available: {mount}")

    try:
        result = subprocess.run(
            ["du", "-h", "--max-depth=1", "--one-file-system", mount],
            capture_output=True,
            text=True,
            timeout=30,
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="du command timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if result.returncode != 0 and not result.stdout:
        raise HTTPException(status_code=500, detail=result.stderr)

    folders = parse_du_output(result.stdout, mount)
    return {
        "disk": disk,
        "mount": mount,
        "folders": folders,
    }