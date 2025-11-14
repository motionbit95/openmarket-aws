# ========================================
# Global Variables
# 모든 모듈에서 공통으로 사용하는 변수
# ========================================

variable "project_name" {
  description = "프로젝트 이름 (모든 리소스 이름에 접두사로 사용)"
  type        = string
  default     = "openmarket"
}

variable "environment" {
  description = "환경 (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod"
  }
}

variable "aws_region" {
  description = "AWS 리전"
  type        = string
  default     = "ap-northeast-2"
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

# ========================================
# VPC 관련 변수
# ========================================

variable "vpc_cidr" {
  description = "VPC CIDR 블록"
  type        = string
  default     = "10.0.0.0/16"
}

variable "enable_nat_gateway" {
  description = "NAT Gateway 활성화 여부"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "단일 NAT Gateway 사용 여부 (비용 절감)"
  type        = bool
  default     = false
}

# ========================================
# EKS 관련 변수
# ========================================

variable "eks_cluster_version" {
  description = "EKS 클러스터 버전"
  type        = string
  default     = "1.28"
}

variable "eks_node_groups" {
  description = "EKS 노드 그룹 설정"
  type = map(object({
    instance_types = list(string)
    min_size       = number
    max_size       = number
    desired_size   = number
  }))
  default = {
    general = {
      instance_types = ["t3.medium"]
      min_size       = 2
      max_size       = 5
      desired_size   = 2
    }
  }
}

# ========================================
# RDS 관련 변수
# ========================================

variable "rds_instance_class" {
  description = "RDS 인스턴스 클래스"
  type        = string
  default     = "db.t3.medium"
}

variable "rds_engine_version" {
  description = "MySQL 엔진 버전"
  type        = string
  default     = "8.0.mysql_aurora.3.04.0"
}

variable "rds_database_name" {
  description = "데이터베이스 이름"
  type        = string
  default     = "openmarket"
}

variable "rds_master_username" {
  description = "마스터 사용자 이름"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "rds_backup_retention_period" {
  description = "백업 보관 기간 (일)"
  type        = number
  default     = 7
}

# ========================================
# ElastiCache 관련 변수
# ========================================

variable "elasticache_node_type" {
  description = "ElastiCache 노드 타입"
  type        = string
  default     = "cache.t3.micro"
}

variable "elasticache_num_cache_nodes" {
  description = "캐시 노드 수"
  type        = number
  default     = 2
}

variable "elasticache_engine_version" {
  description = "Redis 엔진 버전"
  type        = string
  default     = "7.0"
}

# ========================================
# 기타 설정
# ========================================

variable "enable_deletion_protection" {
  description = "삭제 방지 활성화 (프로덕션 권장)"
  type        = bool
  default     = false
}

variable "enable_monitoring" {
  description = "상세 모니터링 활성화"
  type        = bool
  default     = true
}
