# NexusDesk - Start All Services
# Run this from the project root: .\start.ps1

$root = $PSScriptRoot

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  SupportIQ - Starting All Services" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# --- ML Service ---
Write-Host "[1/3] Starting ML Service (port 8001)..." -ForegroundColor Yellow
$mlPath = Join-Path $root "ml-service"
$mlVenv = Join-Path $mlPath ".venv\Scripts\python.exe"

if (-not (Test-Path $mlVenv)) {
    Write-Host "  ERROR: ML Service venv not found at $mlVenv" -ForegroundColor Red
    Write-Host "  Run the following first:" -ForegroundColor Red
    Write-Host "    cd ml-service" -ForegroundColor White
    Write-Host "    python -m venv .venv" -ForegroundColor White
    Write-Host "    .venv\Scripts\activate" -ForegroundColor White
    Write-Host "    pip install -r requirements.txt" -ForegroundColor White
    Write-Host "    python training/train.py" -ForegroundColor White
    exit 1
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "
    `$Host.UI.RawUI.WindowTitle = 'SupportIQ - ML Service (port 8001)';
    Write-Host 'ML Service starting...' -ForegroundColor Yellow;
    Set-Location '$mlPath';
    & '$mlVenv' main.py
"

Start-Sleep -Seconds 2

# --- Backend: Seed then Start ---
Write-Host "[2/3] Seeding database and starting Backend API (port 5000)..." -ForegroundColor Yellow
$backendPath = Join-Path $root "backend"

if (-not (Test-Path (Join-Path $backendPath "node_modules"))) {
    Write-Host "  ERROR: Backend node_modules not found." -ForegroundColor Red
    Write-Host "  Run: cd backend && npm install" -ForegroundColor White
    exit 1
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "
    `$Host.UI.RawUI.WindowTitle = 'SupportIQ - Backend API (port 5000)';
    Set-Location '$backendPath';
    Write-Host 'Seeding database...' -ForegroundColor Cyan;
    npm run seed;
    Write-Host 'Backend starting...' -ForegroundColor Green;
    npm run dev
"

Start-Sleep -Seconds 2

# --- Frontend ---
Write-Host "[3/3] Starting Frontend (port 3000)..." -ForegroundColor Yellow
$frontendPath = Join-Path $root "frontend"

if (-not (Test-Path (Join-Path $frontendPath "node_modules"))) {
    Write-Host "  ERROR: Frontend node_modules not found." -ForegroundColor Red
    Write-Host "  Run: cd frontend && npm install" -ForegroundColor White
    exit 1
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "
    `$Host.UI.RawUI.WindowTitle = 'SupportIQ - Frontend (port 3000)';
    Write-Host 'Frontend starting...' -ForegroundColor Magenta;
    Set-Location '$frontendPath';
    npm run dev
"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  All services launched!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:     http://localhost:5000" -ForegroundColor White
Write-Host "  ML Service:  http://localhost:8001" -ForegroundColor White
Write-Host "  ML API Docs: http://localhost:8001/docs" -ForegroundColor White
Write-Host ""
Write-Host "  --- Demo Accounts (password: Password123!) ---" -ForegroundColor DarkCyan
Write-Host "  Admin:          admin@supportiq.dev" -ForegroundColor White
Write-Host "  Agent (Billing): agent.billing@supportiq.dev" -ForegroundColor White
Write-Host "  Agent (Tech):    agent.tech@supportiq.dev" -ForegroundColor White
Write-Host "  Agent (General): agent.general@supportiq.dev" -ForegroundColor White
Write-Host "  Customer:        customer@supportiq.dev" -ForegroundColor White
Write-Host ""
Write-Host "  Close the individual terminal windows to stop each service." -ForegroundColor DarkGray
Write-Host ""
