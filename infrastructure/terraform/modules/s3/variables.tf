variable "name_prefix" {
  type = string
}

variable "cloudfront_price_class" {
  type    = string
  default = "PriceClass_200"
}

variable "tags" {
  type    = map(string)
  default = {}
}
