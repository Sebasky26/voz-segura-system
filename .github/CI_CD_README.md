# CI/CD Pipeline - Voz Segura Microservicios

## Descripción General

Sistema completo de CI/CD para la arquitectura de microservicios de Voz Segura, implementado con GitHub Actions. Este pipeline automatiza todo el ciclo de vida del desarrollo de software: desde la validación del código hasta el despliegue en producción, pasando por análisis de seguridad y gestión de dependencias.

## ¿Qué es CI/CD?

**Continuous Integration (CI):** Práctica de integrar cambios de código frecuentemente, ejecutando tests automatizados y validaciones para detectar errores tempranamente.

**Continuous Deployment (CD):** Proceso de automatizar el despliegue de código a diferentes ambientes (staging, production) después de pasar todas las validaciones.

## Estructura del Proyecto CI/CD

```
.github/
├── workflows/              # Definición de pipelines automatizados
│   ├── ci.yml             # Integración continua (tests, linting)
│   ├── docker-build-push.yml  # Build y publicación de imágenes Docker
│   ├── deploy.yml         # Despliegue a ambientes
│   ├── security.yml       # Análisis de seguridad
│   └── pr-checks.yml      # Validaciones de Pull Requests
├── dependabot.yml         # Configuración de actualizaciones automáticas
├── labeler.yml            # Auto-etiquetado de PRs
├── scripts/
│   └── health-check.sh    # Script de verificación del pipeline
├── .env.example           # Template de variables de entorno
└── CI_CD_README.md        # Esta documentación
```

## Componentes del Sistema

### Workflows (Pipelines Automatizados)

Los workflows son archivos YAML que definen flujos de trabajo automatizados. Cada workflow se ejecuta en respuesta a eventos específicos (push, pull request, schedule, manual).

### Environments

Los environments permiten separar configuraciones y secrets para diferentes ambientes de despliegue (staging, production). Esto garantiza que las credenciales de producción no se usen accidentalmente en desarrollo.

### Secrets

Los secrets son variables encriptadas que almacenan información sensible (contraseñas, API keys, tokens). GitHub las encripta y solo están disponibles durante la ejecución de los workflows.

### GitHub Container Registry (GHCR)

Registro de contenedores proporcionado por GitHub donde se almacenan las imágenes Docker del proyecto. Las imágenes están versionadas y disponibles para deployment.

## Workflows Disponibles

Cada workflow es un archivo YAML independiente que automatiza una parte específica del ciclo de desarrollo.

### 1. CI - Test & Lint (`ci.yml`)

**Propósito:** Validar la calidad del código en cada cambio.

**Trigger:** Push y Pull Request en ramas `microservicios`, `main`, `develop`

**¿Qué hace?**
1. Configura un entorno Node.js 20
2. Instala dependencias de cada servicio (npm ci)
3. Genera clients de Prisma ORM
4. Ejecuta linters (ESLint) para verificar estilo y errores
5. Ejecuta tests unitarios
6. Genera un reporte consolidado de todos los servicios

**Servicios analizados:**
- Auth Service (autenticación y usuarios)
- Denuncias Service (gestión de denuncias)
- Logs Service (auditoría y logs)
- API Gateway (punto de entrada único)
- Frontend (interfaz Next.js)

**Tiempo estimado:** 5-8 minutos

**Valor:** Detecta errores de sintaxis, lógica y estilo antes de hacer merge, reduciendo bugs en producción.

---

### 2. Docker Build & Push (`docker-build-push.yml`)

**Propósito:** Crear imágenes Docker optimizadas y publicarlas en un registry.

**Trigger:** 
- Push a `microservicios` o `main`
- Tags de versión `v*.*.*` (ej: v1.0.0)
- Manual (`workflow_dispatch`)

**¿Qué hace?**
1. Usa Docker Buildx para builds multi-arquitectura
2. Implementa cache de layers para velocidad
3. Construye 6 imágenes Docker en paralelo:
   - voz-segura-auth-service
   - voz-segura-denuncias-service
   - voz-segura-logs-service
   - voz-segura-api-gateway
   - voz-segura-frontend
   - voz-segura-load-balancer
