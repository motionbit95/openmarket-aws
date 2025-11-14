variable "name_prefix" {
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

variable "node_type" {
  type = string
}

variable "num_cache_nodes" {
  type = number
}

variable "snapshot_retention_limit" {
  type    = number
  default = 5
}

variable "tags" {
  type    = map(string)
  default = {}
}
