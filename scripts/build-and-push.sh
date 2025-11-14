#!/bin/bash

# ========================================
# Build and Push Docker Images to ECR
# ========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENVIRONMENT=${1:-dev}
SERVICE=${2:-all}  # backend, frontend, or all
TAG=${3:-latest}

AWS_REGION="ap-northeast-2"
AWS_PROFILE="openmarket"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Build and Push Docker Images${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Environment: ${GREEN}${ENVIRONMENT}${NC}"
echo -e "Service: ${GREEN}${SERVICE}${NC}"
echo -e "Tag: ${GREEN}${TAG}${NC}"
echo ""

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --profile ${AWS_PROFILE})
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo -e "ECR Registry: ${GREEN}${ECR_REGISTRY}${NC}"
echo ""

# Login to ECR
echo -e "${BLUE}Logging in to ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} --profile ${AWS_PROFILE} | \
    docker login --username AWS --password-stdin ${ECR_REGISTRY}
echo -e "${GREEN}✓${NC} Logged in to ECR"
echo ""

# Function to create ECR repository if it doesn't exist
create_ecr_repo() {
    local REPO_NAME=$1

    if ! aws ecr describe-repositories --repository-names ${REPO_NAME} --region ${AWS_REGION} --profile ${AWS_PROFILE} &> /dev/null; then
        echo -e "${YELLOW}Creating ECR repository: ${REPO_NAME}${NC}"
        aws ecr create-repository \
            --repository-name ${REPO_NAME} \
            --region ${AWS_REGION} \
            --profile ${AWS_PROFILE} \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=AES256
        echo -e "${GREEN}✓${NC} Repository created"
    fi
}

# Function to build and push backend
build_backend() {
    echo -e "${BLUE}Building backend image...${NC}"

    local REPO_NAME="openmarket/backend"
    local IMAGE_TAG="${ECR_REGISTRY}/${REPO_NAME}:${TAG}"

    create_ecr_repo ${REPO_NAME}

    cd ../backend
    docker build -t ${IMAGE_TAG} .
    docker push ${IMAGE_TAG}

    # Also tag as environment-latest
    docker tag ${IMAGE_TAG} ${ECR_REGISTRY}/${REPO_NAME}:${ENVIRONMENT}-latest
    docker push ${ECR_REGISTRY}/${REPO_NAME}:${ENVIRONMENT}-latest

    echo -e "${GREEN}✓${NC} Backend image built and pushed"
    echo -e "  Image: ${GREEN}${IMAGE_TAG}${NC}"
    cd ../scripts
}

# Function to build and push frontend
build_frontend() {
    echo -e "${BLUE}Building frontend image...${NC}"

    local REPO_NAME="openmarket/frontend-web"
    local IMAGE_TAG="${ECR_REGISTRY}/${REPO_NAME}:${TAG}"

    create_ecr_repo ${REPO_NAME}

    cd ../frontend-web
    docker build -t ${IMAGE_TAG} .
    docker push ${IMAGE_TAG}

    # Also tag as environment-latest
    docker tag ${IMAGE_TAG} ${ECR_REGISTRY}/${REPO_NAME}:${ENVIRONMENT}-latest
    docker push ${ECR_REGISTRY}/${REPO_NAME}:${ENVIRONMENT}-latest

    echo -e "${GREEN}✓${NC} Frontend image built and pushed"
    echo -e "  Image: ${GREEN}${IMAGE_TAG}${NC}"
    cd ../scripts
}

# Build based on service
case "${SERVICE}" in
    backend)
        build_backend
        ;;
    frontend)
        build_frontend
        ;;
    all)
        build_backend
        echo ""
        build_frontend
        ;;
    *)
        echo -e "${RED}Error: Invalid service '${SERVICE}'. Must be 'backend', 'frontend', or 'all'.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Build and Push Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Images pushed:${NC}"
echo -e "  Backend:  ${ECR_REGISTRY}/openmarket/backend:${TAG}"
echo -e "  Frontend: ${ECR_REGISTRY}/openmarket/frontend-web:${TAG}"
echo ""
