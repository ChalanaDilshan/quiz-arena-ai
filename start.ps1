# Quiz Arena — Start All Services
# Run this from the project root: .\start.ps1
Write-Host "=== Quiz Arena Startup ===" -ForegroundColor Cyan

# --- 1. Python Strands Agents Microservice ---
Write-Host "`n[1/2] Starting Python Strands Agents service..." -ForegroundColor Yellow
$strandsDir = "$PSScriptRoot\server\strands_agents"
$venvPath   = "$strandsDir\.venv"

if (-not (Test-Path "$venvPath\Scripts\python.exe")) {
    Write-Host "  Creating Python virtual environment..."
    python -m venv "$venvPath"
    Write-Host "  Installing Strands dependencies..."
    & "$venvPath\Scripts\pip.exe" install -r "$strandsDir\requirements.txt" --quiet
}

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "& '$venvPath\Scripts\python.exe' -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload"
) -WorkingDirectory $strandsDir -WindowStyle Normal

Write-Host "  Strands service starting on http://127.0.0.1:8001" -ForegroundColor Green

# --- 2. Node.js Express API Gateway ---
Write-Host "`n[2/2] Starting Node.js API gateway..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "node index.js"
) -WorkingDirectory "$PSScriptRoot\server" -WindowStyle Normal
Write-Host "  Node.js gateway starting on http://localhost:3001" -ForegroundColor Green

Write-Host "`n=== All services launched. Run 'npm run dev' separately for the frontend. ===" -ForegroundColor Cyan