4. Las publica en GitHub Container Registry (ghcr.io)
5. Genera tags automáticos:
   - `latest`: último build de la rama default
   - `microservicios`: último build de rama microservicios
   - `sha-<commit>`: identificador único por commit
   - `v1.0.0`: tags de versión semántica

**Imágenes generadas:**
```
ghcr.io/sebasky26/voz-segura-auth-service:latest
ghcr.io/sebasky26/voz-segura-denuncias-service:latest
ghcr.io/sebasky26/voz-segura-logs-service:latest
ghcr.io/sebasky26/voz-segura-api-gateway:latest
ghcr.io/sebasky26/voz-segura-frontend:latest
ghcr.io/sebasky26/voz-segura-load-balancer:latest
```

**Tiempo estimado:** 10-15 minutos (con cache: 5-8 minutos)

**Valor:** Las imágenes están listas para despliegue inmediato en cualquier servidor con Docker.

---

### 3. Deploy (`deploy.yml`)

**Propósito:** Desplegar la aplicación en ambientes controlados (staging/production).

**Trigger:** Manual con parámetros

**Parámetros:**
- `environment`: staging | production (elige el ambiente de despliegue)
- `tag`: versión de imagen Docker (ej: latest, v1.0.0)

**¿Qué hace?**
1. Genera un archivo docker-compose.yml dinámico
2. Configura variables de entorno según el environment
3. Conecta con las imágenes Docker del registry
4. (Opcional) Despliega en servidor vía SSH
5. Inicia todos los servicios con docker-compose

**Componentes desplegados:**
- 3 Bases de datos PostgreSQL (auth, denuncias, logs)
- 3 Microservicios backend
- API Gateway
- Load Balancer (Nginx)
- Frontend (Next.js)
- Prometheus + Grafana (monitoreo)

**Tiempo estimado:** 3-5 minutos

**Valor:** Despliegue consistente y reproducible en cualquier ambiente.

**Nota:** Requiere configuración de secrets por environment (ver sección de Secrets).

---

### 4. Security Scan (`security.yml`)

**Propósito:** Detectar vulnerabilidades de seguridad en código, dependencias e imágenes.

**Trigger:**
- Push y Pull Request
- Programado: Cada lunes a las 9 AM UTC
- Manual

**Herramientas de análisis:**

**Trivy (Vulnerabilidades)**
- Escanea código fuente en busca de vulnerabilidades conocidas
- Analiza dependencias npm
- Clasifica por severidad: CRITICAL, HIGH, MEDIUM, LOW
- Genera reportes SARIF para GitHub Security

**GitLeaks (Secretos)**
- Detecta credenciales hardcodeadas
- Busca API keys, contraseñas, tokens
- Previene leaks de información sensible

**Dependency Review**
- Analiza cambios en dependencias en PRs
- Detecta dependencias vulnerables antes de merge
- Solo se ejecuta en Pull Requests

**NPM Audit**
- Auditoría oficial de npm
- Verifica cada package.json
- Genera reportes por servicio

**Docker Security Scan**
- Escanea imágenes Docker construidas
- Detecta vulnerabilidades en base images
- Valida configuración de contenedores

**Reportes:** Los resultados se publican en la pestaña Security de GitHub y pueden bloquear PRs si hay vulnerabilidades críticas.

**Tiempo estimado:** 8-12 minutos

**Valor:** Protección proactiva contra vulnerabilidades y brechas de seguridad.

---

### 5. Pull Request Checks (`pr-checks.yml`)

**Propósito:** Validar calidad y consistencia de Pull Requests antes de merge.

**Trigger:** Pull Requests a `microservicios` o `main`

**Validaciones automáticas:**

