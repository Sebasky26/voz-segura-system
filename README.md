# 🔒 Voz Segura - Sistema de Denuncias Anónimas

## Arquitectura de Microservicios v2.0

**Institución:** Escuela Politécnica Nacional  
**Facultad:** Ingeniería de Sistemas  
**Materia:** Aplicaciones Web Avanzadas  
**Grupo:** 7  
**Integrantes:**
- Sebastian Aisalla
- Jhoel Narváez  
- Francis Velastegui

---

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Ejecución Local](#ejecución-local)
- [Usuarios de Prueba](#usuarios-de-prueba)
- [API Endpoints](#api-endpoints)
- [Monitoreo con Prometheus y Grafana](#-monitoreo-con-prometheus-y-grafana)
- [Características](#características)

---

## 📝 Descripción

**Voz Segura** es un sistema de denuncias anónimas refactorizado de arquitectura monolítica a microservicios. Permite:
- Crear denuncias anónimas de forma segura
- Gestionar denuncias por supervisores asignados
- Administrar usuarios y reglas de asignación
- Registrar logs de auditoría de todas las acciones

El sistema garantiza el anonimato del denunciante mediante códigos únicos de seguimiento.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (Next.js - Puerto 3000)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API GATEWAY                                │
│                    (Express - Puerto 8000)                       │
│         Enrutamiento, Autenticación, Rate Limiting               │
└─────────────────────────────────────────────────────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  AUTH SERVICE   │ │DENUNCIAS SERVICE│ │  LOGS SERVICE   │
│  (Puerto 3001)  │ │  (Puerto 3002)  │ │  (Puerto 3003)  │
│                 │ │                 │ │                 │
│ • Login/Registro│ │ • CRUD Denuncias│ │ • Auditoría     │
│ • JWT Tokens    │ │ • Evidencias    │ │ • Métricas      │
│ • Gestión Users │ │ • Asignación    │ │ • Configuración │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   PostgreSQL    │ │   PostgreSQL    │ │   PostgreSQL    │
│    auth_db      │ │  denuncias_db   │ │    logs_db      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Patrones Implementados
- **API Gateway Pattern:** Punto de entrada único con routing inteligente
- **Database per Service:** Cada microservicio tiene su propia base de datos

---

## 🛠️ Tecnologías

### Backend
| Tecnología | Uso |
|------------|-----|
| Node.js | Runtime de JavaScript |
| Express.js | Framework web |
| TypeScript | Tipado estático |
| Prisma ORM | Acceso a base de datos |
| PostgreSQL | Base de datos relacional |
| JWT | Autenticación con tokens |
| bcrypt | Encriptación de contraseñas |
| http-proxy-middleware | Proxy para API Gateway |

### Frontend
| Tecnología | Uso |
|------------|-----|
| Next.js 15 | Framework React con App Router |
| React 19 | Librería de UI |
| TypeScript | Tipado estático |
| Tailwind CSS 4 | Estilos utilitarios |

---

## 📁 Estructura del Proyecto

```
voz-segura-system-2/
├── api-gateway/                 # API Gateway - Punto de entrada único
│   ├── src/
│   │   ├── index.ts            # Configuración principal
│   │   ├── middleware/         # Middlewares (auth, rate-limit)
│   │   └── routes/             # Rutas y proxy configuration
│   ├── .env
│   └── package.json
│
├── microservices/
│   ├── auth-service/           # Servicio de Autenticación (Puerto 3001)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   └── middleware/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── package.json
│   │
│   ├── denuncias-service/      # Servicio de Denuncias (Puerto 3002)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── routes/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── package.json
│   │
│   └── logs-service/           # Servicio de Logs (Puerto 3003)
│       ├── src/
│       │   ├── index.ts
│       │   └── routes/
│       ├── prisma/
│       │   └── schema.prisma
│       └── package.json
│
├── frontend/                    # Aplicación Frontend (Puerto 3000)
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── dashboard/
│   │   │   ├── denuncias/
│   │   │   │   ├── crear/
│   │   │   │   └── [id]/
│   │   │   │       └── editar/
│   │   │   └── layout.tsx
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── lib/
│   │   └── apiClient.ts
│   └── package.json
│
└── README.md
```

---

## ⚙️ Requisitos Previos

1. **Node.js** v18 o superior
2. **PostgreSQL** v14 o superior (corriendo localmente)
3. **npm** o **yarn**

4. **Docker Desktop** (para monitoreo con Prometheus/Grafana)

### Instalar Docker Desktop (Windows)

Si aún no tienes Docker instalado:

1. Descargar desde: https://www.docker.com/products/docker-desktop
2. Instalar siguiendo el asistente
3. Reiniciar la computadora
4. Verificar la instalación:
   ```bash
   docker --version
   docker-compose --version
   ```

**Nota:** Si Docker no aparece en tu PATH después de instalarlo, agrega manualmente:
```powershell
# En PowerShell como Administrador:
$dockerPath = "C:\Program Files\Docker\Docker\resources\bin"
[Environment]::SetEnvironmentVariable("Path", "$([Environment]::GetEnvironmentVariable('Path', 'Machine'));$dockerPath", "Machine")
# Reinicia PowerShell o la computadora
```

### Crear las bases de datos en PostgreSQL

Ejecutar en psql o pgAdmin:

```sql
CREATE DATABASE auth_db;
CREATE DATABASE denuncias_db;
CREATE DATABASE logs_db;
```

---

## 📦 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Sebasky26/voz-segura-system.git
cd voz-segura-system/voz-segura-system-2
```

### 2. Instalar dependencias de cada servicio

```bash
# API Gateway
cd api-gateway
npm install

# Auth Service
cd ../microservices/auth-service
npm install

# Denuncias Service
cd ../denuncias-service
npm install

# Logs Service
cd ../logs-service
npm install

# Frontend
cd ../../frontend
npm install
```

### 3. Configurar variables de entorno

Crear/verificar archivos `.env` en cada servicio:

**api-gateway/.env**
```env
PORT=8000
AUTH_SERVICE_URL=http://localhost:3001
DENUNCIAS_SERVICE_URL=http://localhost:3002
LOGS_SERVICE_URL=http://localhost:3003
JWT_SECRET=mi_secreto_super_seguro_2024
```

**microservices/auth-service/.env**
```env
PORT=3001
DATABASE_URL="postgresql://postgres:123@localhost:5432/auth_db?schema=public"
JWT_SECRET=mi_secreto_super_seguro_2024
```

**microservices/denuncias-service/.env**
```env
PORT=3002
DATABASE_URL="postgresql://postgres:123@localhost:5432/denuncias_db?schema=public"
JWT_SECRET=mi_secreto_super_seguro_2024
AUTH_SERVICE_URL=http://localhost:3001
```

**microservices/logs-service/.env**
```env
PORT=3003
DATABASE_URL="postgresql://postgres:123@localhost:5432/logs_db?schema=public"
JWT_SECRET=mi_secreto_super_seguro_2024
```

**frontend/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

> **Nota:** Cambiar `123` por tu contraseña de PostgreSQL.

### 4. Ejecutar migraciones de Prisma

```bash
# Auth Service
cd microservices/auth-service
npx prisma migrate dev --name init
npx prisma db seed

# Denuncias Service
cd ../denuncias-service
npx prisma migrate dev --name init

# Logs Service
cd ../logs-service
npx prisma migrate dev --name init
```

---

## 🚀 Ejecución Local

### Abrir 5 terminales y ejecutar en orden:

**Terminal 1 - Auth Service (Puerto 3001)**
```bash
cd voz-segura-system-2/microservices/auth-service
npm run dev
```

**Terminal 2 - Denuncias Service (Puerto 3002)**
```bash
cd voz-segura-system-2/microservices/denuncias-service
npm run dev
```

**Terminal 3 - Logs Service (Puerto 3003)**
```bash
cd voz-segura-system-2/microservices/logs-service
npm run dev
```

**Terminal 4 - API Gateway (Puerto 8000)**
```bash
cd voz-segura-system-2/api-gateway
npm run dev
```

**Terminal 5 - Frontend (Puerto 3000)**
```bash
cd voz-segura-system-2/frontend
npm run dev
```

### Verificar que los servicios estén corriendo

| Servicio | URL | Estado esperado |
|----------|-----|-----------------|
| Auth Service | http://localhost:3001/health | `{"status":"ok"}` |
| Denuncias Service | http://localhost:3002/health | `{"status":"ok"}` |
| Logs Service | http://localhost:3003/health | `{"status":"ok"}` |
| API Gateway | http://localhost:8000/health | `{"status":"ok"}` |
| Frontend | http://localhost:3000 | Página de login |

---

## 👥 Usuarios de Prueba

El seed del auth-service crea los siguientes usuarios:

| Rol | Email | Contraseña | Permisos |
|-----|-------|------------|----------|
| **ADMIN** | admin@vozsegura.com | admin123 | Gestión completa |
| **SUPERVISOR** | supervisor@vozsegura.com | supervisor123 | Gestionar denuncias asignadas |
| **DENUNCIANTE** | usuario@vozsegura.com | usuario123 | Crear y ver sus denuncias |

---

## 🔗 API Endpoints

Todos los endpoints pasan por el **API Gateway** en `http://localhost:8000`

### Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Body |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Iniciar sesión | `{email, password}` |
| POST | `/api/auth/register` | Registrar usuario | `{nombre, apellido, email, password}` |
| GET | `/api/auth/me` | Usuario actual | Header: `Authorization: Bearer <token>` |

### Denuncias (`/api/denuncias`)

| Método | Endpoint | Descripción | Requiere Auth |
|--------|----------|-------------|---------------|
| GET | `/api/denuncias` | Listar denuncias | ✅ |
| GET | `/api/denuncias/:id` | Obtener por ID | ✅ |
| POST | `/api/denuncias` | Crear denuncia | ✅ |
| PUT | `/api/denuncias/:id` | Actualizar | ✅ |
| DELETE | `/api/denuncias/:id` | Eliminar | ✅ |

### Usuarios (`/api/usuarios`)

| Método | Endpoint | Descripción | Requiere Auth |
|--------|----------|-------------|---------------|
| GET | `/api/usuarios` | Listar usuarios | ✅ (Admin) |
| GET | `/api/usuarios/:id` | Obtener usuario | ✅ (Admin) |
| PUT | `/api/usuarios/:id` | Actualizar | ✅ (Admin) |
| DELETE | `/api/usuarios/:id` | Eliminar | ✅ (Admin) |

---

## ✨ Características Implementadas

### Funcionales
- ✅ **Autenticación JWT** con tokens seguros
- ✅ **CRUD completo de denuncias** (Crear, Leer, Actualizar, Eliminar)
- ✅ **Sistema de roles** (Admin, Supervisor, Denunciante)
- ✅ **Códigos anónimos** para seguimiento
- ✅ **Filtros y búsqueda** en listados
- ✅ **Categorización** de denuncias
- ✅ **Prioridades** (Baja, Media, Alta, Urgente)

### Técnicas
- ✅ **Arquitectura de microservicios**
- ✅ **API Gateway** como punto de entrada único
- ✅ **Bases de datos separadas** por microservicio
- ✅ **TypeScript** en todo el stack
- ✅ **Prisma ORM** para acceso a datos

### Diseño Frontend
- ✅ **Login**: Gradiente cyan/teal
- ✅ **Dashboard**: Header indigo con cards de navegación
- ✅ **Responsive**: Adaptable a diferentes pantallas

---

## 🐛 Problemas Conocidos

1. El sistema de chat/websockets no está incluido en esta versión
2. Las evidencias de denuncias requieren configuración adicional

---

## 📞 Solución de Problemas

Si tienes errores al ejecutar:

1. **Error de conexión a BD**: Verifica que PostgreSQL esté corriendo y las bases existan
2. **Puerto en uso**: Detén otros procesos en los puertos 3000-3003 y 8000
3. **Error de migraciones**: Ejecuta `npx prisma migrate reset` y luego `npx prisma migrate dev`
4. **Token inválido**: Cierra sesión y vuelve a iniciar

---

## 📄 Licencia

Este proyecto es parte del curso de Aplicaciones Web Avanzadas - EPN 2024-2025.

---

## Requerimientos del Segundo Bimestre

### ✅ 1. Refactorización de Base de Datos y Separación por Microservicio
- **ANTES:** 1 PostgreSQL monolítica con 8 tablas
- **DESPUÉS:** 3 bases PostgreSQL separadas por dominio:
  - `auth_db`: usuarios, tokens
  - `denuncias_db`: denuncias, evidencias, historial
  - `logs_db`: auditoría, configuraciones

### ✅ 2. Uso de 2 Patrones de Microservicios
- **API Gateway Pattern:** Punto de entrada único con routing inteligente
- **Database per Service Pattern:** Cada servicio con su propia BD

### ✅ 3. Frontend Funcional Conectado a Microservicios
- **Next.js** conectado via API Gateway
- **Misma interfaz** del primer bimestre (sin chat)
- **Comunicación HTTP** con microservicios

### ✅ 4. Backend Funcional con Microservicios
- **3 microservicios:** auth-service, denuncias-service, logs-service
- **Express + TypeScript + Prisma**
- **Comunicación inter-servicios** via HTTP

### ✅ 5. Monitoreo y Logs
- **Logs estructurados** por servicio
- **Health checks** en cada microservicio

### ✅ 6. Medidas de Seguridad (JWT)
- **JWT básico:** Implementado desde el inicio
- **OAuth 2.0:** Para implementar al final

---

## Arquitectura de Microservicios

```
🌐 Frontend (Next.js) - Puerto 3000
    ↓
⚖️ Nginx Load Balancer - Puerto 80
    ↓
🚪 API Gateway (Express) - Puerto 8000
    ↓ ↓ ↓
📦 Auth Service:3001    📦 Denuncias Service:3002    📦 Logs Service:3003
    ↓                       ↓                           ↓
🗄️ Auth DB:5433         🗄️ Denuncias DB:5434       🗄️ Logs DB:5435

📊 Monitoring:
├── Prometheus:9090
└── Grafana:3001
```

---

## Tecnologías Utilizadas

### Backend Microservicios
- **Node.js 20 + TypeScript**
- **Express.js** (REST APIs)
- **Prisma ORM** (PostgreSQL)
- **PostgreSQL 15** (3 instancias)

### Frontend
- **Next.js 15** (React 19)
- **TypeScript + Tailwind CSS**
- **Axios** (HTTP Client)

### Infrastructure
- **Docker + Docker Compose**
- **Kong/Express Gateway** (API Gateway)
- **Nginx** (Load Balancer)

### Monitoring
- **Prometheus** (Metrics)
- **Grafana** (Dashboards)
- **Winston** (Logging)

---

## Estructura del Proyecto

```
voz-segura-system-2/
├── 📁 frontend/                     # Next.js app (sin chat)
│   ├── src/app/
│   ├── package.json
│   └── Dockerfile
├── 📁 microservices/
│   ├── 📁 auth-service/             # Autenticación y usuarios
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── 📁 denuncias-service/        # CRUD denuncias completo
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── package.json
│   │   └── Dockerfile
│   └── 📁 logs-service/             # Auditoría y métricas
│       ├── src/
│       ├── prisma/
│       ├── package.json
│       └── Dockerfile
├── 📁 infrastructure/
│   ├── 📁 api-gateway/              # Express proxy router
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   └── 📁 nginx/                    # Load balancer config
│       ├── nginx.conf
│       └── Dockerfile
├── 📁 monitoring/
│   ├── 📁 prometheus/               # Metrics collection
│   │   └── prometheus.yml
│   └── 📁 grafana/                  # Dashboards
│       └── provisioning/
└── 🐳 docker-compose.yml           # Orquestación completa
```

---

## Instalación y Ejecución

### Prerrequisitos
- Docker Desktop
- Docker Compose
- Node.js 20+ (para desarrollo local)

### 🚀 Ejecución Completa con Docker

```bash
# Clonar y navegar al proyecto
cd voz-segura-system-2/

# Construir y ejecutar todos los servicios
docker-compose up --build

# En modo detached (background)
docker-compose up -d --build
```

### 🌐 Acceso a Servicios

```
Frontend:           http://localhost:3000
API Gateway:        http://localhost:8000
Auth Service:       http://localhost:3001
Denuncias Service:  http://localhost:3002
Logs Service:       http://localhost:3003
Prometheus:         http://localhost:9090
Grafana:            http://localhost:3001
```

### 🛠️ Desarrollo Local (Opcional)

```bash
# Instalar dependencias en cada servicio
cd frontend && npm install
cd ../microservices/auth-service && npm install
cd ../denuncias-service && npm install
cd ../logs-service && npm install
cd ../../infrastructure/api-gateway && npm install

# Ejecutar bases de datos solamente
docker-compose up auth-db denuncias-db logs-db -d

# Ejecutar servicios individualmente
cd microservices/auth-service && npm run dev
cd ../denuncias-service && npm run dev
cd ../logs-service && npm run dev
cd ../../infrastructure/api-gateway && npm run dev
cd ../../frontend && npm run dev
```

---

## Funcionalidades del Sistema

### 🔐 Autenticación (auth-service)
- Login/Register con JWT
- Protección contra fuerza bruta
- 3 roles: ADMIN, SUPERVISOR, DENUNCIANTE
- Validación de tokens entre servicios

### 📋 Gestión de Denuncias (denuncias-service)
- CRUD completo de denuncias anónimas
- Códigos únicos (DEN-2024-XXXX)
- Estados: PENDIENTE → EN_REVISION → APROBADA/RECHAZADA → CERRADA
- Asignación automática de supervisores
- Evidencias y comentarios

### 📊 Auditoría (logs-service)
- Logs inmutables de todas las acciones
- Filtrado por usuario, fecha, acción
- Métricas de negocio
- Panel de administración

### 🎨 Frontend (Igual al primer bimestre)
- Landing page pública
- Dashboard diferenciado por rol
- Operaciones CRUD intuitivas
- Diseño responsive con Tailwind

---

## Patrones de Microservicios Implementados

### 1. 🚪 API Gateway Pattern

**Propósito:** Punto de entrada único para todos los clientes

```typescript
// Routing automático basado en path
app.use('/auth/*', proxy('http://auth-service:3001'))
app.use('/denuncias/*', proxy('http://denuncias-service:3002'))
app.use('/logs/*', proxy('http://logs-service:3003'))
```

**Beneficios:**
- Centraliza autenticación y autorización
- Simplifica el cliente (frontend)
- Permite versionado de APIs
- Implementa rate limiting global

### 2. ⚖️ Load Balancer Pattern

**Propósito:** Distribución de carga entre múltiples instancias

```nginx
upstream api_backend {
    server api-gateway-1:8000;
    server api-gateway-2:8000;
    server api-gateway-3:8000;
}

location / {
    proxy_pass http://api_backend;
    health_check;
}
```

**Beneficios:**
- Mejora disponibilidad (high availability)
- Distribuye carga equitativamente
- Failover automático si un servicio falla
- Health checks continuos

---

## Monitoreo y Observabilidad

### 📈 Métricas (Prometheus)
```yaml
# Métricas automáticas recolectadas:
- http_requests_total
- http_request_duration_seconds
- nodejs_process_cpu_usage
- nodejs_heap_size_bytes
- custom_business_metrics
```

### 📊 Dashboards (Grafana)
- **Overview:** Estado general de todos los servicios
- **Performance:** Latencia, throughput, error rate
- **Business:** Denuncias creadas, usuarios registrados
- **Infrastructure:** CPU, memoria, disco por container

### 📝 Logs Estructurados
```json
{
  "timestamp": "2024-11-25T12:00:00.000Z",
  "level": "info",
  "service": "auth-service",
  "message": "User logged in successfully",
  "userId": "uuid-123",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

---

## Comparación: Monolítico vs Microservicios

| Aspecto | Monolítico (1er Bimestre) | Microservicios (2do Bimestre) |
|---------|---------------------------|-------------------------------|
| **Arquitectura** | Next.js único | Frontend + 3 Backend services |
| **Base de Datos** | 1 PostgreSQL | 3 PostgreSQL separadas |
| **Despliegue** | 1 servidor | Docker Compose (9 containers) |
| **Escalabilidad** | Vertical (más CPU/RAM) | Horizontal (más instancias) |
| **Desarrollo** | 1 equipo, 1 codebase | 3 equipos, 3 codebases |
| **Complejidad** | Baja | Media |
| **Monitoreo** | Logs básicos | Prometheus + Grafana |
| **Disponibilidad** | Single point of failure | Alta disponibilidad |
| **Mantenimiento** | Simple | Requiere DevOps |

---

## Contribución

### Flujo de Desarrollo

```bash
# 1. Desarrollar feature en microservicio específico
cd microservices/auth-service
# hacer cambios...

# 2. Probar localmente
npm run test
npm run dev

# 3. Construir imagen Docker
docker build -t auth-service .

# 4. Probar en entorno completo
docker-compose up --build

# 5. Commit y push
git add .
git commit -m "feat: add OAuth integration to auth-service"
git push origin feature/oauth-integration
```

### Convenciones

- **Commits:** Conventional Commits (feat:, fix:, docs:, etc.)
- **Branches:** feature/*, hotfix/*, release/*
- **APIs:** OpenAPI 3.0 specification
- **Testing:** Jest para unit tests, Supertest para integration

---

## 📊 Monitoreo con Prometheus y Grafana

El sistema incluye monitoreo de métricas de los microservicios usando **Prometheus** y **Grafana**.

### Arquitectura de Monitoreo

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  auth-service   │     │ denuncias-svc   │     │  logs-service   │
│    :3001        │     │    :3002        │     │    :3003        │
│   /metrics      │     │   /metrics      │     │   /metrics      │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      PROMETHEUS         │
                    │        :9090            │
                    │  (Recolecta métricas    │
                    │   cada 15 segundos)     │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │       GRAFANA           │
                    │        :3030            │
                    │   (Visualización de     │
                    │      dashboards)        │
                    └─────────────────────────┘
```

### Requisitos

- **Docker** instalado
- **Microservicios corriendo localmente** (puertos 3001, 3002, 3003, 8000)

### Iniciar el Monitoreo

```bash
# 1. Asegurarse de tener los microservicios corriendo localmente
# (ver sección "Ejecución Local")

# 2. Levantar Prometheus y Grafana con Docker
docker-compose -f docker-compose.monitoring.yml up -d

# 3. Verificar que los contenedores estén corriendo
docker ps
```

### URLs de Acceso

| Herramienta | URL | Credenciales |
|-------------|-----|--------------|
| **Prometheus** | http://localhost:9090 | Sin credenciales |
| **Grafana** | http://localhost:3030 | `admin` / `admin` |

### Ver el Dashboard en Grafana

1. Abrir http://localhost:3030
2. Iniciar sesión con `admin` / `admin` (puedes saltar el cambio de contraseña)
3. Ir al menú izquierdo → **Dashboards**
4. Click en **"Voz Segura - Monitoreo de Microservicios"**

### Métricas Disponibles

El dashboard muestra:

| Panel | Descripción |
|-------|-------------|
| **CPU Total por Servicio** | Tiempo de CPU utilizado |
| **Uso de CPU (gráfica)** | Porcentaje de CPU en tiempo real |
| **Uso de Memoria** | RAM utilizada por cada servicio |
| **Estado UP/DOWN** | Estado de salud de cada servicio (verde=activo, rojo=caído) |

### Verificar Estado de Servicios en Prometheus

1. Ir a http://localhost:9090/targets
2. Ver el estado de cada servicio:
   - 🟢 **UP** = Servicio funcionando correctamente
   - 🔴 **DOWN** = Servicio no responde

### Detener el Monitoreo

```bash
docker-compose -f docker-compose.monitoring.yml down
```

### Archivos de Configuración

| Archivo | Descripción |
|---------|-------------|
| `docker-compose.monitoring.yml` | Docker Compose para Prometheus y Grafana |
| `monitoring/prometheus/prometheus-local.yml` | Configuración de Prometheus para servicios locales |
| `monitoring/grafana/provisioning/dashboards/` | Dashboards prediseñados |
| `monitoring/grafana/provisioning/datasources/` | Configuración de conexión a Prometheus |

---

## Roadmap

### ✅ Completado
- [x] Refactorización de arquitectura monolítica
- [x] Separación de bases de datos
- [x] 3 microservicios funcionales
- [x] API Gateway + Load Balancer
- [x] Contenedorización completa
- [x] Monitoreo básico

### 🔄 En Desarrollo
- [ ] OAuth 2.0 integration
- [ ] Advanced security headers
- [ ] Rate limiting avanzado
- [ ] Circuit breaker pattern

### 🔮 Futuras Mejoras
- [ ] Kubernetes deployment
- [ ] Service mesh (Istio)
- [ ] Event-driven architecture
- [ ] CQRS pattern implementation

---

## Licencia

MIT License - Proyecto académico EPN 2024

---

## Contacto

- **GitHub:** https://github.com/Sebasky26/voz-segura-system-2
- **Equipo:** Grupo 7 - Aplicaciones Web Avanzadas
- **Institución:** Escuela Politécnica Nacional

---

**Voz Segura Microservicios** - Segundo Bimestre  
Arquitectura de microservicios para denuncias anónimas seguras