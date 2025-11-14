# ========================================
# Terraform 및 Provider 버전 설정
# ========================================

terraform {
  # Terraform 최소 버전
  required_version = ">= 1.5.0"

  # 필요한 Provider 정의
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }

    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }

    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }

    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}