**1. Validación de Título**
- Verifica formato de conventional commits
- Formatos válidos: `feat:`, `fix:`, `docs:`, `chore:`, `ci:`, etc.
- Ejemplo correcto: `feat(auth): agregar validación de email`
- Bloquea merge si el título no cumple el formato

**2. Análisis de Tamaño**
- Cuenta líneas agregadas y eliminadas
- Categoriza: Small (<100), Medium (<500), Large (<1000), Very Large (>1000)
- Recomienda dividir PRs muy grandes

**3. Detección de Conflictos**
- Verifica si hay conflictos de merge
- Alerta antes de intentar merge
- Previene errores de integración

**4. Verificación de Archivos Grandes**
- Detecta archivos mayores a 1MB
- Recomienda usar Git LFS para archivos grandes
- Mantiene el repositorio ligero

**5. Auto-Labeling**
- Asigna etiquetas automáticamente según archivos modificados
- Etiquetas: `service: auth`, `infrastructure: frontend`, `docker`, `ci/cd`, etc.
- Facilita organización y búsqueda de PRs

**Tiempo estimado:** 1-2 minutos

**Valor:** Mantiene estándares de calidad y organización del código.

---

### 6. Dependabot (`dependabot.yml`)

**Propósito:** Mantener dependencias actualizadas automáticamente.

**Programación:** Actualizaciones semanales programadas

**¿Qué hace?**
- Monitorea nuevas versiones de dependencias
- Crea Pull Requests automáticos con actualizaciones
- Separa actualizaciones por tipo y servicio
- Incluye changelog y release notes

**Ecosistemas monitoreados:**

**1. Dependencias npm (Lunes 9 AM)**
- Revisa package.json de cada servicio
- Auth Service, Denuncias Service, Logs Service, API Gateway, Frontend
- Actualiza paquetes npm con nuevas versiones

**2. Imágenes Docker (Martes 9 AM)**
- Revisa Dockerfiles
- Actualiza base images (node:20-alpine, postgres:15-alpine, nginx, etc.)
- Mejora seguridad al usar versiones parcheadas

**3. GitHub Actions (Miércoles 9 AM)**
- Actualiza actions usadas en workflows
- Ejemplo: actions/checkout@v4 → actions/checkout@v5
- Mantiene pipelines con últimas features

**Configuración:**
- Máximo 5 PRs abiertos por ecosistema
- Reviewers asignados automáticamente
- Labels para fácil identificación
- Commit messages con conventional commits

**Tiempo estimado:** Variable (depende de cuántas actualizaciones haya)

**Valor:** Reduce vulnerabilidades y mantiene el proyecto actualizado sin esfuerzo manual.

---

## Archivos de Configuración

### `dependabot.yml`
Define la estrategia de actualización de dependencias. Configura qué dependencias monitorear, con qué frecuencia y cómo crear los PRs.

### `labeler.yml`
Mapea patrones de archivos a etiquetas de GitHub. Cuando un PR modifica ciertos archivos, se le asignan automáticamente las etiquetas correspondientes.

Ejemplo:
- Cambios en `microservices/auth-service/**` → Label: `service: auth`
- Cambios en `**/Dockerfile` → Label: `docker`

### `.env.example`
Template de variables de entorno que muestra qué secrets se necesitan configurar, sin exponer valores reales.

### `health-check.sh`
Script bash para verificar localmente que el pipeline está correctamente configurado antes de hacer push.

---

## Flujo de Trabajo Típico

### 1. Desarrollo Local
```bash
# Crear rama de feature
git checkout -b feature/nueva-funcionalidad

# Hacer cambios
# ... editar código ...

# Verificar localmente
npm run lint
npm test
npm run build

# Commit con conventional commits
git commit -m "feat(auth): agregar validación de email"

# Push a GitHub
git push origin feature/nueva-funcionalidad
```

### 2. Pull Request
Al crear el PR:
1. **PR Checks** valida título, tamaño, conflictos
2. **Auto-labeling** asigna etiquetas
3. **CI** ejecuta tests y linting
4. **Security** escanea vulnerabilidades

