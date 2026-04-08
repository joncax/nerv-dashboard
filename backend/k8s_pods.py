from fastapi import APIRouter, HTTPException
from kubernetes import client, config
from datetime import datetime, timezone

router = APIRouter()

def load_k8s_config():
    try:
        config.load_incluster_config()
    except Exception:
        config.load_kube_config()

def calc_uptime(start_time) -> str:
    if not start_time:
        return '—'
    now = datetime.now(timezone.utc)
    diff = now - start_time
    total_seconds = int(diff.total_seconds())
    days = total_seconds // 86400
    hours = (total_seconds % 86400) // 3600
    minutes = (total_seconds % 3600) // 60
    if days > 0:
        return f'{days}d {hours}h'
    elif hours > 0:
        return f'{hours}h {minutes}m'
    else:
        return f'{minutes}m'

@router.get('/')
def get_pods():
    load_k8s_config()
    v1 = client.CoreV1Api()
    pods = v1.list_pod_for_all_namespaces(watch=False)
    result = []
    for pod in pods.items:
        result.append({
            'name': pod.metadata.name,
            'namespace': pod.metadata.namespace,
            'status': pod.status.phase,
            'ready': all(cs.ready for cs in (pod.status.container_statuses or [])),
            'restarts': sum(cs.restart_count for cs in (pod.status.container_statuses or [])),
            'node': pod.spec.node_name,
            'uptime': calc_uptime(pod.status.start_time),
        })
    return result

@router.get('/metrics')
def get_pods_metrics():
    load_k8s_config()
    custom = client.CustomObjectsApi()
    try:
        metrics = custom.list_cluster_custom_object(
            group="metrics.k8s.io",
            version="v1beta1",
            plural="pods",
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Metrics API unavailable: {str(e)}")

    result = {}
    for item in metrics.get("items", []):
        namespace = item["metadata"]["namespace"]
        name = item["metadata"]["name"]
        containers = item.get("containers", [])

        total_cpu_m = 0
        total_mem_mi = 0

        for container in containers:
            cpu_str = container["usage"].get("cpu", "0")
            mem_str = container["usage"].get("memory", "0")

            if cpu_str.endswith("n"):
                total_cpu_m += int(cpu_str[:-1]) / 1_000_000
            elif cpu_str.endswith("m"):
                total_cpu_m += int(cpu_str[:-1])
            else:
                total_cpu_m += int(cpu_str) * 1000

            if mem_str.endswith("Ki"):
                total_mem_mi += int(mem_str[:-2]) / 1024
            elif mem_str.endswith("Mi"):
                total_mem_mi += int(mem_str[:-2])
            elif mem_str.endswith("Gi"):
                total_mem_mi += int(mem_str[:-2]) * 1024
            else:
                total_mem_mi += int(mem_str) / (1024 * 1024)

        key = f"{namespace}/{name}"
        result[key] = {
            "cpu_m": round(total_cpu_m),
            "mem_mi": round(total_mem_mi),
        }

    return result

@router.post('/{namespace}/{name}/restart')
def restart_pod(namespace: str, name: str):
    load_k8s_config()
    v1 = client.CoreV1Api()
    try:
        v1.delete_namespaced_pod(name=name, namespace=namespace)
        return {'status': 'restarted', 'pod': name, 'namespace': namespace}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))