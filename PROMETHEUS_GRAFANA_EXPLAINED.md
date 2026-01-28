# 📊 PROMETHEUS + GRAFANA - EXPLICACIÓN SIMPLE

## ¿QUÉ ES PROMETHEUS?

Es una base de datos que recolecta **métricas** (datos sobre tu sistema):
- Cuántos requests por segundo recibe cada servicio
- Cuánto tiempo tarda responder
- Cuántos errores hay
- Cuántas conexiones activas hay

**Ejemplo de métrica:**
```
http_requests_total{service="auth-service", status="200"} 152
↑ Nombre métrica    ↑ Etiquetas (labels)                 ↑ Valor
```

---

## ¿QUÉ ES GRAFANA?

Es una herramienta de **visualización**. Toma los datos de Prometheus y los convierte en gráficos bonitos.

**Sin Grafana (Prometheus raw):**
```
http_requests_total{method="POST",path="/auth/login",status="200"} 5.0
http_requests_total{method="POST",path="/auth/login",status="400"} 1.0
http_requests_total{method="GET",path="/health",status="200"} 10.0
```

**Con Grafana (Dashboard):**
```
┌─────────────────────────────────────────┐
│  Requests por Minuto                    │
│  ┃                                      │
│  ┃     ┏━━━┓                            │
│  ┃     ┃   ┃                            │
│  ┃  ┏━━┛   ┗━━┓                         │
│  ┃  ┃         ┃                         │
│  ┗━━┛         ┗━━━━━━━━━━━━━━━━━━━━━   │
│  └─────────────────────────────────────│
└─────────────────────────────────────────┘
```

---

## FLUJO COMPLETO

```
┌────────────────────────────────────────────────────────┐
│ 1. Tu usuario hace login en http://localhost:3000      │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ 2. Frontend envía POST a http://localhost:8000/login   │
│    (API Gateway)                                       │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ 3. API Gateway proxea a Auth Service:3001              │
│    - Middleware Prometheus INTERCEPTA el request        │
│    - Registra: método, ruta, status, duración          │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ 4. Response vuelve al frontend (200 OK)               │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ 5. Prometheus (cada 15 segundos):                      │
│    GET http://localhost:8000/metrics                   │
│    GET http://localhost:3001/metrics                   │
│    GET http://localhost:3002/metrics                   │
│    GET http://localhost:3003/metrics                   │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ 6. Prometheus guarda las métricas en su BD            │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ 7. Grafana (tiempo real):                              │
│    SELECT * FROM prometheus WHERE timestamp > now-1m   │
│    Dibuja gráficos bonitos                             │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│ 8. Abres http://localhost:3001 y ves dashboards        │
│    Ves cuántos requests se hicieron, cuánto tardaron   │
└────────────────────────────────────────────────────────┘
```

---

## MÉTRICAS QUE SE RECOPILAN

### 1. **http_requests_total** (Contador)
```
Cuántos requests totales se han hecho
Etiquetas: method, path, status

Ejemplo:
http_requests_total{method="POST",path="/auth/login",status="200"} 5
→ 5 logins exitosos
```

### 2. **http_request_duration_seconds** (Histograma)
```
Cuánto tiempo tarda responder
Etiquetas: method, path, status

Ejemplo:
http_request_duration_seconds_bucket{le="0.1",method="POST",...} 3
→ 3 requests respondieron en menos de 100ms
```

### 3. **active_connections** (Gauge)
```
Cuántas conexiones hay AHORA

Ejemplo:
active_connections 12
→ En este momento hay 12 conexiones activas
```

---

## CÓMO USARLO EN LA PRÁCTICA

### Paso 1: Levantar el sistema
```bash
docker-compose up -d
```

### Paso 2: Ir a Prometheus (http://localhost:9090)
```
1. Haz clic en la barra de búsqueda
2. Escribe: http_requests_total
3. Haz clic en "Execute"
4. Verás todas las métricas que se están recopilando
```

### Paso 3: Ir a Grafana (http://localhost:3001)
```
1. Usuario: admin
2. Contraseña: admin
3. Verás automáticamente el dashboard "Voz Segura"
4. Ves gráficos de requests, errores, duración, etc.
```

---

## EJEMPLO DE QUERY EN PROMETHEUS

**¿Cuántos requests por segundo está recibiendo el API Gateway?**
```prometheus
rate(http_requests_total{job="api-gateway"}[1m])
```

**¿Cuál es el tiempo promedio de respuesta del Auth Service?**
```prometheus
rate(http_request_duration_seconds_sum{job="auth-service"}[5m]) /
rate(http_request_duration_seconds_count{job="auth-service"}[5m])
```

---

## INFORMACIÓN CLAVE

| Elemento | Puerto | URL | Usuario | Contraseña |
|----------|--------|-----|---------|-----------|
| Frontend | 3000 | http://localhost:3000 | N/A | N/A |
| API Gateway | 8000 | http://localhost:8000 | N/A | N/A |
| Auth Service | 3001 | http://localhost:3001 | N/A | N/A |
| Denuncias Service | 3002 | http://localhost:3002 | N/A | N/A |
| Logs Service | 3003 | http://localhost:3003 | N/A | N/A |
| **Prometheus** | **9090** | **http://localhost:9090** | **N/A** | **N/A** |
| **Grafana** | **3001** | **http://localhost:3001** | **admin** | **admin** |

---

## 🎯 RESUMEN

1. **Prometheus** = Recolector de datos (métricas)
2. **Grafana** = Visualizador de datos (gráficos)
3. **Tu código** = Solo 2-3 líneas de middleware
4. **Docker** = Orquesta todo automáticamente

¡Eso es todo! Ahora tienes monitoreo profesional. 🚀
