<#
 =============================================================================
 Amazon Bedrock AgentCore — Deployment Automation Script (PowerShell)
 =============================================================================
#>
param(
    [string]$Region = $env:AWS_REGION,
    [string]$Tag = "v1.0.0"
)

if (-not $Region) { $Region = "us-east-1" }
$AppName = "quiz-arena-strands-agents"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Deploying Quiz Arena Strands Agents to Amazon Bedrock AgentCore " -ForegroundColor Cyan
Write-Host " Region:    $Region" -ForegroundColor Cyan
Write-Host " Image Tag: $Tag" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. AWS Credentials
Write-Host "[1/4] Verifying AWS credentials..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    $AccountId = $identity.Account
    Write-Host "Authenticated as AWS Account: $AccountId" -ForegroundColor Green
} catch {
    Write-Error "Failed to authenticate with AWS. Please run 'aws configure' or set AWS environment variables."
    exit 1
}

# 2. ECR Repository
Write-Host "[2/4] Ensuring ECR repository exists..." -ForegroundColor Yellow
$repoCheck = aws ecr describe-repositories --repository-names $AppName --region $Region 2>$null
if (-not $repoCheck) {
    aws ecr create-repository --repository-name $AppName --region $Region | Out-Null
}
$EcrUri = "$AccountId.dkr.ecr.$Region.amazonaws.com/$AppName"

# 3. Docker Build & Push
Write-Host "[3/4] Building and pushing AgentCore container..." -ForegroundColor Yellow
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin "$AccountId.dkr.ecr.$Region.amazonaws.com"
docker build -f Dockerfile.agentcore -t "$EcrUri`:$Tag" -t "$EcrUri`:latest" .
docker push "$EcrUri`:$Tag"
docker push "$EcrUri`:latest"

# 4. AgentCore CLI Deploy
Write-Host "[4/4] Deploying to Bedrock AgentCore Runtime..." -ForegroundColor Yellow
if (Get-Command agentcore -ErrorAction SilentlyContinue) {
    agentcore deploy --config agentcore.yaml --region $Region
} else {
    Write-Host "Tip: Install @aws/agentcore for automated one-click deployments:" -ForegroundColor Yellow
    Write-Host "  npm install -g @aws/agentcore"
    Write-Host "  agentcore deploy --config agentcore.yaml --region $Region"
}

Write-Host "=================================================================" -ForegroundColor Green
Write-Host " Strands Agents successfully packaged for Bedrock AgentCore! " -ForegroundColor Green
Write-Host " Container Image: $EcrUri`:$Tag" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
