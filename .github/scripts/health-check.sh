#!/bin/bash

# ========================================
# CI/CD Health Check Script
# Verifica el estado del pipeline de CI/CD
# ========================================

set -e

COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_BLUE='\033[0;34m'
COLOR_RESET='\033[0m'

echo -e "${COLOR_BLUE}========================================${COLOR_RESET}"
echo -e "${COLOR_BLUE}🔍 Voz Segura - CI/CD Health Check${COLOR_RESET}"
echo -e "${COLOR_BLUE}========================================${COLOR_RESET}"
echo ""

# ========================================
# 1. Verificar estructura de archivos
# ========================================
echo -e "${COLOR_BLUE}📁 Verificando estructura de workflows...${COLOR_RESET}"

REQUIRED_FILES=(
  ".github/workflows/ci.yml"
  ".github/workflows/docker-build-push.yml"
  ".github/workflows/deploy.yml"
  ".github/workflows/security.yml"
  ".github/workflows/pr-checks.yml"
  ".github/dependabot.yml"
  ".github/labeler.yml"
)

MISSING_FILES=0
for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "  ${COLOR_GREEN}✓${COLOR_RESET} $file"
  else
    echo -e "  ${COLOR_RED}✗${COLOR_RESET} $file ${COLOR_RED}(missing)${COLOR_RESET}"
    MISSING_FILES=$((MISSING_FILES + 1))
  fi
done

if [ $MISSING_FILES -eq 0 ]; then
  echo -e "${COLOR_GREEN}✅ Todos los archivos de workflow presentes${COLOR_RESET}"
else
  echo -e "${COLOR_RED}❌ Faltan $MISSING_FILES archivo(s) de workflow${COLOR_RESET}"
fi
echo ""

# ========================================
# 2. Verificar sintaxis de YAML
# ========================================
echo -e "${COLOR_BLUE}📝 Verificando sintaxis de YAML...${COLOR_RESET}"

