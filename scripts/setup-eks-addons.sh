#!/bin/bash

# ========================================
# EKS Add-ons Installation Script
# ========================================
# This script installs essential Kubernetes add-ons for EKS:
# - AWS Load Balancer Controller
# - External Secrets Operator
# - Cluster Autoscaler
# - Metrics Server
# - EBS CSI Driver

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENVIRONMENT=${1:-dev}
AWS_REGION=${2:-ap-northeast-2}
CLUSTER_NAME="openmarket-${ENVIRONMENT}-eks"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}EKS Add-ons Installation${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Environment: ${GREEN}${ENVIRONMENT}${NC}"
echo -e "Region: ${GREEN}${AWS_REGION}${NC}"
echo -e "Cluster: ${GREEN}${CLUSTER_NAME}${NC}"
echo ""

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --profile openmarket)
echo -e "AWS Account ID: ${GREEN}${AWS_ACCOUNT_ID}${NC}"
echo ""

# Check if kubectl is configured
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: kubectl is not configured${NC}"
    exit 1
fi

# ========================================
# 1. Install AWS Load Balancer Controller
# ========================================
echo -e "${BLUE}1. Installing AWS Load Balancer Controller...${NC}"

# Add Helm repo
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Get IRSA role ARN from Terraform outputs
LB_CONTROLLER_ROLE_ARN=$(cd ../infrastructure/terraform/environments/${ENVIRONMENT} && terraform output -raw aws_load_balancer_controller_irsa_role_arn)

# Install AWS Load Balancer Controller
helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
    -n kube-system \
    --set clusterName=${CLUSTER_NAME} \
    --set serviceAccount.create=true \
    --set serviceAccount.name=aws-load-balancer-controller \
    --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=${LB_CONTROLLER_ROLE_ARN} \
    --set region=${AWS_REGION} \
    --set vpcId=$(cd ../infrastructure/terraform/environments/${ENVIRONMENT} && terraform output -raw vpc_id) \
    --wait

echo -e "${GREEN}✓${NC} AWS Load Balancer Controller installed"
echo ""

# ========================================
# 2. Install External Secrets Operator
# ========================================
echo -e "${BLUE}2. Installing External Secrets Operator...${NC}"

helm repo add external-secrets https://charts.external-secrets.io
helm repo update

# Get IRSA role ARN
EXTERNAL_SECRETS_ROLE_ARN=$(cd ../infrastructure/terraform/environments/${ENVIRONMENT} && terraform output -raw external_secrets_irsa_role_arn)

helm upgrade --install external-secrets external-secrets/external-secrets \
    -n kube-system \
    --set installCRDs=true \
    --set serviceAccount.create=true \
    --set serviceAccount.name=external-secrets-sa \
    --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=${EXTERNAL_SECRETS_ROLE_ARN} \
    --wait

echo -e "${GREEN}✓${NC} External Secrets Operator installed"
echo ""

# ========================================
# 3. Install Cluster Autoscaler
# ========================================
echo -e "${BLUE}3. Installing Cluster Autoscaler...${NC}"

helm repo add autoscaler https://kubernetes.github.io/autoscaler
helm repo update

CLUSTER_AUTOSCALER_ROLE_ARN=$(cd ../infrastructure/terraform/environments/${ENVIRONMENT} && terraform output -raw cluster_autoscaler_role_arn)

helm upgrade --install cluster-autoscaler autoscaler/cluster-autoscaler \
    -n kube-system \
    --set autoDiscovery.clusterName=${CLUSTER_NAME} \
    --set awsRegion=${AWS_REGION} \
    --set rbac.serviceAccount.create=true \
    --set rbac.serviceAccount.name=cluster-autoscaler \
    --set rbac.serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=${CLUSTER_AUTOSCALER_ROLE_ARN} \
    --wait

echo -e "${GREEN}✓${NC} Cluster Autoscaler installed"
echo ""

# ========================================
# 4. Install Metrics Server
# ========================================
echo -e "${BLUE}4. Installing Metrics Server...${NC}"

helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/
helm repo update

helm upgrade --install metrics-server metrics-server/metrics-server \
    -n kube-system \
    --wait

echo -e "${GREEN}✓${NC} Metrics Server installed"
echo ""

# ========================================
# 5. Install EBS CSI Driver
# ========================================
echo -e "${BLUE}5. Installing EBS CSI Driver...${NC}"

helm repo add aws-ebs-csi-driver https://kubernetes-sigs.github.io/aws-ebs-csi-driver
helm repo update

EBS_CSI_ROLE_ARN=$(cd ../infrastructure/terraform/environments/${ENVIRONMENT} && terraform output -raw ebs_csi_driver_role_arn)

helm upgrade --install aws-ebs-csi-driver aws-ebs-csi-driver/aws-ebs-csi-driver \
    -n kube-system \
    --set controller.serviceAccount.create=true \
    --set controller.serviceAccount.name=ebs-csi-controller-sa \
    --set controller.serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=${EBS_CSI_ROLE_ARN} \
    --wait

echo -e "${GREEN}✓${NC} EBS CSI Driver installed"
echo ""

# ========================================
# Verification
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Verifying installations...${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}AWS Load Balancer Controller:${NC}"
kubectl get deployment -n kube-system aws-load-balancer-controller

echo ""
echo -e "${YELLOW}External Secrets Operator:${NC}"
kubectl get deployment -n kube-system external-secrets

echo ""
echo -e "${YELLOW}Cluster Autoscaler:${NC}"
kubectl get deployment -n kube-system cluster-autoscaler

echo ""
echo -e "${YELLOW}Metrics Server:${NC}"
kubectl get deployment -n kube-system metrics-server

echo ""
echo -e "${YELLOW}EBS CSI Driver:${NC}"
kubectl get deployment -n kube-system ebs-csi-controller

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All add-ons installed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
