output "replication_group_id" {
  value = aws_elasticache_replication_group.main.id
}

output "primary_endpoint_address" {
  value = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "configuration_endpoint_address" {
  value = aws_elasticache_replication_group.main.configuration_endpoint_address
}

output "port" {
  value = aws_elasticache_replication_group.main.port
}

output "secret_arn" {
  value = aws_secretsmanager_secret.redis_auth.arn
}
