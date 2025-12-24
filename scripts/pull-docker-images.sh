#!/bin/bash

# Script to pre-pull Docker images to avoid timeout issues during build
# This helps when Docker Hub connectivity is slow or unreliable

set -e

echo "🚀 Pre-pulling Docker images to avoid build timeouts..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to pull image with retry
pull_with_retry() {
    local image=$1
    local max_attempts=3
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        echo -e "${YELLOW}Attempt $attempt/$max_attempts: Pulling $image...${NC}"

        if docker pull "$image"; then
            echo -e "${GREEN}✓ Successfully pulled $image${NC}"
            return 0
        else
            echo -e "${RED}✗ Failed to pull $image (attempt $attempt/$max_attempts)${NC}"
            if [ $attempt -lt $max_attempts ]; then
                echo "Waiting 10 seconds before retry..."
                sleep 10
            fi
            attempt=$((attempt + 1))
        fi
    done

    echo -e "${RED}✗ Failed to pull $image after $max_attempts attempts${NC}"
    return 1
}

# List of images to pull
IMAGES=(
    "node:18-alpine"
    "postgres:15-alpine"
    "rabbitmq:3-management-alpine"
    "redis:7-alpine"
)

# Pull each image
failed_images=()
for image in "${IMAGES[@]}"; do
    if ! pull_with_retry "$image"; then
        failed_images+=("$image")
    fi
done

# Summary
echo ""
echo "=========================================="
if [ ${#failed_images[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All images pulled successfully!${NC}"
    exit 0
else
    echo -e "${RED}✗ Failed to pull ${#failed_images[@]} image(s):${NC}"
    for img in "${failed_images[@]}"; do
        echo -e "  - $img"
    done
    echo ""
    echo "You can try running this script again, or manually pull the images:"
    for img in "${failed_images[@]}"; do
        echo "  docker pull $img"
    done
    exit 1
fi

