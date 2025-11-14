output "static_assets_bucket_name" {
  value = aws_s3_bucket.static_assets.id
}

output "static_assets_bucket_arn" {
  value = aws_s3_bucket.static_assets.arn
}

output "user_uploads_bucket_name" {
  value = aws_s3_bucket.user_uploads.id
}

output "user_uploads_bucket_arn" {
  value = aws_s3_bucket.user_uploads.arn
}

output "backups_bucket_name" {
  value = aws_s3_bucket.backups.id
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.static_assets.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.static_assets.domain_name
}
