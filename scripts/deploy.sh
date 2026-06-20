#!/bin/bash
set -e
REPO_DIR="/home/jcardoso/nerv-dashboard"
K8S_DIR="$REPO_DIR/k8s"

echo "==> Pulling latest main..."
cd "$REPO_DIR"
git pull origin main

echo "==> Building backend image..."
cd "$REPO_DIR/backend"
docker build -t nerv-dashboard-backend:latest .
docker save nerv-dashboard-backend:latest | microk8s ctr images import -
docker rmi nerv-dashboard-backend:latest

echo "==> Building frontend image..."
cd "$REPO_DIR/frontend"
docker build -t nerv-dashboard-frontend:latest .
docker save nerv-dashboard-frontend:latest | microk8s ctr images import -
docker rmi nerv-dashboard-frontend:latest

echo "==> Applying K8s manifests..."
microk8s kubectl apply -f "$K8S_DIR/namespace.yaml"
microk8s kubectl apply -f "$K8S_DIR/rbac.yaml"
microk8s kubectl apply -f "$K8S_DIR/backend-deployment.yaml"
microk8s kubectl apply -f "$K8S_DIR/frontend-deployment.yaml"

echo "==> Removing old backend pod (hostNetwork port conflict prevention)..."
OLD_POD=$(microk8s kubectl get pods -n nerv-dashboard -l app=nerv-dashboard-backend --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)
microk8s kubectl rollout restart deployment/nerv-dashboard-backend -n nerv-dashboard
microk8s kubectl rollout restart deployment/nerv-dashboard-frontend -n nerv-dashboard
if [ -n "$OLD_POD" ]; then
    echo "==> Deleting old pod $OLD_POD..."
    microk8s kubectl delete pod -n nerv-dashboard "$OLD_POD" --ignore-not-found
fi

echo "==> Waiting for rollout..."
microk8s kubectl rollout status deployment/nerv-dashboard-backend -n nerv-dashboard --timeout=120s
microk8s kubectl rollout status deployment/nerv-dashboard-frontend -n nerv-dashboard --timeout=120s

echo "==> Done. Dashboard disponivel em http://192.168.1.50:30080"
