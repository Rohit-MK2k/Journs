# ==============================================================================
# Journ GCP Deployment Script for PowerShell (Cloud Run Dual-Service)
# ==============================================================================

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Starting Journ deployment to Google Cloud Platform..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# Check gcloud CLI
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Error "gcloud CLI is not installed or not in PATH. Install Google Cloud SDK first."
    exit 1
}

# Function to parse simple .env files
function Import-EnvFile($FilePath) {
    if (Test-Path $FilePath) {
        Write-Host "Loading variables from $FilePath..." -ForegroundColor Yellow
        Get-Content $FilePath | ForEach-Object {
            $line = $_.Trim()
            if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
                $parts = $line.Split("=", 2)
                $key = $parts[0].Trim()
                $val = $parts[1].Trim()
                # Strip wrapping quotes if present
                if (($val.StartsWith('"') -and $val.EndsWith('"')) -or ($val.StartsWith("'") -and $val.EndsWith("'"))) {
                    $val = $val.Substring(1, $val.Length - 2)
                }
                [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
            }
        }
    }
}

Import-EnvFile ".env"
Import-EnvFile "frontend\.env.local"

# Determine GCP Project ID
$GcpProjectId = $env:GCP_PROJECT_ID
if (-not $GcpProjectId) {
    $GcpProjectId = (gcloud config get-value project 2>$null).Trim()
}

if (-not $GcpProjectId -or $GcpProjectId -eq "(unset)") {
    Write-Error "GCP project is not configured. Set GCP_PROJECT_ID in .env or run: gcloud config set project <PROJECT_ID>"
    exit 1
}

$GcpRegion = if ($env:GCP_REGION) { $env:GCP_REGION } else { "us-central1" }
$CronSecret = if ($env:CRON_SECRET) { $env:CRON_SECRET } else { [System.Guid]::NewGuid().ToString("N") }
$GenAiLocation = if ($env:GENAI_LOCATION) { $env:GENAI_LOCATION } else { "global" }

Write-Host "Project ID: $GcpProjectId" -ForegroundColor Green
Write-Host "Region:     $GcpRegion" -ForegroundColor Green
Write-Host ""

# Enable Services
Write-Host "Enabling necessary Google Cloud services..." -ForegroundColor Yellow
gcloud services enable `
  run.googleapis.com `
  cloudbuild.googleapis.com `
  artifactregistry.googleapis.com `
  firestore.googleapis.com `
  aiplatform.googleapis.com `
  cloudscheduler.googleapis.com `
  --project="$GcpProjectId"

Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "Step 1: Deploying Journ Backend (NestJS API) to Cloud Run..." -ForegroundColor Cyan
Write-Host "------------------------------------------------------------" -ForegroundColor Cyan

gcloud run deploy journ-backend `
  --source . `
  --region="$GcpRegion" `
  --project="$GcpProjectId" `
  --platform=managed `
  --allow-unauthenticated `
  --port=8080 `
  --min-instances=0 `
  --max-instances=10 `
  --memory=512Mi `
  --cpu=1 `
  --set-env-vars="GCP_PROJECT_ID=$GcpProjectId,GCP_REGION=$GcpRegion,GENAI_LOCATION=$GenAiLocation,GEMINI_API_KEY=$($env:GEMINI_API_KEY),FIREBASE_STORAGE_BUCKET=$($env:FIREBASE_STORAGE_BUCKET),CRON_SECRET=$CronSecret"

$BackendUrl = (gcloud run services describe journ-backend --region="$GcpRegion" --project="$GcpProjectId" --format="value(status.url)").Trim()
Write-Host "Backend deployed successfully: $BackendUrl" -ForegroundColor Green
Write-Host ""

Write-Host "------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "Step 2: Deploying Journ Frontend (Next.js) to Cloud Run..." -ForegroundColor Cyan
Write-Host "------------------------------------------------------------" -ForegroundColor Cyan

gcloud run deploy journ-frontend `
  --source ./frontend `
  --region="$GcpRegion" `
  --project="$GcpProjectId" `
  --platform=managed `
  --allow-unauthenticated `
  --port=8080 `
  --min-instances=0 `
  --max-instances=10 `
  --memory=512Mi `
  --cpu=1 `
  --set-env-vars="BACKEND_API_URL=$BackendUrl,NEXT_PUBLIC_FIREBASE_API_KEY=$($env:NEXT_PUBLIC_FIREBASE_API_KEY),NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$($env:NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),NEXT_PUBLIC_FIREBASE_PROJECT_ID=$($env:NEXT_PUBLIC_FIREBASE_PROJECT_ID),NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$($env:NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$($env:NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),NEXT_PUBLIC_FIREBASE_APP_ID=$($env:NEXT_PUBLIC_FIREBASE_APP_ID),NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$($env:NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID)"

$FrontendUrl = (gcloud run services describe journ-frontend --region="$GcpRegion" --project="$GcpProjectId" --format="value(status.url)").Trim()
Write-Host "Frontend deployed successfully: $FrontendUrl" -ForegroundColor Green
Write-Host ""

Write-Host "------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "Step 3: Configuring Cloud Scheduler for 02:00 AM Cron Jobs..." -ForegroundColor Cyan
Write-Host "------------------------------------------------------------" -ForegroundColor Cyan

$SchedulerJobName = "journ-maintenance-cron"
$CronEndpoint = "$BackendUrl/cron/all"

$existingJob = gcloud scheduler jobs describe $SchedulerJobName --location="$GcpRegion" --project="$GcpProjectId" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Updating existing Cloud Scheduler job: $SchedulerJobName..." -ForegroundColor Yellow
    gcloud scheduler jobs update http $SchedulerJobName `
      --location="$GcpRegion" `
      --project="$GcpProjectId" `
      --schedule="0 2 * * *" `
      --uri="$CronEndpoint" `
      --http-method=POST `
      --headers="x-cron-secret=$CronSecret"
} else {
    Write-Host "Creating new Cloud Scheduler job: $SchedulerJobName..." -ForegroundColor Yellow
    gcloud scheduler jobs create http $SchedulerJobName `
      --location="$GcpRegion" `
      --project="$GcpProjectId" `
      --schedule="0 2 * * *" `
      --uri="$CronEndpoint" `
      --http-method=POST `
      --headers="x-cron-secret=$CronSecret"
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "Backend API:  $BackendUrl" -ForegroundColor Green
Write-Host "Frontend App: $FrontendUrl" -ForegroundColor Green
Write-Host "Scheduler:    $SchedulerJobName (Daily at 02:00 UTC)" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
