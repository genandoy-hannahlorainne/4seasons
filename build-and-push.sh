#!/bin/bash

# Build and Push Docker Images Script
# Usage: ./build-and-push.sh

set -e

# Configuration
DOCKER_USERNAME="notcla"
BACKEND_IMAGE="4seasons-backend"
FRONTEND_IMAGE="4seasons-frontend"
TAG="latest"

echo "=========================================="
echo "Building Backend Docker Image"
echo "=========================================="

# Build the backend image
docker build -t ${DOCKER_USERNAME}/${BACKEND_IMAGE}:${TAG} ./backend-laravel

echo ""
echo "=========================================="
echo "Building Frontend Docker Image"
echo "=========================================="

# Build the frontend image
docker build -t ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${TAG} ./frontend

echo ""
echo "=========================================="
echo "Build completed successfully!"
echo "Backend: ${DOCKER_USERNAME}/${BACKEND_IMAGE}:${TAG}"
echo "Frontend: ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${TAG}"
echo "=========================================="

# Check if user is logged in to Docker Hub
echo ""
echo "Checking Docker Hub authentication..."
if ! docker info | grep -q "Username"; then
    echo "Not logged in to Docker Hub. Please login:"
    docker login
fi

echo ""
echo "=========================================="
echo "Pushing images to Docker Hub"
echo "=========================================="

# Push the images
docker push ${DOCKER_USERNAME}/${BACKEND_IMAGE}:${TAG}
docker push ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:${TAG}

echo ""
echo "=========================================="
echo "✓ Images pushed successfully!"
echo "=========================================="
echo ""
echo "To deploy on your server, run:"
echo "  cd ~/4seasons"
echo "  docker compose -f docker-compose.prod.yml pull"
echo "  docker compose -f docker-compose.prod.yml up -d"
echo ""

