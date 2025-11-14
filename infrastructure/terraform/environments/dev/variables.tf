# ========================================
# Development Environment Variables
# 전역 변수를 이 환경에서 사용
# ========================================

# 전역 variables.tf의 모든 변수를 여기서도 선언해야 함
# (../../variables.tf와 동일한 변수 선언)

variable "project_name" {
  description = "프로젝트 이름"
  type        = string
}

variable "environment" {
  description = "환경 (dev, staging, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS 리전"
  type        = string
}

variable "availability_zones" {
  description = "사용할 가용 영역 목록"
  type        = list(string)
  default     = ["ap-northeast-2a", "ap-northeast-2b", "ap-northeast-2c"]
}

variable "tags" {
  description = "모든 리소스에 적용할 공통 태그"
  type        = map(string)
  default     = {}
}

variable "vpc_cidr" {
  description = "VPC CIDR 블록"
  type        = string
}

variable "enable_nat_gateway" {
  description = "NAT Gateway 활성화 여부"
  type        = bool
}

variable "single_nat_gateway" {
  description = "단일 NAT Gateway 사용 여부"
  type        = bool
}

variable "eks_cluster_version" {
  description = "EKS 클러스터 버전"
  type        = string
}

variable "eks_node_groups" {
  description = "EKS 노드 그룹 설정"
  type = map(object({
    instance_types = list(string)
    min_size       = number
    max_size       = number
    desired_size   = number
  }))
}

variable "rds_instance_class" {
  description = "RDS 인스턴스 클래스"
  type        = string
}

variable "rds_engine_version" {
  description = "MySQL 엔진 버전"
  type        = string
}

variable "rds_database_name" {
  description = "데이터베이스 이름"
  type        = string
}

variable "rds_master_username" {
  description = "마스터 사용자 이름"
  type        = string
  sensitive   = true
}

variable "rds_backup_retention_period" {
  description = "백업 보관 기간 (일)"
  type        = number
}

variable "elasticache_node_type" {
  description = "ElastiCache 노드 타입"
  type        = string
}

variable "elasticache_num_cache_nodes" {
  description = "캐시 노드 수"
  type        = number
}

variable "elasticache_engine_version" {
  description = "Redis 엔진 버전"
  type        = string
}

variable "enable_deletion_protection" {
  description = "삭제 방지 활성화"
  type        = bool
}

variable "enable_monitoring" {
  description = "상세 모니터링 활성화"
  type        = bool
}
