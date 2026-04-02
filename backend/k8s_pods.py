from fastapi import APIRouter
from kubernetes import client, config

router = APIRouter()

def load_k8s_config():
    try:
        config.load_incluster_config()
    except Exception:
        config.load_kube_config()

@router.get("/")
def get_pods():
    load_k8s_config()
    v1 = client.CoreV1Api()
    pods = v1.list_pod_for_all_namespaces(watch=False)

    result = []
    for pod in pods.items:
        result.append({
            "name": pod.metadata.name,
            "namespace": pod.metadata.namespace,
            "status": pod.status.phase,
            "ready": all(
                cs.ready for cs in (pod.status.container_statuses or [])
            ),
            "restarts": sum(
                cs.restart_count for cs in (pod.status.container_statuses or [])
            ),
            "node": pod.spec.node_name,
        })

    return result
