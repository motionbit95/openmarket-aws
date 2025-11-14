#!/bin/bash

# ========================================
# OpenMarket Kubernetes Deployment Script
# ========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-dev}
METHOD=${2:-helm}  # helm or kustomize
DRY_RUN=${3:-false}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}OpenMarket Kubernetes Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Environment: ${GREEN}${ENVIRONMENT}${NC}"
echo -e "Method: ${GREEN}${METHOD}${NC}"
echo -e "Dry Run: ${GREEN}${DRY_RUN}${NC}"
echo ""

# Validate environment
if [[ ! "${ENVIRONMENT}" =~ ^(dev|staging|prod)$ ]]; then
    echo -e "${RED}Error: Invalid environment '${ENVIRONMENT}'. Must be dev, staging, or prod.${NC}"
    exit 1
fi

# Check if kubectl is configured
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: kubectl is not configured or cluster is not accessible${NC}"
    echo -e "${YELLOW}Run: aws eks update-kubeconfig --region ap-northeast-2 --name openmarket-${ENVIRONMENT}-eks --profile openmarket${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} kubectl is configured"
echo -e "Cluster: $(kubectl config current-context)"
echo ""

# Function to deploy using Helm
deploy_helm() {
    echo -e "${BLUE}Deploying with Helm...${NC}"

    local HELM_RELEASE="openmarket-${ENVIRONMENT}"
    local NAMESPACE="openmarket-${ENVIRONMENT}"
    local VALUES_FILE="../k8s/helm/openmarket/values-${ENVIRONMENT}.yaml"

    # Create namespace if it doesn't exist
    kubectl get namespace ${NAMESPACE} &> /dev/null || kubectl create namespace ${NAMESPACE}

    if [ "${DRY_RUN}" = "true" ]; then
        echo -e "${YELLOW}Dry run mode - showing what would be deployed:${NC}"
        helm upgrade --install ${HELM_RELEASE} ../k8s/helm/openmarket \
            --namespace ${NAMESPACE} \
            --values ${VALUES_FILE} \
            --dry-run --debug
    else
        echo -e "${GREEN}Deploying to ${NAMESPACE}...${NC}"
        helm upgrade --install ${HELM_RELEASE} ../k8s/helm/openmarket \
            --namespace ${NAMESPACE} \
            --values ${VALUES_FILE} \
            --create-namespace \
            --wait \
            --timeout 10m

        echo -e "${GREEN}✓${NC} Deployment complete!"
        echo ""
        echo -e "${BLUE}Deployment status:${NC}"
        kubectl get all -n ${NAMESPACE}
    fi
}

# Function to deploy using Kustomize
deploy_kustomize() {
    echo -e "${BLUE}Deploying with Kustomize...${NC}"

    local OVERLAY_DIR="../k8s/overlays/${ENVIRONMENT}"
    local NAMESPACE="openmarket-${ENVIRONMENT}"

    # Create namespace if it doesn't exist
    kubectl get namespace ${NAMESPACE} &> /dev/null || kubectl create namespace ${NAMESPACE}

    if [ "${DRY_RUN}" = "true" ]; then
        echo -e "${YELLOW}Dry run mode - showing what would be deployed:${NC}"
        kubectl kustomize ${OVERLAY_DIR}
    else
        echo -e "${GREEN}Deploying to ${NAMESPACE}...${NC}"
        kubectl apply -k ${OVERLAY_DIR}

        echo -e "${GREEN}✓${NC} Deployment complete!"
        echo ""
        echo -e "${BLUE}Deployment status:${NC}"
        kubectl get all -n ${NAMESPACE}
    fi
}

# Deploy based on method
case "${METHOD}" in
    helm)
        deploy_helm
        ;;
    kustomize)
        deploy_kustomize
        ;;
    *)
        echo -e "${RED}Error: Invalid method '${METHOD}'. Must be 'helm' or 'kustomize'.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo -e "  View pods:        kubectl get pods -n openmarket-${ENVIRONMENT}"
echo -e "  View services:    kubectl get svc -n openmarket-${ENVIRONMENT}"
echo -e "  View ingress:     kubectl get ingress -n openmarket-${ENVIRONMENT}"
echo -e "  View logs:        kubectl logs -f deployment/backend-api -n openmarket-${ENVIRONMENT}"
echo -e "  Describe pod:     kubectl describe pod <pod-name> -n openmarket-${ENVIRONMENT}"
echo ""
