variable "name_prefix" {
  type        = string
  description = "Prefix for resource names"
}

variable "cluster_name" {
  type        = string
  description = "EKS cluster name"
}

variable "oidc_provider_arn" {
  type        = string
  description = "OIDC provider ARN"
}

variable "oidc_provider_url" {
  type        = string
  description = "OIDC provider URL"
}

variable "service_account_subjects" {
  type        = list(string)
  description = "List of service account subjects for IRSA"
  default = [
    "system:serviceaccount:openmarket-dev:backend-sa",
    "system:serviceaccount:openmarket-dev:frontend-sa",
    "system:serviceaccount:kube-system:external-secrets-sa",
    "system:serviceaccount:kube-system:aws-load-balancer-controller",
    "system:serviceaccount:kube-system:cluster-autoscaler",
    "system:serviceaccount:kube-system:ebs-csi-controller-sa"
  ]
}

variable "user_uploads_bucket_arn" {
  type        = string
  description = "User uploads S3 bucket ARN"
}

variable "static_assets_bucket_arn" {
  type        = string
  description = "Static assets S3 bucket ARN"
}

variable "rds_secret_arn" {
  type        = string
  description = "RDS secret ARN"
}

variable "redis_secret_arn" {
  type        = string
  description = "Redis secret ARN"
}

variable "tags" {
  type        = map(string)
  description = "Tags to apply to resources"
  default     = {}
}
