#!/usr/bin/env bash
set -e

# ==============================================================================
# Journ GCP Deployment Script (Cloud Run Dual-Service Architecture)
# ==============================================================================

echo "============================================================"
echo "Starting Journ deployment to Google Cloud Platform..."
echo "============================================================"

# Ensure gcloud CLI is installed
if ! command -v gcloud &> /dev/null; then
  echo "Error: gcloud CLI is not installed or not in PATH."
  echo "Please install the Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

# Load backend .env if present
if [ -f .env ]; then
  echo "Loading configuration from .env..."
  set -a
  source .env
  set +a
fi

# Load frontend .env.local if present
if [ -f frontend/.env.local ]; then
  echo "Loading client configuration from frontend/.env.local..."
  set -a
  source frontend/.env.local
  set +a
fi

# Determine GCP Project ID
GCP_PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
if [ -z "$GCP_PROJECT_ID" ] || [ "$GCP_PROJECT_ID" == "(unset)" ]; then
  echo "Error: GCP project is not configured. Set GCP_PROJECT_ID in .env or run: gcloud config set project <PROJECT_ID>"
  exit 1
fi

GCP_REGION="${GCP_REGION:-us-central1}"
CRON_SECRET="${CRON_SECRET:-$(openssl rand -hex 16 2>/dev/null || echo 'journ-cron-secret-key')}"

echo "Project ID: ${GCP_PROJECT_ID}"
echo "Region:     ${GCP_REGION}"
echo ""

# Enable required GCP APIs
echo "Enabling necessary Google Cloud services..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  aiplatform.googleapis.com \
  cloudscheduler.googleapis.com \
  --project="${GCP_PROJECT_ID}"

echo ""
echo "------------------------------------------------------------"
echo "Step 1: Deploying Journ Backend (NestJS API) to Cloud Run..."
echo "------------------------------------------------------------"

gcloud run deploy journ-backend \
  --source . \
  --region="${GCP_REGION}" \
  --project="${GCP_PROJECT_ID}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1 \
  --set-env-vars="GCP_PROJECT_ID=${GCP_PROJECT_ID},GCP_REGION=${GCP_REGION},GENAI_LOCATION=${GENAI_LOCATION:-global},GEMINI_API_KEY=${GEMINI_API_KEY},FIREBASE_STORAGE_BUCKET=${FIREBASE_STORAGE_BUCKET},CRON_SECRET=${CRON_SECRET}"

BACKEND_URL=$(gcloud run services describe journ-backend --region="${GCP_REGION}" --project="${GCP_PROJECT_ID}" --format="value(status.url)")

echo "Backend deployed successfully: ${BACKEND_URL}"
echo ""

echo "------------------------------------------------------------"
echo "Step 2: Deploying Journ Frontend (Next.js) to Cloud Run..."
echo "------------------------------------------------------------"

gcloud run deploy journ-frontend \
  --source ./frontend \
  --region="${GCP_REGION}" \
  --project="${GCP_PROJECT_ID}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1 \
  --set-env-vars="BACKEND_API_URL=${BACKEND_URL},NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY},NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN},NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID},NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET},NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID},NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID},NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=${NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}"

FRONTEND_URL=$(gcloud run services describe journ-frontend --region="${GCP_REGION}" --project="${GCP_PROJECT_ID}" --format="value(status.url)")

echo "Frontend deployed successfully: ${FRONTEND_URL}"
echo ""

echo "------------------------------------------------------------"
echo "Step 3: Configuring Cloud Scheduler for 02:00 AM Cron Jobs..."
echo "------------------------------------------------------------"

SCHEDULER_JOB_NAME="journ-maintenance-cron"
CRON_ENDPOINT="${BACKEND_URL}/cron/all"

if gcloud scheduler jobs describe "${SCHEDULER_JOB_NAME}" --location="${GCP_REGION}" --project="${GCP_PROJECT_ID}" &>/dev/null; then
  echo "Updating existing Cloud Scheduler job: ${SCHEDULER_JOB_NAME}..."
  gcloud scheduler jobs update http "${SCHEDULER_JOB_NAME}" \
    --location="${GCP_REGION}" \
    --project="${GCP_PROJECT_ID}" \
    --schedule="0 2 * * *" \
    --uri="${CRON_ENDPOINT}" \
    --http-method=POST \
    --headers="x-cron-secret=${CRON_SECRET}"
else
  echo "Creating new Cloud Scheduler job: ${SCHEDULER_JOB_NAME}..."
  gcloud scheduler jobs create http "${SCHEDULER_JOB_NAME}" \
    --location="${GCP_REGION}" \
    --project="${GCP_PROJECT_ID}" \
    --schedule="0 2 * * *" \
    --uri="${CRON_ENDPOINT}" \
    --http-method=POST \
    --headers="x-cron-secret=${CRON_SECRET}"
fi

echo ""
echo "============================================================"
echo "Deployment Complete!"
echo "Backend API:  ${BACKEND_URL}"
echo "Frontend App: ${FRONTEND_URL}"
echo "Scheduler:    ${SCHEDULER_JOB_NAME} (Daily at 02:00 UTC)"
echo "============================================================"
