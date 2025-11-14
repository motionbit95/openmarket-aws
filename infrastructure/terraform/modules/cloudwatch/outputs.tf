output "dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.openmarket_main.dashboard_name
}

output "dashboard_arn" {
  description = "CloudWatch dashboard ARN"
  value       = aws_cloudwatch_dashboard.openmarket_main.dashboard_arn
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "application_log_group_name" {
  description = "Application log group name"
  value       = aws_cloudwatch_log_group.application_logs.name
}

output "lambda_log_groups" {
  description = "Lambda function log groups"
  value = {
    for k, v in aws_cloudwatch_log_group.lambda_logs : k => v.name
  }
}
