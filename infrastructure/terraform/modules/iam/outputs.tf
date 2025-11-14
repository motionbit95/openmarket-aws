output "backend_role_arn" {
  description = "Backend IRSA role ARN"
  value       = aws_iam_role.backend.arn
}

output "frontend_role_arn" {
  description = "Frontend IRSA role ARN"
  value       = aws_iam_role.frontend.arn
}

output "external_secrets_role_arn" {
  description = "External Secrets Operator IRSA role ARN"
  value       = aws_iam_role.external_secrets.arn
}

output "aws_load_balancer_controller_role_arn" {
  description = "AWS Load Balancer Controller IRSA role ARN"
  value       = aws_iam_role.aws_load_balancer_controller.arn
}

output "cluster_autoscaler_role_arn" {
  description = "Cluster Autoscaler IRSA role ARN"
  value       = aws_iam_role.cluster_autoscaler.arn
}

output "ebs_csi_driver_role_arn" {
  description = "EBS CSI Driver IRSA role ARN"
  value       = aws_iam_role.ebs_csi_driver.arn
}
