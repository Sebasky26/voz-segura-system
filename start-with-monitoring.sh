#!/bin/bash
# Script para levantar el sistema completo con Prometheus + Grafana

echo "🚀 Iniciando Voz Segura con Monitoreo..."
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi

echo "📦 Levantando servicios..."
docker-compose up -d

echo ""
echo "⏳ Esperando a que los servicios se inicien..."
sleep 10

echo ""
echo "✅ SERVICIOS INICIADOS!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 APLICACIÓN:"
echo "  Frontend:      http://localhost:3000"
echo "  API Gateway:   http://localhost:8000"
echo ""
echo "🔒 MICROSERVICIOS:"
echo "  Auth Service:       http://localhost:3001"
echo "  Denuncias Service:  http://localhost:3002"
echo "  Logs Service:       http://localhost:3003"
echo ""
echo "📊 MONITOREO:"
echo "  Prometheus:  http://localhost:9090"
echo "  Grafana:     http://localhost:3001"
echo ""
echo "  Usuario:  admin"
echo "  Contraseña: admin"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 PASOS SIGUIENTES:"
echo "  1. Abre http://localhost:3000 para ver la aplicación"
echo "  2. Abre http://localhost:9090 para ver métricas en Prometheus"
echo "  3. Abre http://localhost:3001 para ver dashboards en Grafana"
echo "  4. Genera tráfico: haz login, crea denuncias"
echo "  5. Observa las métricas en tiempo real"
echo ""
echo "📚 Más información:"
echo "  Ver: MONITORING.md"
echo ""
