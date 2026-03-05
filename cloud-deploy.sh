#!/bin/bash
set -e

PROJECT_ID="your-gcp-project-id"
IMAGE_NAME="gcr.io/$PROJECT_ID/ai-course-engine"
REGION="us-central1"
SERVICE_NAME="ai-course-engine"

# Ensure you are logged into gcloud before running this:
# gcloud auth login
# gcloud config set project $PROJECT_ID

echo "Building Docker image..."
docker build -t $IMAGE_NAME .

echo "Pushing Docker image to GCR..."
docker push $IMAGE_NAME

echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8080

echo "Deployment complete!"
