# ========================================
# Global Outputs
# Terraform 실행 후 출력되는 정보
# ========================================

output "project_name" {
  description = "프로젝트 이름"
  value       = var.project_name
}

output "environment" {
  description = "환경"
  value       = var.environment
}

output "aws_region" {
  description = "AWS 리전"
  value       = var.aws_region
}

# VPC Outputs는 VPC 모듈에서 정의
# EKS Outputs는 EKS 모듈에서 정의
# RDS Outputs는 RDS 모듈에서 정의
