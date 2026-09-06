# Google Cloud Platform (GCP) Deployment Guide

This document specifies the production deployment architecture, configuration, and execution procedures for **Journ** on Google Cloud Platform.

---

## 1. Deployment Topology

The application is deployed using a **Dual Cloud Run Service Architecture**:

```
+-------------------------------------------------------------------------+
|                                Users                                    |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                Cloud Run Service: journ-frontend (Port 8080)            |
| - Next.js 16 App Router (Standalone Node.js Container)                  |
| - Pre-rendered static pages + client-side Firebase Auth                 |
| - Reverse proxies `/api/*` requests to Backend Cloud Run URL           |
+-------------------------------------------------------------------------+
                                     | (Internal HTTPS / Proxied)
                                     v
+-------------------------------------------------------------------------+
|                 Cloud Run Service: journ-backend (Port 8080)            |
| - NestJS 10 API (Containerized Node.js)                                 |
| - Authenticates incoming user requests via Firebase Auth ID Token       |
| - Connects directly to GCP services using Application Default           |
|   Credentials (ADC) via the Cloud Run Service Account                   |
+-------------------------------------------------------------------------+
       |                         |                           |
       v                         v                           v
+---------------+        +---------------+          +-------------------+
| Cloud Storage |        |   Firestore   |          | Gemini & Vertex AI|
| (Attachments) |        | (Entries/Docs)|          | (Embeddings/Chat) |
+---------------+        +---------------+          +-------------------+
                                 ^
                                 | (HTTP POST /cron/all with x-cron-secret)
+--------------------------------+----------------------------------------+
|             Google Cloud Scheduler: journ-maintenance-cron              |
| - Schedule: 0 2 * * * (Daily at 02:00 UTC)                              |
| - Triggers habit memory refresh and unconfirmed attachment cleanup      |
+-------------------------------------------------------------------------+
```

---

## 2. Prerequisites

1. **Google Cloud SDK (`gcloud` CLI):**
   Ensure `gcloud` is installed and authenticated to your GCP account:
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```
2. **GCP Project Configuration:**
   Set the default GCP project:
   ```bash
   gcloud config set project <YOUR_GCP_PROJECT_ID>
   ```
3. **Required GCP Services:**
   The deployment script automatically enables these APIs:
   - `run.googleapis.com` (Cloud Run)
   - `cloudbuild.googleapis.com` (Cloud Build)
   - `artifactregistry.googleapis.com` (Artifact Registry)
   - `firestore.googleapis.com` (Cloud Firestore)
   - `aiplatform.googleapis.com` (Vertex AI)
   - `cloudscheduler.googleapis.com` (Cloud Scheduler)

---

## 3. Environment Configuration

### Backend (`.env`)
Create `.env` in the repository root (based on `.env.example`):

```bash
GCP_PROJECT_ID=<your-gcp-project-id>
GCP_REGION=us-central1
GENAI_LOCATION=global
GEMINI_API_KEY=<your-gemini-api-key>
FIREBASE_STORAGE_BUCKET=<your-project-id>.firebasestorage.app
CRON_SECRET=<generate-a-random-secret-key>
```

> [!NOTE]
> On Cloud Run, `GOOGLE_APPLICATION_CREDENTIALS` is **not required**. The backend automatically uses Application Default Credentials (ADC) provided by the Cloud Run runtime service account.

### Frontend (`frontend/.env.local`)
Create `frontend/.env.local` (based on `frontend/.env.local.example`):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=<your-firebase-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-project-id>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-gcp-project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-project-id>.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-messaging-sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your-app-id>
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=<your-measurement-id>
```

---

## 4. One-Command Deployment

The repository provides automated deployment scripts that build containers using Google Cloud Build, deploy services to Cloud Run, link the frontend proxy to the backend URL, and configure Cloud Scheduler.

### Using Bash (Linux / macOS / Cloud Shell / Git Bash):
```bash
npm run deploy
# Or directly:
bash scripts/deploy.sh
```

### Using PowerShell (Windows):
```powershell
npm run deploy:ps
# Or directly:
powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1
```

---

## 5. Manual Step-by-Step Deployment

If you prefer executing the individual `gcloud` commands manually:

### Step 1: Deploy Backend API
```bash
gcloud run deploy journ-backend \
  --source . \
  --region="us-central1" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1 \
  --set-env-vars="GCP_PROJECT_ID=<PROJECT_ID>,GCP_REGION=us-central1,GENAI_LOCATION=global,GEMINI_API_KEY=<API_KEY>,FIREBASE_STORAGE_BUCKET=<BUCKET>,CRON_SECRET=<SECRET>"
```

Retrieve the deployed backend URL:
```bash
BACKEND_URL=$(gcloud run services describe journ-backend --region=us-central1 --format="value(status.url)")
```

### Step 2: Deploy Frontend Web Application
```bash
gcloud run deploy journ-frontend \
  --source ./frontend \
  --region="us-central1" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1 \
  --set-env-vars="BACKEND_API_URL=${BACKEND_URL},NEXT_PUBLIC_FIREBASE_API_KEY=...,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...,NEXT_PUBLIC_FIREBASE_PROJECT_ID=...,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...,NEXT_PUBLIC_FIREBASE_APP_ID=..."
```

### Step 3: Configure Cloud Scheduler for 02:00 AM Maintenance
```bash
gcloud scheduler jobs create http journ-maintenance-cron \
  --location="us-central1" \
  --schedule="0 2 * * *" \
  --uri="${BACKEND_URL}/cron/all" \
  --http-method=POST \
  --headers="x-cron-secret=<SECRET>"
```

---

## 6. Service Account Permissions (IAM)

The Cloud Run backend service defaults to the Compute Engine default service account (`<project-number>-compute@developer.gserviceaccount.com`) or a custom user-managed service account. Ensure the runtime service account has the following IAM roles:

| Role Name | Role Identifier | Purpose |
|---|---|---|
| Cloud Datastore User | `roles/datastore.user` | Read/write Firestore collections and vector indexes |
| Storage Object Admin | `roles/storage.objectAdmin` | Manage and purge attachments in Cloud Storage |
| Vertex AI User | `roles/aiplatform.user` | Compute Gemini embeddings and generate content |

Granting roles via CLI:
```bash
SERVICE_ACCOUNT="<PROJECT_NUMBER>-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/aiplatform.user"
```

---

## 7. Verification & Health Monitoring

1. **Backend Health Check:**
   ```bash
   curl https://<JOURN-BACKEND-URL>/health
   # Response: {"status":"ok","service":"journ-backend","timestamp":"..."}
   ```
2. **Frontend UI Check:**
   Open `https://<JOURN-FRONTEND-URL>` in your browser. Verify Google Sign-In, timeline rendering, and entry saving.
3. **Cron Webhook Manual Test:**
   ```bash
   curl -X POST https://<JOURN-BACKEND-URL>/cron/all \
     -H "x-cron-secret: <CRON_SECRET>"
   # Response: {"status":"success","job":"all",...}
   ```
