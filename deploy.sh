#!/bin/bash

# Script para deploying DataPulse a Vercel + Heroku
# Uso: ./deploy.sh

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║  🚀 DataPulse Deploy Script (Vercel + Heroku)    ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validar repositorio Git
echo -e "${YELLOW}[1/6]${NC} Validando repositorio Git..."
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ No es un repositorio Git${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Git OK${NC}"

# Validar rama main
echo -e "${YELLOW}[2/6]${NC} Validando rama..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo -e "${YELLOW}⚠️  Estás en rama '$CURRENT_BRANCH', asegurate de estar en main/master${NC}"
    read -p "¿Continuar? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi
echo -e "${GREEN}✅ Rama OK${NC}"

# Build Frontend
echo -e "${YELLOW}[3/6]${NC} Compilando Frontend..."
cd frontend
npm run build
echo -e "${GREEN}✅ Frontend build OK${NC}"
cd ..

# Build Backend
echo -e "${YELLOW}[4/6]${NC} Compilando Backend..."
cd backend
npm run build
echo -e "${GREEN}✅ Backend build OK${NC}"
cd ..

# Git push
echo -e "${YELLOW}[5/6]${NC} Push a GitHub..."
read -p "Descripción del commit: " COMMIT_MSG
git add .
git commit -m "$COMMIT_MSG" || true
git push
echo -e "${GREEN}✅ Push OK${NC}"

# Deploy info
echo -e "${YELLOW}[6/6]${NC} Información de deploy..."
echo ""
echo -e "${GREEN}📝 Próximos pasos:${NC}"
echo ""
echo "1️⃣  Frontend (Vercel):"
echo "   → Ve a https://vercel.com/new"
echo "   → Selecciona este repo"
echo "   → Root Directory: 'frontend/'"
echo "   → Deploy"
echo ""
echo "2️⃣  Backend (Heroku):"
echo "   → heroku create your-app-name-api"
echo "   → heroku config:set MONGODB_URI=... JWT_SECRET=... --app your-app-name-api"
echo "   → git push heroku main"
echo ""
echo "3️⃣  Conectar Frontend con Backend:"
echo "   → Vercel Dashboard → Environment Variables"
echo "   → VITE_API_URL=https://your-backend.herokuapp.com"
echo "   → Redeploy"
echo ""
echo -e "${GREEN}✅ ¡Listo para deployer!${NC}"
echo ""

import LoginPage from './pages/auth/LoginPage';  // ✅ ARCHIVO CORRECTO
