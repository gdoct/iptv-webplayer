#!/bin/bash

# Build and run the IPTV Player Docker container

set -e  # Exit on error

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH"
    echo "Please install Docker Desktop and ensure WSL integration is enabled"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "Error: Docker daemon is not running"
    echo "Please start Docker Desktop"
    exit 1
fi

echo "Building single HTML file..."
yarn build:single

echo "Building IPTV Player Docker image..."
docker build -t iptvplayer .

echo "Stopping and removing any existing container..."
docker stop iptvplayer 2>/dev/null || true
docker rm iptvplayer 2>/dev/null || true

echo "Running IPTV Player container with host networking on port 8643..."
docker run -d --name iptvplayer --network host iptvplayer

echo ""
echo "✅ IPTV Player is now available at http://localhost:8643"
echo ""
echo "Useful commands:"
echo "  Stop container:   docker stop iptvplayer"
echo "  Remove container: docker rm iptvplayer"
echo "  View logs:        docker logs iptvplayer"
echo "  Check status:     docker ps"