if command -v yamllint &> /dev/null; then
  for file in .github/workflows/*.yml .github/*.yml; do
    if [ -f "$file" ]; then
      if yamllint -d relaxed "$file" &> /dev/null; then
        echo -e "  ${COLOR_GREEN}✓${COLOR_RESET} $file"
      else
        echo -e "  ${COLOR_YELLOW}⚠${COLOR_RESET} $file ${COLOR_YELLOW}(tiene warnings)${COLOR_RESET}"
      fi
    fi
  done
else
  echo -e "  ${COLOR_YELLOW}⚠ yamllint no instalado, saltando verificación${COLOR_RESET}"
  echo -e "  Instalar con: ${COLOR_BLUE}pip install yamllint${COLOR_RESET}"
fi
echo ""

# ========================================
# 3. Verificar Dockerfiles
# ========================================
echo -e "${COLOR_BLUE}🐳 Verificando Dockerfiles...${COLOR_RESET}"

DOCKERFILES=(
  "microservices/auth-service/Dockerfile"
  "microservices/denuncias-service/Dockerfile"
  "microservices/logs-service/Dockerfile"
  "api-gateway/Dockerfile"
  "frontend/Dockerfile"
  "load-balancer/Dockerfile"
)

MISSING_DOCKERFILES=0
for dockerfile in "${DOCKERFILES[@]}"; do
  if [ -f "$dockerfile" ]; then
    echo -e "  ${COLOR_GREEN}✓${COLOR_RESET} $dockerfile"
  else
    echo -e "  ${COLOR_RED}✗${COLOR_RESET} $dockerfile ${COLOR_RED}(missing)${COLOR_RESET}"
    MISSING_DOCKERFILES=$((MISSING_DOCKERFILES + 1))
  fi
done

if [ $MISSING_DOCKERFILES -eq 0 ]; then
  echo -e "${COLOR_GREEN}✅ Todos los Dockerfiles presentes${COLOR_RESET}"
else
  echo -e "${COLOR_RED}❌ Faltan $MISSING_DOCKERFILES Dockerfile(s)${COLOR_RESET}"
fi
echo ""

# ========================================
# 4. Verificar package.json
# ========================================
echo -e "${COLOR_BLUE}📦 Verificando package.json...${COLOR_RESET}"

PACKAGES=(
  "microservices/auth-service/package.json"
  "microservices/denuncias-service/package.json"
  "microservices/logs-service/package.json"
  "api-gateway/package.json"
  "frontend/package.json"
)

MISSING_PACKAGES=0
for package in "${PACKAGES[@]}"; do
  if [ -f "$package" ]; then
    # Verificar que tenga scripts de test y lint
    if grep -q '"test":' "$package" && grep -q '"lint":' "$package"; then
      echo -e "  ${COLOR_GREEN}✓${COLOR_RESET} $package (con test y lint)"
    else
      echo -e "  ${COLOR_YELLOW}⚠${COLOR_RESET} $package ${COLOR_YELLOW}(falta test o lint)${COLOR_RESET}"
    fi
  else
    echo -e "  ${COLOR_RED}✗${COLOR_RESET} $package ${COLOR_RED}(missing)${COLOR_RESET}"
    MISSING_PACKAGES=$((MISSING_PACKAGES + 1))
  fi
done

if [ $MISSING_PACKAGES -eq 0 ]; then
  echo -e "${COLOR_GREEN}✅ Todos los package.json presentes${COLOR_RESET}"
else
  echo -e "${COLOR_RED}❌ Faltan $MISSING_PACKAGES package.json${COLOR_RESET}"
fi
echo ""

# ========================================
# 5. Verificar Git
# ========================================
echo -e "${COLOR_BLUE}🌿 Verificando configuración Git...${COLOR_RESET}"

CURRENT_BRANCH=$(git branch --show-current)
echo -e "  Rama actual: ${COLOR_YELLOW}$CURRENT_BRANCH${COLOR_RESET}"

UNCOMMITTED=$(git status --porcelain | wc -l | tr -d ' ')
if [ "$UNCOMMITTED" -eq 0 ]; then
  echo -e "  ${COLOR_GREEN}✓${COLOR_RESET} No hay cambios sin commitear"
else
  echo -e "  ${COLOR_YELLOW}⚠${COLOR_RESET} Hay $UNCOMMITTED archivo(s) sin commitear"
fi

REMOTE=$(git remote -v | grep origin | head -1 | awk '{print $2}')
echo -e "  Remoto: ${COLOR_BLUE}$REMOTE${COLOR_RESET}"
echo ""

# ========================================
# 6. Verificar GitHub CLI
# ========================================
echo -e "${COLOR_BLUE}🔧 Verificando herramientas...${COLOR_RESET}"

if command -v gh &> /dev/null; then
  echo -e "  ${COLOR_GREEN}✓${COLOR_RESET} GitHub CLI (gh) instalado"
  
  if gh auth status &> /dev/null; then
    echo -e "  ${COLOR_GREEN}✓${COLOR_RESET} GitHub CLI autenticado"
  else
    echo -e "  ${COLOR_YELLOW}⚠${COLOR_RESET} GitHub CLI no autenticado"
    echo -e "    Ejecutar: ${COLOR_BLUE}gh auth login${COLOR_RESET}"
  fi
else
  echo -e "  ${COLOR_YELLOW}⚠${COLOR_RESET} GitHub CLI (gh) no instalado"
  echo -e "    Instalar: ${COLOR_BLUE}https://cli.github.com/${COLOR_RESET}"
fi

if command -v docker &> /dev/null; then
  echo -e "  ${COLOR_GREEN}✓${COLOR_RESET} Docker instalado"
else
  echo -e "  ${COLOR_RED}✗${COLOR_RESET} Docker no instalado"
fi

if command -v docker-compose &> /dev/null; then
  echo -e "  ${COLOR_GREEN}✓${COLOR_RESET} Docker Compose instalado"
else
  echo -e "  ${COLOR_RED}✗${COLOR_RESET} Docker Compose no instalado"
fi
echo ""

# ========================================
# 7. Resumen final
# ========================================
echo -e "${COLOR_BLUE}========================================${COLOR_RESET}"
echo -e "${COLOR_BLUE}📊 Resumen${COLOR_RESET}"
echo -e "${COLOR_BLUE}========================================${COLOR_RESET}"

TOTAL_ISSUES=$((MISSING_FILES + MISSING_DOCKERFILES + MISSING_PACKAGES))

if [ $TOTAL_ISSUES -eq 0 ]; then
  echo -e "${COLOR_GREEN}✅ El proyecto está listo para CI/CD${COLOR_RESET}"
  echo ""
  echo -e "${COLOR_BLUE}Próximos pasos:${COLOR_RESET}"
  echo -e "  1. Hacer commit de los archivos de workflow"
  echo -e "  2. Push a la rama microservicios"
  echo -e "  3. Verificar workflows en GitHub Actions"
  echo -e "  4. Configurar secrets necesarios"
else
  echo -e "${COLOR_YELLOW}⚠️  Hay $TOTAL_ISSUES problema(s) que corregir${COLOR_RESET}"
  echo -e "${COLOR_YELLOW}Por favor revisa los mensajes anteriores${COLOR_RESET}"
fi

echo ""
echo -e "${COLOR_BLUE}========================================${COLOR_RESET}"
