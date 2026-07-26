#!/bin/bash
set -e

echo "🚀 Building Docker images in parallel..."

# Build all 3 targets in parallel to save time
docker build --target backend -t europe-west1-docker.pkg.dev/ihz-contract-checker/b2c-repo/backend:latest . --platform linux/amd64 &
PID_BACKEND=$!

docker build --target aigateway -t europe-west1-docker.pkg.dev/ihz-contract-checker/b2c-repo/aigateway:latest . --platform linux/amd64 &
PID_AI=$!

docker build --target opscontrol -t europe-west1-docker.pkg.dev/ihz-contract-checker/b2c-repo/opscontrol:latest . --platform linux/amd64 &
PID_OPS=$!

# Wait for all builds to complete
wait $PID_BACKEND
wait $PID_AI
wait $PID_OPS

echo "✅ All builds completed successfully."
echo "☁️  Pushing images to Artifact Registry..."

# Push images
docker push europe-west1-docker.pkg.dev/ihz-contract-checker/b2c-repo/backend:latest
docker push europe-west1-docker.pkg.dev/ihz-contract-checker/b2c-repo/aigateway:latest
docker push europe-west1-docker.pkg.dev/ihz-contract-checker/b2c-repo/opscontrol:latest

echo "✅ All images pushed."
echo "🔄 Restarting deployments in staging..."

# Restart the pods to pull the new images
kubectl rollout restart deployment/backend -n staging
kubectl rollout restart deployment/aigateway -n staging

echo "⏳ Waiting for rollout to complete..."
kubectl rollout status deployment/backend -n staging
kubectl rollout status deployment/aigateway -n staging

echo "🎉 Deployment successful!"
