from fastapi import APIRouter
import httpx

router = APIRouter()

APPS = [
    {
        "name": "Jellyfin",
        "icon": "jellyfin",
        "internal_port": 8096,
        "node_port": 30096,
        "ip": "192.168.1.50",
        "hostname": "nerv-server-k8s-01.local",
        "category": "media",
    },
    {
        "name": "Sonarr",
        "icon": "sonarr",
        "internal_port": 8989,
        "node_port": 30989,
        "ip": "192.168.1.50",
        "hostname": "nerv-server-k8s-01.local",
        "category": "media",
    },
    {
        "name": "Radarr",
        "icon": "radarr",
        "internal_port": 7878,
        "node_port": 30878,
        "ip": "192.168.1.50",
        "hostname": "nerv-server-k8s-01.local",
        "category": "media",
    },
    {
        "name": "Bazarr",
        "icon": "bazarr",
        "internal_port": 6767,
        "node_port": 30767,
        "ip": "192.168.1.50",
        "hostname": "nerv-server-k8s-01.local",
        "category": "media",
    },
    {
        "name": "Prowlarr",
        "icon": "prowlarr",
        "internal_port": 9696,
        "node_port": 30696,
        "ip": "192.168.1.50",
        "hostname": "nerv-server-k8s-01.local",
        "category": "media",
    },
    {
        "name": "Transmission",
        "icon": "transmission",
        "internal_port": 9091,
        "node_port": 30091,
        "ip": "192.168.1.50",
        "hostname": "nerv-server-k8s-01.local",
        "category": "download",
    },
    {
	"name": "Filebrowser",
	"icon": "filebrowser",
	"internal_port": 8080,
	"node_port": 30082,
	"ip": "192.168.1.50",
	"hostname": "nerv-server-k8s-01.local",
	"category": "tools",
    },
]

async def check_health(ip: str, port: int) -> bool:
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"http://{ip}:{port}")
            return r.status_code < 500
    except Exception:
        return False

@router.get("/")
async def get_apps():
    results = []
    for app in APPS:
        healthy = await check_health(app["ip"], app["node_port"])
        results.append({
            **app,
            "url_ip": f"http://{app['ip']}:{app['node_port']}",
            "url_hostname": f"http://{app['hostname']}:{app['node_port']}",
            "healthy": healthy,
        })
    return results
