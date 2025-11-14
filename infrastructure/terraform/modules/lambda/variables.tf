# ========================================
# Lambda Module Variables
# ========================================

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
  default     = "ap-northeast-2"
}

# Lambda Function ZIP 파일
variable "image_processor_zip" {
  description = "Image Processor Lambda ZIP 파일 경로"
  type        = string
}

variable "email_sender_zip" {
  description = "Email Sender Lambda ZIP 파일 경로"
  type        = string
}

variable "settlement_report_zip" {
  description = "Settlement Report Lambda ZIP 파일 경로"
  type        = string
}

variable "webhook_handler_zip" {
  description = "Webhook Handler Lambda ZIP 파일 경로"
  type        = string
}

# S3 Buckets
variable "uploads_bucket_id" {
  description = "Uploads S3 버킷 ID"
  type        = string
}

variable "uploads_bucket_arn" {
  description = "Uploads S3 버킷 ARN"
  type        = string
}

variable "reports_bucket_name" {
  description = "Reports S3 버킷 이름"
  type        = string
}

variable "reports_bucket_arn" {
  description = "Reports S3 버킷 ARN"
  type        = string
}

# SQS
variable "email_queue_arn" {
  description = "Email Queue ARN"
  type        = string
}

variable "email_queue_url" {
  description = "Email Queue URL"
  type        = string
}

# Database
variable "db_secret_name" {
  description = "RDS Credentials Secret 이름"
  type        = string
}

variable "db_secret_arn" {
  description = "RDS Credentials Secret ARN"
  type        = string
}

variable "db_name" {
  description = "데이터베이스 이름"
  type        = string
}

# VPC
variable "private_subnet_ids" {
  description = "Private Subnet IDs"
  type        = list(string)
}

variable "lambda_security_group_id" {
  description = "Lambda Security Group ID"
  type        = string
}

# Email
variable "from_email" {
  description = "발신 이메일 주소"
  type        = string
  default     = "noreply@openmarket.com"
}

# Tags
variable "tags" {
  description = "리소스 태그"
  type        = map(string)
  default     = {}
}