### 3. Review y Merge
- Revisar resultados de workflows
- Corregir si hay fallos
- Aprobar PR cuando todo esté verde
- Merge a microservicios

### 4. Build de Imágenes
Al hacer merge:
1. **Docker Build** crea imágenes
2. Se publican en GHCR con tag `latest`
3. **Security** escanea las imágenes nuevas

### 5. Deploy
Manual cuando se decide:
1. Ir a Actions > Deploy > Run workflow
2. Seleccionar environment (staging/production)
3. Seleccionar tag de imagen
4. Confirmar deployment

### 6. Monitoreo
- Ver logs en Actions
- Revisar Security tab para alertas
- Aprobar PRs de Dependabot semanalmente

---

## Secrets Necesarios

### Secrets del Repositorio
Estos secrets deben configurarse en `Settings > Secrets and variables > Actions`:

```yaml
# GitHub Container Registry (automático)
GITHUB_TOKEN  # Provisto automáticamente por GitHub

# Para deployment (opcional)
SSH_PRIVATE_KEY  # Clave SSH para servidor
SERVER_USER      # Usuario SSH del servidor
SERVER_HOST      # Host/IP del servidor
```

### Secrets por Environment
Configura en `Settings > Environments > [staging/production]`:

```yaml
# Base de datos
AUTH_DB_PASSWORD
DENUNCIAS_DB_PASSWORD
LOGS_DB_PASSWORD

# URLs de conexión
AUTH_DATABASE_URL          # postgresql://user:pass@host:5432/db
DENUNCIAS_DATABASE_URL
LOGS_DATABASE_URL

# Autenticación
JWT_SECRET

# Frontend
NEXT_PUBLIC_API_GATEWAY_URL

# Monitoring
GRAFANA_ADMIN_PASSWORD
```

---

## Uso de los Workflows

### Ejecutar CI automáticamente
```bash
# Hacer push a rama microservicios
git push origin microservicios

# Crear Pull Request
gh pr create --base microservicios
```

### Build y Push de Docker Images
```bash
# Automático al hacer push a main/microservicios
git push origin microservicios

# Manual desde GitHub UI
# Actions > Docker Build & Push > Run workflow

# Con tag de versión
git tag v1.0.0
git push origin v1.0.0
```

### Deployment Manual
```bash
# Desde GitHub UI
# Actions > Deploy > Run workflow
# Seleccionar:
#   - Environment: staging/production
#   - Tag: latest o versión específica (v1.0.0)
```

### Escaneo de Seguridad
```bash
# Automático: cada lunes a las 9 AM UTC
# Manual desde GitHub UI:
# Actions > Security Scan > Run workflow
```

---

## Monitoreo y Reportes

### Ver estado de workflows
```bash
# Desde CLI
gh run list

# Ver logs de un workflow
gh run view <run-id>

# Ver workflow específico
gh run view --log-failed
```

### Dashboards disponibles
- **Actions**: Estado de todos los workflows
- **Security**: Vulnerabilidades y alertas
- **Insights > Dependency graph**: Dependencias del proyecto
- **Pull Requests**: PRs de Dependabot

---

## Arquitectura del Pipeline

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────┐
│              DESARROLLADOR                               │
│         git push / Pull Request                          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              GITHUB REPOSITORY                           │
│           (Código fuente + Workflows)                    │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐    ┌──────────────┐
│   CI Tests   │    │   Security   │
│   & Lint     │    │    Scan      │
│              │    │              │
│ • ESLint     │    │ • Trivy      │
│ • Jest       │    │ • GitLeaks   │
│ • Prisma     │    │ • NPM Audit  │
│ • Build      │    │ • Dep Review │
└──────┬───────┘    └──────┬───────┘
       │                   │
       └────────┬──────────┘
                │
                ▼ (Si todo pasa)
       ┌────────────────┐
       │  Merge a main  │
       └────────┬───────┘
                │
                ▼
       ┌────────────────┐
       │ Docker Build   │
       │   & Push       │
       │                │
       │ 6 imágenes →   │
       │ GHCR Registry  │
       └────────┬───────┘
                │
                ▼
       ┌────────────────┐
       │ Manual Deploy  │
       │                │
       │ Staging   OR   │
       │ Production     │
       └────────┬───────┘
                │
                ▼
       ┌────────────────┐
       │   Monitoreo    │
       │                │
       │ • Prometheus   │
       │ • Grafana      │
       │ • Logs         │
       └────────────────┘
