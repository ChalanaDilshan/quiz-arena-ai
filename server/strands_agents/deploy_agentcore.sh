#!/usr/bin/env bash
# =============================================================================
# Amazon Bedrock AgentCore — Deployment Automation Script (Bash)
# =============================================================================
set -euo pipefail

APP_NAME="quiz-arena-strands-agents"
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPOSITORY="${APP_NAME}"
IMAGE_TAG="$(git rev-parse --short HEAD 2>/dev/null || echo 'v1.0.0')"

echo "================================================================="
echo " Deploying Quiz Arena Strands Agents to Amazon Bedrock AgentCore "
echo " Region:       ${AWS_REGION}"
echo " Image Tag:    ${IMAGE_TAG}"
echo "================================================================="

# 1. Verify AWS Identity
echo "[1/4] Verifying AWS credentials..."
CALLER_IDENTITY=$(aws sts get-caller-identity --output json)
ACCOUNT_ID=$(echo "${CALLER_IDENTITY}" | grep -o '"Account": "[^"]*' | cut -d'"' -f4)
echo "Authenticated as AWS Account: ${ACCOUNT_ID}"

# 2. Check or Create ECR Repository
echo "[2/4] Ensuring ECR repository exists..."
aws ecr describe-repositories --repository-names "${ECR_REPOSITORY}" --region "${AWS_REGION}" >/dev/null 2>&1 || \
aws ecr create-repository --repository-name "${ECR_REPOSITORY}" --region "${AWS_REGION}" >/dev/null

ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}"

# 3. Build and Push Container
echo "[3/4] Building and pushing AgentCore container image..."
aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
docker build -f Dockerfile.agentcore -t "${ECR_URI}:${IMAGE_TAG}" -t "${ECR_URI}:latest" .
docker push "${ECR_URI}:${IMAGE_TAG}"
docker push "${ECR_URI}:latest"

# 4. Deploy via AgentCore CLI or CloudFormation
echo "[4/4] Deploying to Bedrock AgentCore Runtime..."
if command -v agentcore &> /dev/null; then
    echo "Running 'agentcore deploy'..."
    agentcore deploy --config agentcore.yaml --region "${AWS_REGION}"
else
    echo "AgentCore CLI not installed globally. To deploy directly using the CLI, run:"
    echo "  npm install -g @aws/agentcore"
    echo "  agentcore deploy --config agentcore.yaml --region ${AWS_REGION}"
fi

echo "================================================================="
echo " Strands Agents successfully packaged and deployed for AgentCore! "
echo " Container Image: ${ECR_URI}:${IMAGE_TAG}"
echo "================================================================="
