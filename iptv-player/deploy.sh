#!/bin/bash

# Combined build and deployment script for IPTV Player
# This script builds the application, creates Docker image, and deploys to remote server

# Load remote server configuration
REMOTE_SERVER="user@example.com"
if [ -f deploy.sh.user ]; then
    . deploy.sh.user
fi

# Exit on any error
set -e

# Keep track of the last executed command
trap 'last_command=$current_command; current_command=$BASH_COMMAND' DEBUG

# Echo an error message before exiting
trap 'exit_code=$?; if [ $exit_code -ne 0 ]; then echo "The command \"${last_command}\" failed with exit code $exit_code."; fi' EXIT

# Function to check if Docker is available and running
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "Error: Docker is not installed or not in PATH"
        echo "Please install Docker Desktop and ensure WSL integration is enabled"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        echo "Error: Docker daemon is not running"
        echo "Please start Docker Desktop"
        exit 1
    fi
}

# Function to build locally and run
build_and_run_local() {
    echo "=== Building and Running Locally ==="

    # Check Docker availability
    check_docker

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
}

# Function to deploy to remote server
deploy_to_remote() {
    echo "=== Deploying to Remote Server ==="

    # Check Docker availability
    check_docker

    # Create bin directory if it doesn't exist
    echo "Creating bin directory..."
    mkdir -p bin

    # Build single file
    echo "Building single HTML file..."
    yarn build:single

    # Build the Docker image using docker-compose for consistency
    echo "Building Docker image with docker-compose..."
    docker compose build

    # Save the image (note: docker-compose creates image as iptvplayer, not iptv-player)
    echo "Saving Docker image..."
    docker save -o bin/iptvplayer.img iptvplayer

    # Check if the remote server is reachable
    echo "Checking remote server connectivity..."
    if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "$REMOTE_SERVER" exit; then
        echo "Remote server '$REMOTE_SERVER' is not reachable. Exiting."
        echo "Please check your deploy.sh.user file and ensure SSH access is configured."
        exit 1
    fi

    # Copy image to remote server
    echo "Copying image to remote server..."
    scp bin/iptvplayer.img $REMOTE_SERVER:~

    # Deploy on remote server
    echo "Deploying on remote server..."
    ssh $REMOTE_SERVER << 'ENDSSH'

# Remove the running container
echo "Removing the running container..."
docker rm -f iptvplayer 2>/dev/null || true

# Remove the existing image
echo "Removing the existing image..."
docker rmi iptvplayer 2>/dev/null || true

# Load the new image
echo "Loading the new image..."
docker load -i iptvplayer.img

# Deploy the new image to a new container
echo "Deploying the new image to a new container..."
docker run --name iptvplayer --restart unless-stopped --network host -d iptvplayer:latest

# Remove the image file from the remote server
echo "Cleaning up image file..."
rm iptvplayer.img

echo "Deployment completed successfully."

# Check if the container is running
if [ "$(docker ps -q -f name=iptvplayer)" ]; then
    echo "✅ Container is running successfully."
    echo "IPTV Player should be available on port 8643"
else
    echo "❌ Container is NOT running."
    echo "Check container logs with: docker logs iptvplayer"
    exit 1
fi
ENDSSH

    echo ""
    echo "✅ Remote deployment completed successfully!"
    echo "🌐 IPTV Player should be available at your remote server on port 8643"
}

# Main script logic
case "${1:-help}" in
    "local")
        build_and_run_local
        ;;
    "remote")
        deploy_to_remote
        ;;
    "help"|*)
        echo "IPTV Player Deployment Script"
        echo ""
        echo "Usage: $0 [local|remote]"
        echo ""
        echo "Commands:"
        echo "  local   - Build and run locally (equivalent to old build-docker.sh)"
        echo "  remote  - Build and deploy to remote server"
        echo "  help    - Show this help message"
        echo ""
        echo "Configuration:"
        echo "  Edit deploy.sh.user to set REMOTE_SERVER for remote deployment"
        echo ""
        echo "Examples:"
        echo "  $0 local    # Build and run on this machine"
        echo "  $0 remote   # Deploy to remote server"
        ;;
esac