```

### Explicación del Flujo

**Fase 1: Validación (CI + Security)**
- Ejecuta en paralelo para rapidez
- Debe pasar para permitir merge
- Reporta errores inmediatamente

**Fase 2: Build de Imágenes**
- Solo después de merge exitoso
- Crea artefactos deployables
- Versionados y trazables

**Fase 3: Deployment**
- Manual para control
- Usa imágenes del registry
- Ambiente aislado por environment

**Fase 4: Monitoreo**
- Continuo post-deployment
- Métricas y logs centralizados
- Alertas automáticas

---

## Beneficios del Pipeline Implementado

### 1. Calidad de Código
- **Detección temprana:** Errores encontrados antes de merge
- **Consistencia:** Mismo estándar en todo el equipo
- **Documentación:** Commits estandarizados y trazables

### 2. Seguridad
- **Escaneo continuo:** Vulnerabilidades detectadas semanalmente
- **Prevención:** Secretos y credenciales bloqueados antes de commit
- **Actualizaciones:** Dependencias seguras automáticamente

### 3. Velocidad
- **Builds paralelos:** 30 min → 8 min
- **Cache inteligente:** Reutiliza dependencias
- **Despliegue rápido:** 3-5 minutos con docker-compose

### 4. Confiabilidad
- **Tests automatizados:** Reducción de bugs en producción
- **Rollback fácil:** Tags de imágenes permiten volver atrás
- **Reproducibilidad:** Mismo ambiente en dev, staging y prod

### 5. Productividad
- **Menos trabajo manual:** Automatización de tareas repetitivas
- **Foco en código:** No en infraestructura
- **Dependabot:** Mantiene dependencias sin esfuerzo

---

## Tecnologías Utilizadas

### GitHub Actions
Plataforma de CI/CD integrada con GitHub. Ejecuta workflows en runners (máquinas virtuales) proporcionadas por GitHub.

**Ventajas:**
- Integración nativa con GitHub
- Sin configuración de servidores
- Gratis para repositorios públicos
- 2000 minutos/mes gratis para privados

### Docker & Docker Compose
**Docker:** Plataforma de contenedores para empaquetar aplicaciones con sus dependencias.
**Docker Compose:** Herramienta para definir y ejecutar aplicaciones multi-contenedor.

**Ventajas:**
- Portabilidad entre ambientes
- Aislamiento de servicios
- Escalabilidad sencilla
- Reproducibilidad

### GitHub Container Registry (GHCR)
Registro de contenedores Docker integrado con GitHub.

**Ventajas:**
- Autenticación con GitHub
- Versionado automático
- Integración con Actions
- Gratis para públicos, económico para privados

### Herramientas de Seguridad

**Trivy:** Scanner de vulnerabilidades open-source
- Escanea código, dependencias e imágenes
- Base de datos actualizada diariamente
- Soporta múltiples lenguajes

**GitLeaks:** Detector de secretos
- Usa regex para encontrar patrones
- Base de datos de secretos comunes
- Previene leaks accidentales

**Dependabot:** Bot de GitHub para dependencias
- Monitorea vulnerabilidades conocidas
- Crea PRs automáticos
- Integrado con GitHub Security

### Monitoreo

**Prometheus:** Sistema de monitoreo y alertas
- Recolecta métricas de servicios
- Query language potente (PromQL)
- Almacenamiento time-series

**Grafana:** Plataforma de visualización
- Dashboards personalizables
- Múltiples fuentes de datos
- Alertas configurables

### 1. Cache de Dependencias
- Cache de npm por servicio
- Cache de Docker layers
- Cache de Prisma client

### 2. Builds Paralelos
- Cada servicio se construye en paralelo
- Reduce tiempo de CI de aproximadamente 30 minutos a 8 minutos

### 3. Ejecución Selectiva
- Solo ejecuta jobs relevantes según cambios
- Continue-on-error para linting

### 4. Multi-etapa
- Dockerfiles optimizados
- Imágenes de producción ligeras

---

## Buenas Prácticas

### Commits
```bash
# Usa conventional commits
feat(auth): agregar validación de email
fix(denuncias): corregir carga de evidencias
chore(ci): actualizar workflow de seguridad
docs: actualizar README de CI/CD
```

### Branches
```
microservicios (development)
├── feature/nueva-funcionalidad
├── fix/correccion-bug
└── main (production)
```

### Pull Requests
- Esperar que pasen todos los checks antes de merge
- Revisar alertas de seguridad
- Aprobar PRs de Dependabot después de verificar

### Tags de Versión
```bash
# Usar semantic versioning
git tag v1.0.0    # Release mayor
git tag v1.1.0    # Feature nueva
git tag v1.1.1    # Bugfix
git push --tags
```

---

## Configuración Inicial

### 1. Habilitar Permisos en GitHub
- Ir a **Settings > Actions > General**
- Seleccionar "Allow all actions and reusable workflows"
- Seleccionar "Read and write permissions"
- Marcar "Allow GitHub Actions to create and approve pull requests"

### 2. Crear Environments
- Ir a **Settings > Environments**
- Crear environment "staging"
- Crear environment "production"

### 3. Configurar Secrets por Environment
En **Settings > Environments > [staging/production] > Add secret**:
- Configurar todos los secrets listados en la sección anterior

### 4. Habilitar Branch Protection (Recomendado)
- Ir a **Settings > Branches > Add rule**
- Branch name pattern: `microservicios`
- Marcar "Require status checks to pass before merging"
- Seleccionar checks requeridos: CI Summary, Security Summary

---

## Troubleshooting

### Build falla por falta de memoria
```yaml
# Agregar en el job que falla:
env:
  NODE_OPTIONS: --max_old_space_size=4096
