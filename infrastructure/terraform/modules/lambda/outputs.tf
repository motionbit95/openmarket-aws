# ========================================
# Lambda Module Outputs
# ========================================

# Image Processor
output "image_processor_function_name" {
  description = "Image Processor Lambda 함수 이름"
  value       = aws_lambda_function.image_processor.function_name
}

output "image_processor_function_arn" {
  description = "Image Processor Lambda 함수 ARN"
  value       = aws_lambda_function.image_processor.arn
}

output "image_processor_role_arn" {
  description = "Image Processor IAM Role ARN"
  value       = aws_iam_role.image_processor.arn
}

# Email Sender
output "email_sender_function_name" {
  description = "Email Sender Lambda 함수 이름"
  value       = aws_lambda_function.email_sender.function_name
}

output "email_sender_function_arn" {
  description = "Email Sender Lambda 함수 ARN"
  value       = aws_lambda_function.email_sender.arn
}

output "email_sender_role_arn" {
  description = "Email Sender IAM Role ARN"
  value       = aws_iam_role.email_sender.arn
}

# Settlement Report
output "settlement_report_function_name" {
  description = "Settlement Report Lambda 함수 이름"
  value       = aws_lambda_function.settlement_report.function_name
}

output "settlement_report_function_arn" {
  description = "Settlement Report Lambda 함수 ARN"
  value       = aws_lambda_function.settlement_report.arn
}

output "settlement_report_role_arn" {
  description = "Settlement Report IAM Role ARN"
  value       = aws_iam_role.settlement_report.arn
}

# EventBridge Rules
output "daily_settlement_rule_arn" {
  description = "Daily Settlement EventBridge Rule ARN"
  value       = aws_cloudwatch_event_rule.daily_settlement.arn
}

output "weekly_settlement_rule_arn" {
  description = "Weekly Settlement EventBridge Rule ARN"
  value       = aws_cloudwatch_event_rule.weekly_settlement.arn
}

output "monthly_settlement_rule_arn" {
  description = "Monthly Settlement EventBridge Rule ARN"
  value       = aws_cloudwatch_event_rule.monthly_settlement.arn
}

# Webhook Handler
output "webhook_handler_function_name" {
  description = "Webhook Handler Lambda 함수 이름"
  value       = aws_lambda_function.webhook_handler.function_name
}

output "webhook_handler_function_arn" {
  description = "Webhook Handler Lambda 함수 ARN"
  value       = aws_lambda_function.webhook_handler.arn
}

output "webhook_handler_role_arn" {
  description = "Webhook Handler IAM Role ARN"
  value       = aws_iam_role.webhook_handler.arn
}

output "webhook_handler_url" {
  description = "Webhook Handler Function URL"
  value       = aws_lambda_function_url.webhook_handler.function_url
}

# CloudWatch Log Groups
output "image_processor_log_group" {
  description = "Image Processor CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.image_processor.name
}

output "email_sender_log_group" {
  description = "Email Sender CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.email_sender.name
}

output "settlement_report_log_group" {
  description = "Settlement Report CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.settlement_report.name
}

output "webhook_handler_log_group" {
  description = "Webhook Handler CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.webhook_handler.name
}
