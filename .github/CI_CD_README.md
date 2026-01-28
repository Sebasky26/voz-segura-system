# CI/CD Pipeline - Voz Segura Microservicios

## Descripción General

Sistema completo de CI/CD para la arquitectura de microservicios de Voz Segura, implementado con GitHub Actions.

## Workflows Disponibles

### 1. CI - Test & Lint (`ci.yml`)

**Trigger:** Push y Pull Request en ramas `microservicios`, `main`, `develop`

**Acciones:**
- Ejecuta linting para todos los servicios
- Ejecuta tests unitarios
- Genera Prisma clients
- Build de Next.js (Frontend)
- Reporte de resultados consolidado

**Servicios analizados:**
- Auth Service
- Denuncias Service
- Logs Service
- API Gateway
- Frontend

---

### 2. Docker Build & Push (`docker-build-push.yml`)

**Trigger:** 
- Push a `microservicios` o `main`
- Tags `v*.*.*`
- Manual (`workflow_dispatch`)

**Acciones:**
- Construye imágenes Docker de todos los servicios
- Publica a GitHub Container Registry (ghcr.io)
- Usa caché para optimizar builds
- Genera tags automáticos (branch, sha, semver, latest)

**Imágenes generadas:**
```
ghcr.io/<owner>/voz-segura-auth-service:latest
ghcr.io/<owner>/voz-segura-denuncias-service:latest
ghcr.io/<owner>/voz-segura-logs-service:latest
ghcr.io/<owner>/voz-segura-api-gateway:latest
ghcr.io/<owner>/voz-segura-frontend:latest
ghcr.io/<owner>/voz-segura-load-balancer:latest
```

---

### 3. Deploy (`deploy.yml`)

**Trigger:** Manual con parámetros

**Parámetros:**
- `environment`: staging | production
- `tag`: versión de imagen (default: latest)

**Acciones:**
- Genera docker-compose de deployment
- Template para deployment en servidor (SSH)
- Configuración de environments de GitHub

**Nota:** Requiere configuración de secrets por environment (ver sección de Secrets).

---

### 4. Security Scan (`security.yml`)

**Trigger:**
- Push y Pull Request
- Programado: Lunes 9 AM UTC
- Manual

**Análisis de seguridad:**
- **Trivy**: Escaneo de vulnerabilidades en código y dependencias
- **GitLeaks**: Detección de secretos y credenciales
- **Dependency Review**: Análisis de dependencias en PRs
- **NPM Audit**: Auditoría de paquetes npm
- **Docker Security**: Escaneo de imágenes Docker

**Reportes:** Los resultados se publican en la pestaña Security de GitHub.

---

### 5. Pull Request Checks (`pr-checks.yml`)

**Trigger:** Pull Requests a `microservicios` o `main`

**Validaciones:**
- Validación de título (conventional commits)
- Análisis de tamaño del PR
- Detección de conflictos de merge
- Verificación de archivos grandes
- Auto-labeling basado en archivos modificados

---

### 6. Dependabot (`dependabot.yml`)

**Programación:** Actualizaciones semanales

**Monitoreo:**
- Dependencias npm de todos los servicios
- Imágenes base de Docker
- GitHub Actions

**Configuración:**
- Lunes: Dependencias npm
- Martes: Imágenes Docker
- Miércoles: GitHub Actions
- Máximo 5 PRs abiertos por ecosistema

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

```
┌─────────────────────────────────────────────────────────┐
│                    PUSH / PR                             │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
   ┌────────┐      ┌──────────┐
   │   CI   │      │ Security │
   │ Tests  │      │   Scan   │
   └───┬────┘      └──────────┘
       │
       ▼
┌──────────────┐
│ Docker Build │
│   & Push     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Deploy     │
│  (Manual)    │
└──────────────┘
```

---

## Optimizaciones Implementadas

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

## Soporte

Para problemas con el pipeline de CI/CD:
1. Revisar logs en la pestaña Actions
2. Verificar que todos los secrets estén configurados
3. Consultar este documento
4. Crear un issue en el repositorio

---

**Última actualización:** Enero 2026  
**Mantenido por:** Grupo 7 - Aplicaciones Web Avanzadas
