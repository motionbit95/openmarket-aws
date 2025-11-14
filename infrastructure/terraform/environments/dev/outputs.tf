# ========================================
# Development Environment Outputs
# ========================================

# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

# EKS Outputs
output "eks_cluster_id" {
  description = "EKS cluster ID"
  value       = module.eks.cluster_id
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_certificate_authority_data" {
  description = "EKS cluster certificate authority data"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}

# RDS Outputs
output "rds_cluster_endpoint" {
  description = "RDS cluster endpoint"
  value       = module.rds.cluster_endpoint
}

output "rds_reader_endpoint" {
  description = "RDS reader endpoint"
  value       = module.rds.reader_endpoint
}

output "rds_secret_arn" {
  description = "RDS master password secret ARN"
  value       = module.rds.secret_arn
}

# ElastiCache Outputs
output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.elasticache.configuration_endpoint_address
}

output "redis_port" {
  description = "Redis port"
  value       = module.elasticache.port
}

output "redis_secret_arn" {
  description = "Redis auth token secret ARN"
  value       = module.elasticache.secret_arn
}

# S3 Outputs
output "static_assets_bucket" {
  description = "Static assets S3 bucket name"
  value       = module.s3.static_assets_bucket_name
}

output "user_uploads_bucket" {
  description = "User uploads S3 bucket name"
  value       = module.s3.user_uploads_bucket_name
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.s3.cloudfront_domain_name
}

# IAM Outputs
output "backend_irsa_role_arn" {
  description = "Backend IRSA role ARN"
  value       = module.iam.backend_role_arn
}

output "frontend_irsa_role_arn" {
  description = "Frontend IRSA role ARN"
  value       = module.iam.frontend_role_arn
}

output "external_secrets_irsa_role_arn" {
  description = "External Secrets Operator IRSA role ARN"
  value       = module.iam.external_secrets_role_arn
}

output "aws_load_balancer_controller_irsa_role_arn" {
  description = "AWS Load Balancer Controller IRSA role ARN"
  value       = module.iam.aws_load_balancer_controller_role_arn
}

# Configuration for kubectl
output "configure_kubectl" {
  description = "Configure kubectl command"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${local.name_prefix}-eks --profile openmarket"
}