```

### Error de permisos en GHCR
```bash
# Verificar permisos del paquete en:
# https://github.com/users/<user>/packages/container/<package>/settings

# Debe tener: write access para github-actions
```

### Prisma client no se genera
```yaml
# Asegurar que esté en el workflow:
- name: Generate Prisma Client
  run: npx prisma generate
```

### Tests fallan en CI pero pasan localmente
```bash
# Ejecutar en ambiente similar a CI:
docker run -it node:20-alpine sh
npm ci
npm test
```

---

## Referencias

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Trivy Security Scanner](https://github.com/aquasecurity/trivy)
- [Dependabot Configuration](https://docs.github.com/en/code-security/dependabot)

---

## Comandos Útiles

### Verificar workflows
```bash
# Listar todos los workflows
gh workflow list

# Ver últimas ejecuciones
gh run list --limit 10

# Ver detalles de una ejecución
gh run view <run-id>

# Ver logs de una ejecución fallida
gh run view <run-id> --log-failed
```

### Ejecutar workflows manualmente
```bash
# Ejecutar workflow de build
gh workflow run docker-build-push.yml

# Ejecutar deployment
gh workflow run deploy.yml -f environment=staging -f tag=latest

# Ejecutar security scan
gh workflow run security.yml
```

### Gestión de secrets
```bash
# Listar secrets
gh secret list

# Crear secret
gh secret set AUTH_DB_PASSWORD

# Crear secret desde archivo
gh secret set JWT_SECRET < jwt_secret.txt

# Crear secret para environment
gh secret set AUTH_DB_PASSWORD --env staging
```

### Escaneo local de seguridad
```bash
# NPM Audit
npm audit --audit-level=moderate

