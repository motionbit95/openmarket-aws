# ========================================
# OpenMarket AWS - Development Environment
# ========================================

terraform {
  backend "s3" {
    bucket         = "openmarket-terraform-state-251114"
    key            = "dev/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "openmarket-terraform-locks"
    profile        = "openmarket"
    encrypt        = true
  }
}

provider "aws" {
  region  = var.aws_region
  profile = "openmarket"

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  common_tags = merge(var.tags, {
    Environment = var.environment
  })
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# ========================================
# VPC Module
# ========================================

module "vpc" {
  source = "../../modules/vpc"

  name_prefix        = local.name_prefix
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  enable_nat_gateway = var.enable_nat_gateway
  single_nat_gateway = var.single_nat_gateway
  enable_flow_logs   = false

  tags = local.common_tags
}

# ========================================
# Security Groups Module
# ========================================

module "security" {
  source = "../../modules/security"

  name_prefix = local.name_prefix
  vpc_id      = module.vpc.vpc_id

  tags = local.common_tags
}

# ========================================
# EKS Module
# ========================================

module "eks" {
  source = "../../modules/eks"

  name_prefix               = local.name_prefix
  cluster_version           = var.eks_cluster_version
  private_subnet_ids        = module.vpc.private_subnet_ids
  public_subnet_ids         = module.vpc.public_subnet_ids
  cluster_security_group_id = module.security.eks_cluster_sg_id
  node_groups               = var.eks_node_groups

  tags = local.common_tags
}

# ========================================
# RDS Module
# ========================================

module "rds" {
  source = "../../modules/rds"

  name_prefix                 = local.name_prefix
  environment                 = var.environment
  database_subnet_ids         = module.vpc.database_subnet_ids
  security_group_id           = module.security.rds_sg_id
  engine_version              = var.rds_engine_version
  instance_class              = var.rds_instance_class
  instance_count              = 2
  database_name               = var.rds_database_name
  master_username             = var.rds_master_username
  backup_retention_period     = var.rds_backup_retention_period
  enable_deletion_protection  = var.enable_deletion_protection
  enable_monitoring           = var.enable_monitoring

  tags = local.common_tags
}

# ========================================
# ElastiCache Module
# ========================================

module "elasticache" {
  source = "../../modules/elasticache"

  name_prefix         = local.name_prefix
  database_subnet_ids = module.vpc.database_subnet_ids
  security_group_id   = module.security.elasticache_sg_id
  engine_version      = var.elasticache_engine_version
  node_type           = var.elasticache_node_type
  num_cache_nodes     = var.elasticache_num_cache_nodes

  tags = local.common_tags
}

# ========================================
# S3 and CloudFront Module
# ========================================

module "s3" {
  source = "../../modules/s3"

  name_prefix = local.name_prefix

  tags = local.common_tags
}

# ========================================
# IAM Module (IRSA)
# ========================================

module "iam" {
  source = "../../modules/iam"

  name_prefix            = local.name_prefix
  cluster_name           = module.eks.cluster_id
  oidc_provider_arn      = module.eks.oidc_provider_arn
  oidc_provider_url      = module.eks.cluster_oidc_issuer_url
  user_uploads_bucket_arn = module.s3.user_uploads_bucket_arn
  static_assets_bucket_arn = module.s3.static_assets_bucket_arn
  rds_secret_arn         = module.rds.secret_arn
  redis_secret_arn       = module.elasticache.secret_arn

  tags = local.common_tags
}
