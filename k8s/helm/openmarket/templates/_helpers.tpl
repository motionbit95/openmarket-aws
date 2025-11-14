{{/*
Expand the name of the chart.
*/}}
{{- define "openmarket.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "openmarket.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "openmarket.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "openmarket.labels" -}}
helm.sh/chart: {{ include "openmarket.chart" . }}
{{ include "openmarket.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
environment: {{ .Values.global.environment }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "openmarket.selectorLabels" -}}
app.kubernetes.io/name: {{ include "openmarket.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Backend labels
*/}}
{{- define "openmarket.backend.labels" -}}
{{ include "openmarket.labels" . }}
app: {{ .Values.backend.name }}
tier: backend
component: api
{{- end }}

{{/*
Frontend labels
*/}}
{{- define "openmarket.frontend.labels" -}}
{{ include "openmarket.labels" . }}
app: {{ .Values.frontend.name }}
tier: frontend
component: web
{{- end }}

{{/*
Create the name of the service account to use for backend
*/}}
{{- define "openmarket.backend.serviceAccountName" -}}
{{- if .Values.backend.serviceAccount.create }}
{{- default .Values.backend.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.backend.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the service account to use for frontend
*/}}
{{- define "openmarket.frontend.serviceAccountName" -}}
{{- if .Values.frontend.serviceAccount.create }}
{{- default .Values.frontend.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.frontend.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Image URL for backend
*/}}
{{- define "openmarket.backend.image" -}}
{{- printf "%s/%s:%s" .Values.imageRegistry.url .Values.backend.image.repository .Values.backend.image.tag }}
{{- end }}

{{/*
Image URL for frontend
*/}}
{{- define "openmarket.frontend.image" -}}
{{- printf "%s/%s:%s" .Values.imageRegistry.url .Values.frontend.image.repository .Values.frontend.image.tag }}
{{- end }}