# Trivy en repositorio
docker run --rm -v $(pwd):/src aquasec/trivy fs /src

# Trivy en imagen Docker
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image voz-segura-auth:local
```

---

## Preguntas Frecuentes (FAQ)

### ¿Por qué GitHub Actions y no Jenkins/GitLab CI?
- Integración nativa con GitHub
- Sin infraestructura que mantener
- Gratis para públicos y económico para privados
- Gran ecosistema de actions reutilizables

### ¿Por qué separate environments para staging y production?
- Evita usar credenciales de producción en desarrollo
- Permite testear cambios antes de producción
- Cumple con mejores prácticas de seguridad
- Facilita rollback sin afectar producción

### ¿Qué pasa si un workflow falla?
1. GitHub envía notificación por email
2. El merge se bloquea automáticamente
3. Se pueden ver logs detallados en Actions
4. Se corrige el error y se vuelve a ejecutar

### ¿Puedo ejecutar workflows localmente?
Sí, con herramientas como `act`:
```bash
# Instalar act
brew install act  # macOS
# o descargar desde github.com/nektos/act

# Ejecutar workflow localmente
act push
```

### ¿Cómo hacer rollback si hay problemas?
```bash
# Deploy de versión anterior
gh workflow run deploy.yml \
  -f environment=production \
  -f tag=v1.0.0  # versión estable anterior
