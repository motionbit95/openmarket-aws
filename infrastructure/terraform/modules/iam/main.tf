# ========================================
# IAM Roles for Service Accounts (IRSA)
# ========================================

# Data source for EKS OIDC provider
data "aws_eks_cluster" "cluster" {
  name = var.cluster_name
}

data "aws_iam_policy_document" "assume_role_with_oidc" {
  statement {
    effect = "Allow"

    principals {
      type        = "Federated"
      identifiers = [var.oidc_provider_arn]
    }

    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      variable = "${replace(var.oidc_provider_url, "https://", "")}:sub"
      values   = var.service_account_subjects
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(var.oidc_provider_url, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

# ========================================
# Backend API IRSA Role
# ========================================

resource "aws_iam_role" "backend" {
  name               = "${var.name_prefix}-backend-irsa"
  assume_role_policy = data.aws_iam_policy_document.assume_role_with_oidc.json

  tags = merge(var.tags, {
    Name      = "${var.name_prefix}-backend-irsa"
    Component = "backend"
  })
}

# Backend S3 Access Policy
resource "aws_iam_policy" "backend_s3" {
  name        = "${var.name_prefix}-backend-s3-policy"
  description = "Policy for backend to access S3 buckets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          var.user_uploads_bucket_arn,
          "${var.user_uploads_bucket_arn}/*",
          var.static_assets_bucket_arn,
          "${var.static_assets_bucket_arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListAllMyBuckets"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "backend_s3" {
  role       = aws_iam_role.backend.name
  policy_arn = aws_iam_policy.backend_s3.arn
}

# Backend Secrets Manager Access Policy
resource "aws_iam_policy" "backend_secrets" {
  name        = "${var.name_prefix}-backend-secrets-policy"
  description = "Policy for backend to access Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          var.rds_secret_arn,
          var.redis_secret_arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "backend_secrets" {
  role       = aws_iam_role.backend.name
  policy_arn = aws_iam_policy.backend_secrets.arn
}

# Backend CloudWatch Logs Policy
resource "aws_iam_policy" "backend_cloudwatch" {
  name        = "${var.name_prefix}-backend-cloudwatch-policy"
  description = "Policy for backend to write CloudWatch logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:log-group:/aws/eks/${var.cluster_name}/backend-*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "backend_cloudwatch" {
  role       = aws_iam_role.backend.name
  policy_arn = aws_iam_policy.backend_cloudwatch.arn
}

# Backend SES Policy (for email sending)
resource "aws_iam_policy" "backend_ses" {
  name        = "${var.name_prefix}-backend-ses-policy"
  description = "Policy for backend to send emails via SES"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "backend_ses" {
  role       = aws_iam_role.backend.name
  policy_arn = aws_iam_policy.backend_ses.arn
}

# ========================================
# Frontend IRSA Role
# ========================================

resource "aws_iam_role" "frontend" {
  name               = "${var.name_prefix}-frontend-irsa"
  assume_role_policy = data.aws_iam_policy_document.assume_role_with_oidc.json

  tags = merge(var.tags, {
    Name      = "${var.name_prefix}-frontend-irsa"
    Component = "frontend"
  })
}

# Frontend CloudWatch Logs Policy
resource "aws_iam_policy" "frontend_cloudwatch" {
  name        = "${var.name_prefix}-frontend-cloudwatch-policy"
  description = "Policy for frontend to write CloudWatch logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:log-group:/aws/eks/${var.cluster_name}/frontend-*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "frontend_cloudwatch" {
  role       = aws_iam_role.frontend.name
  policy_arn = aws_iam_policy.frontend_cloudwatch.arn
}

# ========================================
# External Secrets Operator IRSA Role
# ========================================

resource "aws_iam_role" "external_secrets" {
  name               = "${var.name_prefix}-external-secrets-irsa"
  assume_role_policy = data.aws_iam_policy_document.assume_role_with_oidc.json

  tags = merge(var.tags, {
    Name      = "${var.name_prefix}-external-secrets-irsa"
    Component = "external-secrets"
  })
}

resource "aws_iam_policy" "external_secrets" {
  name        = "${var.name_prefix}-external-secrets-policy"
  description = "Policy for External Secrets Operator to access Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "secretsmanager:ListSecrets"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "external_secrets" {
  role       = aws_iam_role.external_secrets.name
  policy_arn = aws_iam_policy.external_secrets.arn
}

# ========================================
# AWS Load Balancer Controller IRSA Role
# ========================================

resource "aws_iam_role" "aws_load_balancer_controller" {
  name               = "${var.name_prefix}-aws-lb-controller-irsa"
  assume_role_policy = data.aws_iam_policy_document.assume_role_with_oidc.json

  tags = merge(var.tags, {
    Name      = "${var.name_prefix}-aws-lb-controller-irsa"
    Component = "aws-load-balancer-controller"
  })
}

# AWS Load Balancer Controller Policy
# Reference: https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json
resource "aws_iam_policy" "aws_load_balancer_controller" {
  name        = "${var.name_prefix}-aws-lb-controller-policy"
  description = "Policy for AWS Load Balancer Controller"

  policy = file("${path.module}/policies/aws-load-balancer-controller-policy.json")
}

resource "aws_iam_role_policy_attachment" "aws_load_balancer_controller" {
  role       = aws_iam_role.aws_load_balancer_controller.name
  policy_arn = aws_iam_policy.aws_load_balancer_controller.arn
}

# ========================================
# Cluster Autoscaler IRSA Role
# ========================================

resource "aws_iam_role" "cluster_autoscaler" {
  name               = "${var.name_prefix}-cluster-autoscaler-irsa"
  assume_role_policy = data.aws_iam_policy_document.assume_role_with_oidc.json

  tags = merge(var.tags, {
    Name      = "${var.name_prefix}-cluster-autoscaler-irsa"
    Component = "cluster-autoscaler"
  })
}

resource "aws_iam_policy" "cluster_autoscaler" {
  name        = "${var.name_prefix}-cluster-autoscaler-policy"
  description = "Policy for Cluster Autoscaler"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "autoscaling:DescribeAutoScalingGroups",
          "autoscaling:DescribeAutoScalingInstances",
          "autoscaling:DescribeLaunchConfigurations",
          "autoscaling:DescribeScalingActivities",
          "autoscaling:DescribeTags",
          "ec2:DescribeInstanceTypes",
          "ec2:DescribeLaunchTemplateVersions"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "autoscaling:SetDesiredCapacity",
          "autoscaling:TerminateInstanceInAutoScalingGroup",
          "ec2:DescribeImages",
          "ec2:GetInstanceTypesFromInstanceRequirements",
          "eks:DescribeNodegroup"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cluster_autoscaler" {
  role       = aws_iam_role.cluster_autoscaler.name
  policy_arn = aws_iam_policy.cluster_autoscaler.arn
}

# ========================================
# EBS CSI Driver IRSA Role
# ========================================

resource "aws_iam_role" "ebs_csi_driver" {
  name               = "${var.name_prefix}-ebs-csi-driver-irsa"
  assume_role_policy = data.aws_iam_policy_document.assume_role_with_oidc.json

  tags = merge(var.tags, {
    Name      = "${var.name_prefix}-ebs-csi-driver-irsa"
    Component = "ebs-csi-driver"
  })
}

resource "aws_iam_role_policy_attachment" "ebs_csi_driver" {
  role       = aws_iam_role.ebs_csi_driver.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
}
