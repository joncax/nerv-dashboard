import json
import os
from fastapi import APIRouter, HTTPException, Body
from kubernetes import client, config
import httpx

router = APIRouter()

CONFIG_PATH = os.environ.get("APPS_CONFIG_PATH", "/config/apps_config.json")

EXCLUDED_NAMESPACES = {
    "kube-system", "kube-public", "kube-node-lease",
    "ingress", "calico-system", "infisical-operator-system",
    "default"
}

def load_k8s():
    try:
        config.load_incluster_config()
    except Exception:
        config.load_kube_config()

def get_all_namespaced_apps() -> list:
    load_k8s()
    v1 = client.CoreV1Api()
    all_services = v1.list_service_for_all_namespaces()

    namespace_map = {}
    for svc in all_services.items:
        ns = svc.metadata.namespace
        if ns in EXCLUDED_NAMESPACES:
            continue
        if ns.endswith("-dev"):
            continue
        if svc.spec.type != "NodePort":
            continue
        ports = svc.spec.ports or []
        node_ports = [p.node_port for p in ports if p.node_port]
        if not node_ports:
            continue
        name = svc.metadata.name
        if ns not in namespace_map:
            namespace_map[ns] = []
        namespace_map[ns].append({"name": name, "node_ports": node_ports})

    dev_namespaces = {}
    for svc in all_services.items:
        ns = svc.metadata.namespace
        if not ns.endswith("-dev"):
            continue
        base_ns = ns[:-4]
        if svc.spec.type != "NodePort":
            continue
        ports = svc.spec.ports or []
        node_ports = [p.node_port for p in ports if p.node_port]
        if not node_ports:
            continue
        name = svc.metadata.name
        if base_ns not in dev_namespaces:
            dev_namespaces[base_ns] = []
        dev_namespaces[base_ns].append({"name": name, "node_ports": node_ports})

    apps = []
    for ns, services in namespace_map.items():
        frontend = next(
            (s for s in services if "frontend" in s["name"]), None
        )
        primary = frontend or min(services, key=lambda s: min(s["node_ports"]))
        prod_port = min(primary["node_ports"])

        dev_port = None
        if ns in dev_namespaces:
            dev_services = dev_namespaces[ns]
            dev_frontend = next(
                (s for s in dev_services if "frontend" in s["name"]), None
            )
            dev_primary = dev_frontend or min(dev_services, key=lambda s: min(s["node_ports"]))
            dev_port = min(dev_primary["node_ports"])

        apps.append({
            "namespace": ns,
            "prod_port": prod_port,
            "dev_port": dev_port,
            "has_dev": dev_port is not None,
            "ip": "192.168.1.50",
        })

    return apps

def load_config() -> list:
    try:
        with open(CONFIG_PATH, "r") as f:
            return json.load(f)
    except Exception:
        return []

def save_config(data: list) -> None:
    with open(CONFIG_PATH, "w") as f:
        json.dump(data, f, indent=2)

def merge_with_config(k8s_apps: list, config_data: list) -> list:
    config_map = {c["namespace"]: c for c in config_data}
    result = []
    for i, app in enumerate(k8s_apps):
        ns = app["namespace"]
        saved = config_map.get(ns, {})
        result.append({
            **app,
            "visible": saved.get("visible", True),
            "order": saved.get("order", i),
            "color_bg": saved.get("color_bg", "#1a1a2e"),
            "color_fg": saved.get("color_fg", "#888899"),
        })
    return sorted(result, key=lambda x: x["order"])

def get_pod_last_update(namespace: str) -> str:
    try:
        load_k8s()
        v1 = client.CoreV1Api()
        pods = v1.list_namespaced_pod(namespace=namespace)
        if not pods.items:
            return "—"
        pod = pods.items[0]
        start_time = pod.status.start_time
        if not start_time:
            return "—"
        return start_time.astimezone().strftime("%-d %b %H:%M")
    except Exception:
        return "—"

async def check_health(ip: str, port: int) -> bool:
    try:
        async with httpx.AsyncClient(timeout=3.0) as c:
            r = await c.get(f"http://{ip}:{port}")
            return r.status_code < 500
    except Exception:
        return False

@router.get("/config")
def get_config():
    k8s_apps = get_all_namespaced_apps()
    config_data = load_config()
    return merge_with_config(k8s_apps, config_data)

@router.put("/config")
def put_config(data: list = Body(...)):
    try:
        save_config(data)
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_apps():
    try:
        k8s_apps = get_all_namespaced_apps()
    except Exception:
        k8s_apps = []
    config_data = load_config()
    merged = merge_with_config(k8s_apps, config_data)
    visible = [a for a in merged if a.get("visible", True)]
    results = []
    for app in visible:
        ns = app["namespace"]
        healthy = await check_health(app["ip"], app["prod_port"])
        last_update = get_pod_last_update(ns)
        results.append({
            **app,
            "name": ns,
            "url_ip": f"http://{app['ip']}:{app['prod_port']}",
            "url_hostname": f"http://{app['ip']}:{app['prod_port']}",
            "healthy": healthy,
            "last_update": last_update,
        })
    return results
