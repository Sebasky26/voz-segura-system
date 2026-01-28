# Guia de Configuracion de Secrets en GitHub

## Pasos para configurar los secrets

### 1. Crear Environments

1. Ve a tu repositorio en GitHub
2. Click en **Settings**
3. En el menu lateral, click en **Environments**
4. Click en **New environment**
5. Nombre: `staging` y click en **Configure environment**
6. Repite para crear `production`

### 2. Agregar Secrets a Staging

Ve a **Settings > Environments > staging > Add secret**

Copia los valores del archivo `.env.staging` y agregalos uno por uno:

| Secret Name | Valor (copiar de .env.staging) |
|-------------|-------------------------------|
| `AUTH_DB_PASSWORD` | `auth_staging_p4ssw0rd_2024_secure` |
| `DENUNCIAS_DB_PASSWORD` | `denuncias_staging_p4ssw0rd_2024_secure` |
| `LOGS_DB_PASSWORD` | `logs_staging_p4ssw0rd_2024_secure` |
| `JWT_SECRET` | `voz_segura_staging_jwt_secret_key_xK9mN2pQ8wR5tY7uI3oP6aS4dF1gH0jL` |
| `AUTH_DATABASE_URL` | `postgresql://auth_user:auth_staging_p4ssw0rd_2024_secure@auth-db:5432/auth_db` |
| `DENUNCIAS_DATABASE_URL` | `postgresql://denuncias_user:denuncias_staging_p4ssw0rd_2024_secure@denuncias-db:5432/denuncias_db` |
| `LOGS_DATABASE_URL` | `postgresql://logs_user:logs_staging_p4ssw0rd_2024_secure@logs-db:5432/logs_db` |
| `GRAFANA_ADMIN_PASSWORD` | `grafana_staging_admin_2024_secure` |
| `NEXT_PUBLIC_API_GATEWAY_URL` | `http://localhost:80` |

### 3. Agregar Secrets a Production

Ve a **Settings > Environments > production > Add secret**

Copia los valores del archivo `.env.production` y agregalos uno por uno:

| Secret Name | Valor (copiar de .env.production) |
|-------------|----------------------------------|
| `AUTH_DB_PASSWORD` | `auth_prod_sEcUr3_P@ssw0rd_2024_xYz` |
| `DENUNCIAS_DB_PASSWORD` | `denuncias_prod_sEcUr3_P@ssw0rd_2024_aBc` |
| `LOGS_DB_PASSWORD` | `logs_prod_sEcUr3_P@ssw0rd_2024_DeF` |
| `JWT_SECRET` | `voz_segura_prod_jwt_secret_M7nB9vC3xZ5aS2dF4gH6jK8lQ1wE0rT` |
| `AUTH_DATABASE_URL` | `postgresql://auth_user:auth_prod_sEcUr3_P@ssw0rd_2024_xYz@auth-db:5432/auth_db` |
| `DENUNCIAS_DATABASE_URL` | `postgresql://denuncias_user:denuncias_prod_sEcUr3_P@ssw0rd_2024_aBc@denuncias-db:5432/denuncias_db` |
| `LOGS_DATABASE_URL` | `postgresql://logs_user:logs_prod_sEcUr3_P@ssw0rd_2024_DeF@logs-db:5432/logs_db` |
| `GRAFANA_ADMIN_PASSWORD` | `grafana_prod_sEcUr3_2024_AdM1n` |
| `NEXT_PUBLIC_API_GATEWAY_URL` | `http://localhost:80` |

### 4. Configurar Permisos de Actions (IMPORTANTE)

1. Ve a **Settings > Actions > General**
2. En "Workflow permissions":
   - Selecciona **Read and write permissions**
   - Marca **Allow GitHub Actions to create and approve pull requests**
3. Click en **Save**

## Instrucciones Paso a Paso con Imagenes

### Como agregar un secret:

1. Settings > Environments > [staging o production]
2. Seccion "Environment secrets" > Click "Add secret"
3. En "Name" pon el nombre del secret (ejemplo: `AUTH_DB_PASSWORD`)
4. En "Value" pega el valor correspondiente del archivo .env
5. Click "Add secret"
6. Repite para cada secret de la tabla

## Verificar configuracion

Una vez configurados todos los secrets, puedes verificar ejecutando:

```bash
gh workflow run deploy.yml -f environment=staging -f tag=latest
```

Si todo esta bien configurado, el deployment deberia iniciar sin errores.

## Notas Importantes

- NO subas estos archivos .env.staging y .env.production a Git
- Los archivos estan en .gitignore automaticamente
- Estos secrets son ejemplos. Para produccion real, cambia los passwords
- Guarda estos archivos .env en un lugar seguro (password manager)

## Seguridad

Si necesitas cambiar alguna password despues:
1. Genera una nueva password segura
2. Actualiza el secret en GitHub
3. Actualiza tu archivo .env local
4. Re-despliega la aplicacion
