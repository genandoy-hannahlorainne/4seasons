#!/bin/bash

# Build and Push Docker Images Script
# Usage: ./build-and-push.sh

set -e

# Configuration
DOCKER_USERNAME="notcla"
IMAGE_NAME="4seasons-backend"
TAG="latest"
FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}"

echo "=========================================="
echo "Building Backend Docker Image"
echo "=========================================="

# Build the backend image
docker build -t ${FULL_IMAGE_NAME} ./backend-laravel

echo ""
echo "=========================================="
echo "Build completed successfully!"
echo "Image: ${FULL_IMAGE_NAME}"
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
echo "Pushing image to Docker Hub"
echo "=========================================="

# Push the image
docker push ${FULL_IMAGE_NAME}

echo ""
echo "=========================================="
echo "✓ Image pushed successfully!"
echo "=========================================="
echo ""
echo "To pull on your server, run:"
echo "  docker pull ${FULL_IMAGE_NAME}"
echo ""
echo "To deploy on your server, run:"
echo "  cd ~/4seasons"
echo "  git pull"
echo "  docker-compose -f docker-compose.prod.yml pull"
echo "  docker-compose -f docker-compose.prod.yml up -d"
echo ""
