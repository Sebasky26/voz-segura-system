# Script para iniciar todos los servicios localmente
Write-Host "=== Iniciando Sistema Voz Segura ===" -ForegroundColor Green

# Verificar que PostgreSQL esté corriendo
Write-Host "`n[1/6] Verificando PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name postgresql* -ErrorAction SilentlyContinue
if ($null -eq $pgService -or $pgService.Status -ne 'Running') {
    Write-Host "ADVERTENCIA: PostgreSQL no parece estar corriendo." -ForegroundColor Red
    Write-Host "Asegúrate de tener PostgreSQL instalado y corriendo." -ForegroundColor Red
    Write-Host "Puedes instalarlo desde: https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    $continue = Read-Host "¿Continuar de todas formas? (s/n)"
    if ($continue -ne 's') {
        exit
    }
}

# Crear bases de datos si no existen
Write-Host "`n[2/6] Creando bases de datos..." -ForegroundColor Yellow
$env:PGPASSWORD = "postgres"
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'auth_db'" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    psql -U postgres -c "CREATE DATABASE auth_db;" 2>$null
}
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'denuncias_db'" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    psql -U postgres -c "CREATE DATABASE denuncias_db;" 2>$null
}
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'logs_db'" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    psql -U postgres -c "CREATE DATABASE logs_db;" 2>$null
}

# Ejecutar migraciones de Prisma
Write-Host "`n[3/6] Ejecutando migraciones de Prisma..." -ForegroundColor Yellow

Write-Host "  - Auth Service..." -ForegroundColor Cyan
Set-Location "microservices\auth-service"
npx prisma migrate deploy
npx prisma generate
Set-Location "..\..\"

Write-Host "  - Denuncias Service..." -ForegroundColor Cyan
Set-Location "microservices\denuncias-service"
npx prisma migrate deploy
npx prisma generate
Set-Location "..\..\"

Write-Host "  - Logs Service..." -ForegroundColor Cyan
Set-Location "microservices\logs-service"
npx prisma migrate deploy
npx prisma generate
Set-Location "..\..\"

# Compilar TypeScript
Write-Host "`n[4/6] Compilando TypeScript..." -ForegroundColor Yellow

Write-Host "  - Auth Service..." -ForegroundColor Cyan
Set-Location "microservices\auth-service"
npm run build
Set-Location "..\..\"

Write-Host "  - Denuncias Service..." -ForegroundColor Cyan
Set-Location "microservices\denuncias-service"
npm run build
Set-Location "..\..\"

Write-Host "  - Logs Service..." -ForegroundColor Cyan
Set-Location "microservices\logs-service"
npm run build
Set-Location "..\..\"

Write-Host "  - API Gateway..." -ForegroundColor Cyan
Set-Location "api-gateway"
npm run build
Set-Location "..\"

# Iniciar servicios en segundo plano
Write-Host "`n[5/6] Iniciando servicios..." -ForegroundColor Yellow

Write-Host "  - Auth Service (puerto 3001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\microservices\auth-service'; npm start"

Start-Sleep -Seconds 2

Write-Host "  - Denuncias Service (puerto 3002)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\microservices\denuncias-service'; npm start"

Start-Sleep -Seconds 2

Write-Host "  - Logs Service (puerto 3003)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\microservices\logs-service'; npm start"

Start-Sleep -Seconds 2

Write-Host "  - API Gateway (puerto 8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\api-gateway'; npm start"

Start-Sleep -Seconds 3

# Iniciar frontend
Write-Host "`n[6/6] Iniciando Frontend (puerto 3000)..." -ForegroundColor Yellow
Set-Location "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
Set-Location "..\"

Write-Host "`n=== Sistema iniciado correctamente ===" -ForegroundColor Green
Write-Host "`nServicios disponibles:" -ForegroundColor Cyan
Write-Host "  - Frontend:        http://localhost:3000" -ForegroundColor White
Write-Host "  - API Gateway:     http://localhost:8000" -ForegroundColor White
Write-Host "  - Auth Service:    http://localhost:3001" -ForegroundColor White
Write-Host "  - Denuncias:       http://localhost:3002" -ForegroundColor White
Write-Host "  - Logs:            http://localhost:3003" -ForegroundColor White
Write-Host "`nPresiona Ctrl+C en cada ventana para detener los servicios" -ForegroundColor Yellow
