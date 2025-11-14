# CloudWatch Dashboards and Alarms for OpenMarket

resource "aws_cloudwatch_dashboard" "openmarket_main" {
  dashboard_name = "${var.project_name}-${var.environment}-main"

  dashboard_body = jsonencode({
    widgets = [
      # EKS Cluster Metrics
      {
        type = "metric"
        properties = {
          title  = "EKS Cluster CPU Utilization"
          region = var.aws_region
          metrics = [
            ["AWS/EKS", "cluster_cpu_utilization", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },
      # RDS Metrics
      {
        type = "metric"
        properties = {
          title  = "RDS CPU Utilization"
          region = var.aws_region
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", DBInstanceIdentifier = "${var.project_name}-${var.environment}-aurora-instance-1" }],
            ["...", { stat = "Average", DBInstanceIdentifier = "${var.project_name}-${var.environment}-aurora-instance-2" }]
          ]
          period = 300
          stat   = "Average"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          title  = "RDS Database Connections"
          region = var.aws_region
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { stat = "Average", DBInstanceIdentifier = "${var.project_name}-${var.environment}-aurora-instance-1" }]
          ]
          period = 300
          stat   = "Average"
        }
      },
      {
        type = "metric"
        properties = {
          title  = "RDS Read/Write Latency"
          region = var.aws_region
          metrics = [
            ["AWS/RDS", "ReadLatency", { stat = "Average", DBInstanceIdentifier = "${var.project_name}-${var.environment}-aurora-instance-1" }],
            ["...", "WriteLatency", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          yAxis = {
            left = {
              label = "Milliseconds"
            }
          }
        }
      },
      # ElastiCache Metrics
      {
        type = "metric"
        properties = {
          title  = "ElastiCache CPU Utilization"
          region = var.aws_region
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", { stat = "Average", CacheClusterId = "${var.project_name}-${var.environment}-redis-001" }]
          ]
          period = 300
          stat   = "Average"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          title  = "ElastiCache Memory Usage"
          region = var.aws_region
          metrics = [
            ["AWS/ElastiCache", "DatabaseMemoryUsagePercentage", { stat = "Average", CacheClusterId = "${var.project_name}-${var.environment}-redis-001" }]
          ]
          period = 300
          stat   = "Average"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          title  = "ElastiCache Cache Hits/Misses"
          region = var.aws_region
          metrics = [
            ["AWS/ElastiCache", "CacheHits", { stat = "Sum", CacheClusterId = "${var.project_name}-${var.environment}-redis-001" }],
            ["...", "CacheMisses", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Sum"
        }
      },
      # Lambda Metrics
      {
        type = "metric"
        properties = {
          title  = "Lambda Invocations"
          region = var.aws_region
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", FunctionName = "${var.project_name}-${var.environment}-image-processor" }],
            ["...", { stat = "Sum", FunctionName = "${var.project_name}-${var.environment}-email-sender" }],
            ["...", { stat = "Sum", FunctionName = "${var.project_name}-${var.environment}-settlement-report" }],
            ["...", { stat = "Sum", FunctionName = "${var.project_name}-${var.environment}-webhook-handler" }]
          ]
          period = 300
          stat   = "Sum"
        }
      },
      {
        type = "metric"
        properties = {
          title  = "Lambda Errors"
          region = var.aws_region
          metrics = [
            ["AWS/Lambda", "Errors", { stat = "Sum", FunctionName = "${var.project_name}-${var.environment}-image-processor" }],
            ["...", { stat = "Sum", FunctionName = "${var.project_name}-${var.environment}-email-sender" }],
            ["...", { stat = "Sum", FunctionName = "${var.project_name}-${var.environment}-settlement-report" }],
            ["...", { stat = "Sum", FunctionName = "${var.project_name}-${var.environment}-webhook-handler" }]
          ]
          period = 300
          stat   = "Sum"
        }
      },
      {
        type = "metric"
        properties = {
          title  = "Lambda Duration"
          region = var.aws_region
          metrics = [
            ["AWS/Lambda", "Duration", { stat = "Average", FunctionName = "${var.project_name}-${var.environment}-image-processor" }],
            ["...", { stat = "Average", FunctionName = "${var.project_name}-${var.environment}-email-sender" }]
          ]
          period = 300
          stat   = "Average"
          yAxis = {
            left = {
              label = "Milliseconds"
            }
          }
        }
      },
      # ALB Metrics
      {
        type = "metric"
        properties = {
          title  = "ALB Request Count"
          region = var.aws_region
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Sum"
        }
      },
      {
        type = "metric"
        properties = {
          title  = "ALB Target Response Time"
          region = var.aws_region
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          yAxis = {
            left = {
              label = "Seconds"
            }
          }
        }
      },
      # S3 Metrics
      {
        type = "metric"
        properties = {
          title  = "S3 Bucket Size"
          region = var.aws_region
          metrics = [
            ["AWS/S3", "BucketSizeBytes", { stat = "Average", StorageType = "StandardStorage", BucketName = "${var.project_name}-${var.environment}-uploads" }]
          ]
          period = 86400
          stat   = "Average"
        }
      },
      {
        type = "metric"
        properties = {
          title  = "S3 Number of Objects"
          region = var.aws_region
          metrics = [
            ["AWS/S3", "NumberOfObjects", { stat = "Average", StorageType = "AllStorageTypes", BucketName = "${var.project_name}-${var.environment}-uploads" }]
          ]
          period = 86400
          stat   = "Average"
        }
      }
    ]
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application_logs" {
  name              = "/aws/eks/${var.project_name}-${var.environment}/application"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "${var.project_name}-${var.environment}-application-logs"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = toset([
    "image-processor",
    "email-sender",
    "settlement-report",
    "webhook-handler"
  ])

  name              = "/aws/lambda/${var.project_name}-${var.environment}-${each.key}"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "${var.project_name}-${var.environment}-${each.key}-logs"
    Environment = var.environment
    Project     = var.project_name
  }
}

# CloudWatch Alarms - RDS
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = "${var.project_name}-${var.environment}-aurora-instance-1"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-rds-cpu-high"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_connections_high" {
  alarm_name          = "${var.project_name}-${var.environment}-rds-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors RDS database connections"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = "${var.project_name}-${var.environment}-aurora-instance-1"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-rds-connections-high"
    Environment = var.environment
  }
}

# CloudWatch Alarms - ElastiCache
resource "aws_cloudwatch_metric_alarm" "elasticache_cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment}-elasticache-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 75
  alarm_description   = "This metric monitors ElastiCache CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    CacheClusterId = "${var.project_name}-${var.environment}-redis-001"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-elasticache-cpu-high"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "elasticache_memory_high" {
  alarm_name          = "${var.project_name}-${var.environment}-elasticache-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 90
  alarm_description   = "This metric monitors ElastiCache memory usage"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    CacheClusterId = "${var.project_name}-${var.environment}-redis-001"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-elasticache-memory-high"
    Environment = var.environment
  }
}

# CloudWatch Alarms - Lambda
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = toset([
    "image-processor",
    "email-sender",
    "settlement-report",
    "webhook-handler"
  ])

  alarm_name          = "${var.project_name}-${var.environment}-lambda-${each.key}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This metric monitors Lambda function errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = "${var.project_name}-${var.environment}-${each.key}"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-lambda-${each.key}-errors"
    Environment = var.environment
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment}-alerts"

  tags = {
    Name        = "${var.project_name}-${var.environment}-alerts"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_sns_topic_subscription" "alerts_email" {
  count = var.alert_email != "" ? 1 : 0

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Log Metric Filters
resource "aws_cloudwatch_log_metric_filter" "application_errors" {
  name           = "${var.project_name}-${var.environment}-application-errors"
  log_group_name = aws_cloudwatch_log_group.application_logs.name
  pattern        = "[time, request_id, level = ERROR*, ...]"

  metric_transformation {
    name      = "ApplicationErrors"
    namespace = "${var.project_name}/${var.environment}"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "application_errors" {
  alarm_name          = "${var.project_name}-${var.environment}-application-errors-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApplicationErrors"
  namespace           = "${var.project_name}/${var.environment}"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This metric monitors application error count"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name        = "${var.project_name}-${var.environment}-application-errors-high"
    Environment = var.environment
  }
}
