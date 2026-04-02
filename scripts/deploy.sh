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

echo "==> Restarting pods..."
microk8s kubectl rollout restart deployment/nerv-dashboard-backend -n nerv-dashboard
microk8s kubectl rollout restart deployment/nerv-dashboard-frontend -n nerv-dashboard

echo "==> Done. Dashboard disponivel em http://192.168.1.50:30080"
