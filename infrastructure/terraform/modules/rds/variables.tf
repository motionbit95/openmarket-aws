variable "name_prefix" {
  type = string
}

variable "environment" {
  type = string
}

variable "database_subnet_ids" {
  type = list(string)
}

variable "security_group_id" {
  type = string
}

variable "engine_version" {
  type = string
}

variable "instance_class" {
  type = string
}

variable "instance_count" {
  type    = number
  default = 2
}

variable "database_name" {
  type = string
}

variable "master_username" {
  type      = string
  sensitive = true
}

variable "backup_retention_period" {
  type = number
}

variable "enable_deletion_protection" {
  type = bool
}

variable "enable_monitoring" {
  type = bool
}

variable "tags" {
  type    = map(string)
  default = {}
}
