#!/bin/bash

# OpenMarket Monitoring Setup Script
# Prometheus + Grafana + Alertmanager

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MONITORING_DIR="$PROJECT_ROOT/k8s/monitoring"

echo "========================================="
echo "OpenMarket Monitoring Setup"
echo "Environment: $ENVIRONMENT"
echo "========================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

function info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

function warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

function error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
info "Checking prerequisites..."
if ! command -v kubectl &> /dev/null; then
    error "kubectl is not installed"
    exit 1
fi

# Create monitoring namespace
info "Creating monitoring namespace..."
kubectl apply -f "$MONITORING_DIR/namespace.yaml"

# Wait for namespace
sleep 2

# Deploy Prometheus
info "Deploying Prometheus..."
kubectl apply -f "$MONITORING_DIR/prometheus/configmap.yaml"
kubectl apply -f "$MONITORING_DIR/prometheus/deployment.yaml"

# Deploy Grafana
info "Deploying Grafana..."
kubectl apply -f "$MONITORING_DIR/grafana/configmap-datasources.yaml"
kubectl apply -f "$MONITORING_DIR/grafana/configmap-dashboards-provider.yaml"
kubectl apply -f "$MONITORING_DIR/grafana/configmap-dashboards.yaml"
kubectl apply -f "$MONITORING_DIR/grafana/deployment.yaml"

# Deploy Node Exporter
info "Deploying Node Exporter..."
kubectl apply -f "$MONITORING_DIR/node-exporter/daemonset.yaml"

# Deploy Kube State Metrics
info "Deploying Kube State Metrics..."
kubectl apply -f "$MONITORING_DIR/kube-state-metrics/deployment.yaml"

# Deploy Alertmanager
info "Deploying Alertmanager..."
kubectl apply -f "$MONITORING_DIR/alertmanager/configmap.yaml"
kubectl apply -f "$MONITORING_DIR/alertmanager/deployment.yaml"

# Wait for deployments
info "Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s \
    deployment/prometheus -n monitoring

kubectl wait --for=condition=available --timeout=300s \
    deployment/grafana -n monitoring

kubectl wait --for=condition=available --timeout=300s \
    deployment/kube-state-metrics -n monitoring

kubectl wait --for=condition=available --timeout=300s \
    deployment/alertmanager -n monitoring

# Check pod status
info "Checking pod status..."
kubectl get pods -n monitoring

# Get service info
info "Getting service information..."
kubectl get svc -n monitoring

echo ""
info "========================================="
info "Monitoring Stack Deployed Successfully!"
info "========================================="
echo ""

# Display access information
PROMETHEUS_POD=$(kubectl get pods -n monitoring -l app=prometheus -o jsonpath='{.items[0].metadata.name}')
GRAFANA_POD=$(kubectl get pods -n monitoring -l app=grafana -o jsonpath='{.items[0].metadata.name}')
ALERTMANAGER_POD=$(kubectl get pods -n monitoring -l app=alertmanager -o jsonpath='{.items[0].metadata.name}')

echo ""
info "Access URLs (using port-forward):"
echo ""
echo "Prometheus:"
echo "  kubectl port-forward -n monitoring $PROMETHEUS_POD 9090:9090"
echo "  Then visit: http://localhost:9090"
echo ""
echo "Grafana:"
echo "  kubectl port-forward -n monitoring $GRAFANA_POD 3000:3000"
echo "  Then visit: http://localhost:3000"
echo "  Default credentials: admin / openmarket2024!"
echo ""
echo "Alertmanager:"
echo "  kubectl port-forward -n monitoring $ALERTMANAGER_POD 9093:9093"
echo "  Then visit: http://localhost:9093"
echo ""

# Slack webhook configuration
warn "========================================="
warn "IMPORTANT: Configure Slack Webhook"
warn "========================================="
echo ""
echo "To enable Slack notifications, update the secret:"
echo ""
echo "kubectl create secret generic alertmanager-secrets \\"
echo "  --from-literal=slack-webhook-url='https://hooks.slack.com/services/YOUR/WEBHOOK/URL' \\"
echo "  -n monitoring \\"
echo "  --dry-run=client -o yaml | kubectl apply -f -"
echo ""
echo "Then restart Alertmanager:"
echo "kubectl rollout restart deployment/alertmanager -n monitoring"
echo ""

info "Monitoring setup complete!"