```

### ¿Los workflows consumen muchos minutos de GitHub?
Aproximadamente por ejecución completa:
- CI: 40 minutos (8 min × 5 servicios en paralelo)
- Security: 60 minutos
- Docker Build: 90 minutos
- Deploy: 5 minutos

Total: ~195 minutos por ciclo completo

Plan free: 2000 minutos/mes = ~10 ciclos completos
Plan Team: 3000 minutos/mes = ~15 ciclos completos

### ¿Cómo actualizar una imagen Docker en producción?
1. Hacer cambios y merge a main
2. Esperar Docker Build (crea nueva imagen)
3. Ejecutar Deploy con tag nuevo
4. Verificar logs y métricas

### ¿Puedo saltarme CI para cambios menores?
No recomendado, pero posible agregando `[skip ci]` al commit:
```bash
git commit -m "docs: fix typo [skip ci]"
```

### ¿Dependabot crea muchos PRs?
- Máximo 5 por ecosistema
- Se pueden auto-mergear los seguros
- Se pueden ignorar actualizaciones específicas
- Configuración ajustable en dependabot.yml

---

## Métricas y KPIs del Pipeline

### Tiempo de Ciclo (Lead Time)
Desde commit hasta producción: ~25-35 minutos
- CI: 5-8 min
- Build: 10-15 min
- Deploy: 3-5 min
- Buffer: 5 min

### Frecuencia de Deployment
Con este pipeline: múltiples deploys por día
- Staging: ilimitados
- Production: según necesidad (típico: 1-3/día)

### Tasa de Éxito
Objetivo: >95% de workflows exitosos
- Monitorear en Actions > Insights
- Investigar fallos recurrentes
- Mejorar tests y validaciones

### Cobertura de Tests
Recomendado: >80% de code coverage
```bash
# Generar reporte de cobertura
npm test -- --coverage
```

### Vulnerabilidades Detectadas
- Objetivo: 0 CRITICAL, 0 HIGH
- Revisar semanalmente Security tab
- Priorizar fixes de seguridad

---

## Mantenimiento del Pipeline

### Tareas Semanales
1. Revisar y aprobar PRs de Dependabot
2. Verificar Security tab para nuevas alertas
3. Limpiar imágenes Docker antiguas en GHCR
4. Revisar logs de fallos en Actions

### Tareas Mensuales
1. Actualizar versiones de GitHub Actions
2. Revisar y optimizar tiempos de workflows
3. Actualizar documentación si hay cambios
4. Revisar límites de minutos de GitHub

### Tareas Trimestrales
1. Auditoría completa de seguridad
2. Revisar y actualizar secrets
3. Optimizar cache y builds
4. Capacitación del equipo en nuevas features

---

## Roadmap Futuro

### Mejoras Planificadas

**Corto Plazo (1-3 meses)**
- [ ] Integración con Slack para notificaciones
- [ ] Smoke tests post-deployment
- [ ] Health checks automáticos
- [ ] Métricas de performance en CI

**Medio Plazo (3-6 meses)**
- [ ] Blue-Green deployment strategy
- [ ] Canary deployments para production
- [ ] Tests de integración end-to-end
- [ ] Automatic rollback en caso de fallo

**Largo Plazo (6-12 meses)**
- [ ] Kubernetes en lugar de docker-compose
- [ ] Service mesh (Istio/Linkerd)
- [ ] Chaos engineering tests
- [ ] Multi-region deployment

---

## Soporte y Contacto

### Documentación
- Este README (CI/CD completo)
- Documentación de cada workflow (comentarios en archivos YAML)
- GitHub Actions Docs oficial

### Troubleshooting
1. Revisar logs en la pestaña Actions
2. Verificar que todos los secrets estén configurados
3. Consultar sección de Troubleshooting más arriba
4. Ejecutar health-check.sh localmente

### Reportar Problemas
1. Crear issue en GitHub con label `ci/cd`
2. Incluir logs relevantes
3. Describir pasos para reproducir
4. Indicar workflow afectado

### Contribuir al Pipeline
1. Proponer mejoras vía Pull Request
2. Discutir cambios mayores en issues primero
3. Actualizar documentación con los cambios
4. Seguir conventional commits

---

## Glosario de Términos

**CI (Continuous Integration):** Práctica de integrar cambios frecuentemente con validación automática.

**CD (Continuous Deployment):** Automatización del despliegue de código validado.

**Workflow:** Conjunto de jobs automatizados definidos en archivo YAML.

**Job:** Conjunto de pasos que se ejecutan en un runner.

**Runner:** Máquina virtual que ejecuta workflows de GitHub Actions.

**Artifact:** Archivo o conjunto de archivos generados durante un workflow.

**Cache:** Almacenamiento temporal de dependencias para acelerar builds.

**Secret:** Variable encriptada con información sensible.

**Environment:** Conjunto aislado de configuración y secrets (staging/production).

**Registry:** Almacén de imágenes Docker (GHCR en este caso).

**Tag:** Etiqueta que identifica una versión específica de imagen Docker.

**GHCR:** GitHub Container Registry, registro de contenedores de GitHub.

**SARIF:** Format estándar para reportes de análisis estático.

**Conventional Commits:** Convención para mensajes de commit estructurados.

**Semantic Versioning:** Sistema de versionado (MAJOR.MINOR.PATCH).

**Health Check:** Verificación automática del estado de un servicio.

**Rollback:** Volver a una versión anterior después de un problema.

**Blue-Green Deployment:** Estrategia con dos ambientes idénticos para deploy sin downtime.

**Canary Deployment:** Despliegue gradual a subset de usuarios antes de full rollout.

---

## Conclusión

Este pipeline de CI/CD implementa las mejores prácticas de DevOps moderno:

**Automatización completa:** Desde validación hasta despliegue
**Seguridad integrada:** Escaneo continuo y prevención de vulnerabilidades
**Calidad garantizada:** Tests y validaciones en cada cambio
**Eficiencia optimizada:** Builds paralelos y cache inteligente
**Trazabilidad:** Versionado y logs de cada deployment
**Escalabilidad:** Preparado para crecimiento del proyecto

El sistema está diseñado para:
- Reducir errores humanos
- Acelerar time-to-market
- Mejorar colaboración del equipo
- Mantener alta calidad de código
- Facilitar mantenimiento a largo plazo

**Última actualización:** Enero 2026  
**Versión del Pipeline:** 1.0.0  
**Mantenido por:** Grupo 7 - Aplicaciones Web Avanzadas  
**Autores:** Sebastian Aisalla, Jhoel Narváez, Francis Velastegui
