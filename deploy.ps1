# Script para deploying DataPulse a Vercel + Heroku (Windows PowerShell)
# Uso: .\deploy.ps1

Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 DataPulse Deploy Script (Vercel + Heroku)    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Validar repositorio Git
Write-Host "[1/6] Validando repositorio Git..." -ForegroundColor Yellow
try {
    git rev-parse --git-dir > $null 2>&1
} catch {
    Write-Host "❌ No es un repositorio Git" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Git OK" -ForegroundColor Green

# Validar rama
Write-Host "[2/6] Validando rama..." -ForegroundColor Yellow
$CURRENT_BRANCH = git rev-parse --abbrev-ref HEAD
if ($CURRENT_BRANCH -ne "main" -and $CURRENT_BRANCH -ne "master") {
    Write-Host "⚠️  Estás en rama '$CURRENT_BRANCH', asegurate de estar en main/master" -ForegroundColor Yellow
    $response = Read-Host "¿Continuar? (s/n)"
    if ($response -ne "s" -and $response -ne "S") {
        exit 1
    }
}
Write-Host "✅ Rama OK" -ForegroundColor Green

# Build Frontend
Write-Host "[3/6] Compilando Frontend..." -ForegroundColor Yellow
Push-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en build del frontend" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "✅ Frontend build OK" -ForegroundColor Green
Pop-Location

# Build Backend
Write-Host "[4/6] Compilando Backend..." -ForegroundColor Yellow
Push-Location backend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en build del backend" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "✅ Backend build OK" -ForegroundColor Green
Pop-Location

# Git push
Write-Host "[5/6] Push a GitHub..." -ForegroundColor Yellow
$COMMIT_MSG = Read-Host "Descripción del commit"
git add .
git commit -m "$COMMIT_MSG" 2>$null
git push
Write-Host "✅ Push OK" -ForegroundColor Green

# Deploy info
Write-Host "[6/6] Información de deploy..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Green
Write-Host ""
Write-Host "1️⃣  Frontend (Vercel):"
Write-Host "   → Ve a https://vercel.com/new"
Write-Host "   → Selecciona este repo"
Write-Host "   → Root Directory: 'frontend/'"
Write-Host "   → Deploy"
Write-Host ""
Write-Host "2️⃣  Backend (Heroku):"
Write-Host "   → heroku login"
Write-Host "   → heroku create your-app-name-api"
Write-Host "   → heroku config:set MONGODB_URI=... JWT_SECRET=... --app your-app-name-api"
Write-Host "   → git push heroku main"
Write-Host ""
Write-Host "3️⃣  Conectar Frontend con Backend:"
Write-Host "   → Vercel Dashboard → Environment Variables"
Write-Host "   → VITE_API_URL=https://your-backend.herokuapp.com"
Write-Host "   → Redeploy"
Write-Host ""
Write-Host "✅ ¡Listo para deployer!" -ForegroundColor Green
Write-Host ""
