# ========================================
# Lambda Functions Module
# Serverless 함수 리소스 정의
# ========================================

# Lambda Functions
# 1. Image Processor
# 2. Email Sender
# 3. Settlement Report
# 4. Webhook Handler

# ========================================
# 1. Image Processor Lambda
# ========================================

resource "aws_lambda_function" "image_processor" {
  filename      = var.image_processor_zip
  function_name = "${var.project_name}-${var.environment}-image-processor"
  role          = aws_iam_role.image_processor.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 60
  memory_size   = 1024

  environment {
    variables = {
      NODE_ENV = var.environment == "prod" ? "production" : "development"
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-image-processor"
      Function = "image-processing"
    }
  )
}

# S3 Trigger for Image Processor
resource "aws_lambda_permission" "image_processor_s3" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.image_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = var.uploads_bucket_arn
}

resource "aws_s3_bucket_notification" "uploads_notification" {
  bucket = var.uploads_bucket_id

  lambda_function {
    lambda_function_arn = aws_lambda_function.image_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
  }

  depends_on = [aws_lambda_permission.image_processor_s3]
}

# ========================================
# 2. Email Sender Lambda
# ========================================

resource "aws_lambda_function" "email_sender" {
  filename      = var.email_sender_zip
  function_name = "${var.project_name}-${var.environment}-email-sender"
  role          = aws_iam_role.email_sender.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 256

  environment {
    variables = {
      NODE_ENV   = var.environment == "prod" ? "production" : "development"
      FROM_EMAIL = var.from_email
      AWS_REGION = var.aws_region
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-email-sender"
      Function = "email-sending"
    }
  )
}

# SQS Trigger for Email Sender
resource "aws_lambda_event_source_mapping" "email_sender_sqs" {
  event_source_arn = var.email_queue_arn
  function_name    = aws_lambda_function.email_sender.function_name
  batch_size       = 10
}

# ========================================
# 3. Settlement Report Lambda
# ========================================

resource "aws_lambda_function" "settlement_report" {
  filename      = var.settlement_report_zip
  function_name = "${var.project_name}-${var.environment}-settlement-report"
  role          = aws_iam_role.settlement_report.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 300
  memory_size   = 512

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [var.lambda_security_group_id]
  }

  environment {
    variables = {
      NODE_ENV         = var.environment == "prod" ? "production" : "development"
      DB_SECRET_NAME   = var.db_secret_name
      DB_NAME          = var.db_name
      REPORTS_BUCKET   = var.reports_bucket_name
      EMAIL_QUEUE_URL  = var.email_queue_url
      AWS_REGION       = var.aws_region
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-settlement-report"
      Function = "settlement-reporting"
    }
  )
}

# EventBridge Rules for Settlement Report
resource "aws_cloudwatch_event_rule" "daily_settlement" {
  name                = "${var.project_name}-${var.environment}-daily-settlement"
  description         = "Daily settlement report generation"
  schedule_expression = "cron(0 0 * * ? *)" # Daily at 9 AM KST (0 AM UTC)

  tags = var.tags
}

resource "aws_cloudwatch_event_target" "daily_settlement" {
  rule      = aws_cloudwatch_event_rule.daily_settlement.name
  target_id = "DailySettlementLambda"
  arn       = aws_lambda_function.settlement_report.arn

  input = jsonencode({
    reportType = "daily"
  })
}

resource "aws_lambda_permission" "daily_settlement" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.settlement_report.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_settlement.arn
}

resource "aws_cloudwatch_event_rule" "weekly_settlement" {
  name                = "${var.project_name}-${var.environment}-weekly-settlement"
  description         = "Weekly settlement report generation"
  schedule_expression = "cron(0 0 ? * MON *)" # Every Monday at 9 AM KST

  tags = var.tags
}

resource "aws_cloudwatch_event_target" "weekly_settlement" {
  rule      = aws_cloudwatch_event_rule.weekly_settlement.name
  target_id = "WeeklySettlementLambda"
  arn       = aws_lambda_function.settlement_report.arn

  input = jsonencode({
    reportType = "weekly"
  })
}

resource "aws_lambda_permission" "weekly_settlement" {
  statement_id  = "AllowExecutionFromEventBridgeWeekly"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.settlement_report.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.weekly_settlement.arn
}

resource "aws_cloudwatch_event_rule" "monthly_settlement" {
  name                = "${var.project_name}-${var.environment}-monthly-settlement"
  description         = "Monthly settlement report generation"
  schedule_expression = "cron(0 0 1 * ? *)" # 1st day of month at 9 AM KST

  tags = var.tags
}

resource "aws_cloudwatch_event_target" "monthly_settlement" {
  rule      = aws_cloudwatch_event_rule.monthly_settlement.name
  target_id = "MonthlySettlementLambda"
  arn       = aws_lambda_function.settlement_report.arn

  input = jsonencode({
    reportType = "monthly"
  })
}

resource "aws_lambda_permission" "monthly_settlement" {
  statement_id  = "AllowExecutionFromEventBridgeMonthly"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.settlement_report.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.monthly_settlement.arn
}

# ========================================
# 4. Webhook Handler Lambda
# ========================================

resource "aws_lambda_function" "webhook_handler" {
  filename      = var.webhook_handler_zip
  function_name = "${var.project_name}-${var.environment}-webhook-handler"
  role          = aws_iam_role.webhook_handler.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 512

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [var.lambda_security_group_id]
  }

  environment {
    variables = {
      NODE_ENV        = var.environment == "prod" ? "production" : "development"
      DB_SECRET_NAME  = var.db_secret_name
      DB_NAME         = var.db_name
      EMAIL_QUEUE_URL = var.email_queue_url
      AWS_REGION      = var.aws_region
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-webhook-handler"
      Function = "webhook-handling"
    }
  )
}

# Lambda Function URL for Webhook Handler
resource "aws_lambda_function_url" "webhook_handler" {
  function_name      = aws_lambda_function.webhook_handler.function_name
  authorization_type = "NONE"

  cors {
    allow_origins     = var.environment == "prod" ? ["https://openmarket.com"] : ["*"]
    allow_methods     = ["POST"]
    allow_headers     = ["content-type", "x-webhook-signature"]
    max_age           = 3600
  }
}

# ========================================
# CloudWatch Log Groups
# ========================================

resource "aws_cloudwatch_log_group" "image_processor" {
  name              = "/aws/lambda/${aws_lambda_function.image_processor.function_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "email_sender" {
  name              = "/aws/lambda/${aws_lambda_function.email_sender.function_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "settlement_report" {
  name              = "/aws/lambda/${aws_lambda_function.settlement_report.function_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "webhook_handler" {
  name              = "/aws/lambda/${aws_lambda_function.webhook_handler.function_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = var.tags
}
