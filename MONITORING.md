# 📊 Configuración de Monitoreo - Prometheus + Grafana

## ¿Cómo funciona?

```
┌─────────────────────────────────────────────────────┐
│         Tu Sistema de Microservicios                │
│   Auth Service │ Denuncias Service │ Logs Service   │
└──────────┬──────────────┬──────────────┬────────────┘
           │ (exponen /metrics)          │
           └──────────────┬──────────────┘
                          ▼
                    PROMETHEUS (9090)
                   Recolecta métricas
                          │
                          ▼
                      GRAFANA (3001)
                    Visualiza en gráficos
```

---

## ✅ PASO 1: Instala prom-client en cada microservicio

```bash
# En cada microservicio:
npm install prom-client
```

**Verificar:** Todos ya tienen `prom-client` en package.json ✅

---

## ✅ PASO 2: Agrega el middleware de Prometheus

Ya creado en:
- [api-gateway/src/middleware/prometheus.ts](../api-gateway/src/middleware/prometheus.ts)

---

## ✅ PASO 3: Actualiza el index.ts de cada microservicio

Agrega esto al inicio del index.ts:

```typescript
import { prometheusMiddleware, metricsRoute } from './middleware/prometheus';

// ... después de crear app ...

app.use(prometheusMiddleware);  // Middleware ANTES de las rutas
metricsRoute(app);              // Endpoint /metrics

// ... resto de las rutas ...
```

---

## ✅ PASO 4: Levanta con Docker Compose

```bash
cd c:\Users\jhoel\git\voz-segura-system
docker-compose up -d
```

**Verifica que los contenedores estén corriendo:**
```bash
docker-compose ps
```

---

## 📈 ACCEDE A LAS HERRAMIENTAS

### **PROMETHEUS** (Recolecta métricas)
- **URL:** http://localhost:9090
- **Busca:** `http_requests_total` o `http_request_duration_ms`
- **Visualiza:** Gráficos de tus métricas

### **GRAFANA** (Visualiza bonito)
- **URL:** http://localhost:3001
- **Usuario:** admin
- **Contraseña:** admin
- **Dashboard:** "Voz Segura - Microservicios Monitoring" (automáticamente cargado)

---

## 🔧 CONFIGURACIÓN ACTUAL

### Prometheus recolecta de:
- `api-gateway:8000/metrics`
- `auth-service:3001/metrics`
- `denuncias-service:3002/metrics`
- `logs-service:3003/metrics`

### Grafana conecta a:
- `Prometheus http://prometheus:9090`

---

## 📊 MÉTRICAS QUE SE RECOPILAN

1. **http_requests_total** - Total de requests por servicio
2. **http_request_duration_ms** - Tiempo de respuesta
3. **active_connections** - Conexiones activas ahora
4. **Errores 5xx** - Fallos en el servidor

---

## 🎯 DASHBOARDS AUTOMÁTICOS

Grafana carga automáticamente:
- Dashboard: `voz-segura-dashboard.json`
- Gráficos de requests por servicio
- Gráficos de errores
- Duración de respuestas

---

## 🔍 EJEMPLO: Ver métricas manualmente

```bash
# Ver métricas del API Gateway
curl http://localhost:8000/metrics

# Salida:
# http_requests_total{method="POST",path="/api/auth/login",status="200"} 5
# http_request_duration_ms_bucket{le="100",...} 3
```

---

## 🚀 SIGUIENTES PASOS

1. ✅ Instalar dependencias con `npm install`
2. ✅ Levantar con `docker-compose up -d`
3. ✅ Ir a Prometheus: http://localhost:9090
4. ✅ Ir a Grafana: http://localhost:3001
5. ✅ Ver el dashboard automáticamente

---

## ⚠️ SI NO VES MÉTRICAS

1. Verifica que los servicios estén corriendo: `docker ps`
2. Mira los logs: `docker logs auth-service`
3. Intenta acceder a: `http://localhost:3001/metrics` (debe mostrar algo)
4. En Prometheus, busca `up` - debe mostrar todos los servicios en verde

---

## 📝 ARCHIVOS CREADOS

```
monitoring/
├── prometheus/
│   └── prometheus.yml          # Config de Prometheus
└── grafana/
    └── provisioning/
        ├── datasources/
        │   └── prometheus.yaml # Conectar Prometheus
        └── dashboards/
            ├── voz-segura-dashboard.json
            └── dashboard.yaml
```

---

## 💡 RESUMIENDO

- **Prometheus:** Lee `/metrics` de tus servicios cada 15 segundos
- **Grafana:** Muestra esos datos en gráficos bonitos
- **Tu código:** Solo agregó middleware de Prometheus (2-3 líneas)
- **Docker:** Se encarga de orquestar todo

¡Listo para monitoreo profesional! 🎉
