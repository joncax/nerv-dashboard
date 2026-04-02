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

@router.post('/{namespace}/{name}/restart')
def restart_pod(namespace: str, name: str):
    load_k8s_config()
    v1 = client.CoreV1Api()
    try:
        v1.delete_namespaced_pod(name=name, namespace=namespace)
        return {'status': 'restarted', 'pod': name, 'namespace': namespace}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
