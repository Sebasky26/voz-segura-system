# 🛡️ VOZ SEGURA - Plataforma de Denuncias Anónimas

## 📌 Información del Proyecto

**Institución:** Escuela Politécnica Nacional  
**Facultad:** Ingeniería de Sistemas  
**Materia:** Aplicaciones Web Avanzadas  
**Grupo:** 7  
**Integrantes:**
- Sebastian Aisalla
- Jhoel Narváez
- Francis Velastegui

---

## 📖 Descripción

**Voz Segura** es una plataforma web de denuncias anónimas que protege la identidad de los denunciantes desde el primer momento. El sistema garantiza confidencialidad, integridad y disponibilidad mediante la implementación de controles de seguridad robustos alineados con estándares internacionales.

### ✨ Características Principales

- 🔒 **Anonimato Real:** Sistema de identificación único sin datos personales
- 🛡️ **Cifrado de Contraseñas:** Hash con bcrypt (12 rounds de sal)
- 🔑 **Autenticación Segura:** JWT con expiración configurable (7 días)
- 👥 **Control de Acceso:** Basado en roles (RBAC) - Admin, Supervisor, Denunciante
- 📊 **Auditoría Completa:** Logs inmutables de todas las operaciones críticas
- 💬 **Chat en Tiempo Real:** Comunicación bidireccional Admin-Usuario con Socket.IO
- ⚙️ **CRUD Completo:** Operaciones Create, Read, Update, Delete sobre denuncias
- 🚫 **Bloqueo Inteligente:** Protección contra fuerza bruta (5 intentos, 15 min bloqueo)
- 🔄 **Recuperación de Contraseña:** Sistema de verificación de identidad por múltiples campos
- 📱 **Responsive Design:** Interfaz adaptable a dispositivos móviles y desktop
- 🎨 **UI Moderna:** Diseño intuitivo con Tailwind CSS y gradientes profesionales

---

## 🛠️ Stack Tecnológico

### Backend
- **Next.js 16** (App Router) - Framework fullstack con React Server Components
- **TypeScript 5** - Tipado estático y mejor experiencia de desarrollo
- **Prisma ORM 6** - ORM moderno con type-safety
- **PostgreSQL 18.1** - Base de datos relacional robusta
- **Socket.IO 4** - WebSocket para comunicación en tiempo real
- **JWT (jsonwebtoken)** - Autenticación basada en tokens
- **bcryptjs** - Hashing seguro de contraseñas (12 rounds)
- **Zod 4** - Validación de esquemas y datos
- **tsx** - Ejecutor de TypeScript para servidor personalizado

### Frontend
- **React 19** - Librería UI con concurrent features
- **Tailwind CSS 4** - Framework CSS utility-first
- **Lucide React** - Iconos modernos y ligeros
- **Socket.IO Client** - Cliente WebSocket para chat en tiempo real

---

## ⚡ Inicio Rápido (Quick Start)

```bash
# 1. Clonar e instalar dependencias
git clone https://github.com/Sebasky26/voz-segura-system.git
cd voz-segura-system
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# 3. Preparar base de datos
npx prisma generate
npx prisma migrate dev --name init
npm run seed  # Crea usuarios de prueba

# 4. Iniciar aplicación
npm run dev
# ➜ Abrir http://localhost:3000
```

### 🔑 Credenciales de Prueba

| Usuario | Email | Contraseña | Rol | Teléfono |
|---------|-------|------------|-----|----------|
| 👨‍💼 Admin | admin@vozsegura.com | Password123! | ADMIN | 0999888777 |
| 👷 Supervisor 1 | supervisor1@vozsegura.com | Password123! | SUPERVISOR | 0988776655 |
| 👷 Supervisor 2 | supervisor2@vozsegura.com | Password123! | SUPERVISOR | 0977665544 |
| 🙋 Denunciante | denunciante@test.com | Password123! | DENUNCIANTE | 0966554433 |

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 18.x o superior → [Descargar](https://nodejs.org/)
- **PostgreSQL** 18.1 o superior → [Descargar](https://www.postgresql.org/)
- **Git** → [Descargar](https://git-scm.com/)
- **Editor:** VS Code recomendado → [Descargar](https://code.visualstudio.com/)

### 🔌 Extensiones VS Code Recomendadas

- ESLint
- Prettier - Code formatter
- Prisma
- Tailwind CSS IntelliSense
- GitLens

---

## 🚀 Instalación Detallada (Paso a Paso para Principiantes)

### Paso 1: Instalar PostgreSQL

1. **Descargar PostgreSQL:** Ve a [postgresql.org/download](https://www.postgresql.org/download/) y descarga la versión para tu sistema operativo
2. **Instalar:** Ejecuta el instalador y sigue las instrucciones
3. **Configurar contraseña:** Durante la instalación, te pedirá una contraseña para el usuario `postgres` - **¡Guarda esta contraseña!** La necesitarás después
4. **Puerto:** Deja el puerto por defecto `5432`
5. **Verificar instalación:** Abre una terminal y ejecuta:
   ```bash
   psql --version
   ```
   Deberías ver algo como: `psql (PostgreSQL) 18.1`

### Paso 2: Crear la Base de Datos

Abre **pgAdmin** (se instaló con PostgreSQL) o usa la terminal:

**Opción A - Con pgAdmin (Interfaz Visual):**
1. Abre pgAdmin
2. Conecta al servidor PostgreSQL (usa la contraseña que configuraste)
3. Click derecho en "Databases" → "Create" → "Database"
4. Nombre: `vozsegura`
5. Click en "Save"

**Opción B - Con Terminal:**
```bash
# Windows (PowerShell)
psql -U postgres

# Una vez dentro de psql, ejecuta:
CREATE DATABASE vozsegura;
\q
```

### Paso 3: Clonar el Repositorio

```bash
# Abre tu terminal y ejecuta:
git clone https://github.com/Sebasky26/voz-segura-system.git
cd voz-segura-system
```

### Paso 4: Instalar Dependencias

```bash
npm install
```

Esto descargará todas las librerías necesarias (puede tomar unos minutos).

### Paso 5: Configurar Variables de Entorno (.env)

1. **Copia el archivo de ejemplo:**
   ```bash
   # Windows (PowerShell)
   Copy-Item .env.example .env
   
   # Mac/Linux
   cp .env.example .env
   ```

2. **Edita el archivo `.env`:**
   - Abre el archivo `.env` con tu editor de código
   - Modifica las siguientes líneas:

```env
# ⚠️ REEMPLAZA "123" con tu contraseña de PostgreSQL
DATABASE_URL="postgresql://postgres:123@localhost:5432/vozsegura"

# ⚠️ CAMBIA este secret por algo aleatorio y seguro (mínimo 32 caracteres)
JWT_SECRET="tu-secret-super-seguro-cambiame-por-favor-123456"

# Tiempo de expiración del token (7 días)
JWT_EXPIRES_IN="7d"

# Intentos máximos de login fallidos antes de bloquear
MAX_LOGIN_ATTEMPTS="5"

# Duración del bloqueo en minutos
LOCKOUT_DURATION_MINUTES="15"
```

### Paso 6: Generar Cliente Prisma y Crear Tablas

```bash
# Genera el cliente de Prisma (crea los tipos TypeScript)
npx prisma generate

# Crea todas las tablas en la base de datos
npx prisma migrate dev --name init
```

**Alternativa - Windows PowerShell (si .env no se lee):**
```powershell
$env:DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/vozsegura"
npx prisma generate
npx prisma migrate dev --name init
```

✅ Esto creará automáticamente:
- Base de datos `vozsegura` (si no existe)
- 8 tablas: usuarios, denuncias, evidencias, historial_denuncias, mensajes_chat, auditoria_logs, configuraciones, _prisma_migrations

### Paso 7: Poblar Base de Datos con Usuarios de Prueba

```bash
npm run seed
```

**Alternativa - Windows PowerShell:**
```powershell
$env:DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/vozsegura"
npm run seed
```

✅ Esto crea 4 usuarios de prueba con los siguientes datos:

| Rol | Email | Contraseña | Nombre | Apellido | Teléfono |
|-----|-------|------------|--------|----------|----------|
| ADMIN | admin@vozsegura.com | Admin123! | Admin | Sistema | 0999888777 |
| SUPERVISOR | supervisor1@vozsegura.com | Supervisor123! | Juan | Pérez | 0988776655 |
| SUPERVISOR | supervisor2@vozsegura.com | Supervisor123! | María | García | 0977665544 |
| DENUNCIANTE | denunciante@test.com | Prueba123! | Usuario | Prueba | 0966554433 |

### Paso 8: Iniciar la Aplicación

```bash
npm run dev
```

✅ **¡Listo! La aplicación está corriendo en:** http://localhost:3000

Deberías ver en la terminal:

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║           🚀  VOZ SEGURA - Sistema de Denuncias          ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║   ✅ Servidor corriendo en: http://localhost:3000       ║
║   ✅ Socket.IO inicializado correctamente                  ║
║   ✅ Chat en tiempo real disponible                        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

### Paso 9: Prueba el Sistema

1. **Abre tu navegador** en http://localhost:3000
2. **Inicia sesión** con cualquier usuario de prueba (ver tabla arriba)
3. **Explora el dashboard:**
   - Como **Admin**: Verás todas las denuncias y chat con usuarios
   - Como **Usuario**: Verás solo tus denuncias y chat con admins
4. **Crea una denuncia** nueva desde el botón "Nueva Denuncia"
5. **Prueba el chat:**
   - Abre dos navegadores (uno normal, uno incógnito)
   - En uno inicia sesión como Admin
   - En otro inicia sesión como Usuario
   - Chatea en tiempo real entre ambos

---

## 💬 Sistema de Chat en Tiempo Real

### ¿Cómo Funciona el Chat?

El sistema de chat utiliza **Socket.IO** para comunicación bidireccional en tiempo real:

#### 👥 Roles y Permisos de Chat

**Administradores/Supervisores:**
- ✅ Pueden ver la lista de usuarios conectados
- ✅ Pueden chatear con cualquier usuario
- ✅ Ven todos los mensajes de todos los usuarios
- ✅ Aparecen como "En línea" para los usuarios

**Usuarios (Denunciantes):**
- ✅ Solo pueden chatear con administradores
- ❌ NO pueden chatear entre ellos (por seguridad y privacidad)
- ✅ Ven el estado del administrador (En línea/Offline)
- ✅ Reciben notificaciones cuando el admin escribe

#### 🔧 Características del Chat

- **Tiempo Real:** Los mensajes se envían y reciben instantáneamente
- **Indicador de Escritura:** "Usuario está escribiendo..."
- **Estado de Conexión:** Indicador verde/rojo de conectado/desconectado
- **Historial:** Los mensajes se guardan en la base de datos
- **Salas Privadas:** Cada usuario tiene su sala privada con el admin
- **Seguridad:** Solo Admin-Usuario, nunca Usuario-Usuario

#### 🧪 Probar el Chat (Dos Navegadores)

1. **Navegador 1 (Chrome normal):**
   ```
   http://localhost:3000
   Login: admin@vozsegura.com
   Password: Admin123!
   ```
   - Ve a "Chat" desde el dashboard
   - Verás la lista de usuarios online en el sidebar izquierdo

2. **Navegador 2 (Chrome Incógnito o Firefox):**
   ```
   http://localhost:3000
   Login: denunciante@test.com
   Password: Prueba123!
   ```
   - Ve a "Chat" desde el dashboard
   - Verás "Administradores - En línea"

3. **Interacción:**
   - En el Navegador 2 (Usuario), escribe un mensaje
   - En el Navegador 1 (Admin), aparecerá instantáneamente
   - El admin puede responder y el usuario lo verá en tiempo real

---

## ⚙️ Funcionalidades del Sistema

### 🔐 Autenticación y Seguridad

#### Inicio de Sesión
- Email y contraseña requeridos
- Validación de campos en tiempo real
- Mensajes de error específicos por campo
- Protección contra fuerza bruta (5 intentos, 15 min bloqueo)
- JWT con expiración de 7 días

#### Registro
- Campos: nombre, apellido, email, teléfono (10 dígitos), contraseña
- Validación de contraseña en tiempo real:
  - ✅ Mínimo 8 caracteres
  - ✅ Al menos una mayúscula
  - ✅ Al menos una minúscula
  - ✅ Al menos un número
  - ✅ Al menos un carácter especial
- Visualización de indicadores verdes conforme cumples requisitos
- Toggle para mostrar/ocultar contraseña

#### Recuperación de Contraseña
**Sistema de 2 Pasos:**

**Paso 1 - Verificación de Identidad:**
- Email
- Teléfono (10 dígitos)
- Nombre
- Apellido
- Validación secuencial: si falla, te dice exactamente qué campo está mal
- Resalta en rojo el campo incorrecto

**Paso 2 - Nueva Contraseña:**
- Contraseña nueva con validación en tiempo real
- Confirmar contraseña
- Indicadores visuales de requisitos cumplidos
- Toggle mostrar/ocultar contraseña

### 📝 Gestión de Denuncias (CRUD Completo)

#### ➕ Crear Denuncia
**Campos:**
- Título (mínimo 10 caracteres)
- Categoría: Acoso Laboral, Discriminación, Falta de Pago, Acoso Sexual, Violación de Derechos, Otro
- Prioridad: Baja, Media, Alta, Urgente
- Ubicación General (opcional)
- Descripción detallada (mínimo 50 caracteres)

**Características:**
- Código anónimo generado automáticamente
- Identidad del denunciante protegida
- Contador de caracteres en tiempo real
- Validación de campos obligatorios

#### 👁️ Ver Detalles (Botón Ojito)
**¿Para qué sirve?** Ver información completa de la denuncia sin editarla:
- Código de seguimiento único
- Estado actual (Pendiente, En Revisión, Aprobada, etc.)
- Prioridad con colores
- Categoría y ubicación
- Descripción completa
- Supervisor asignado (si hay)
- Evidencias adjuntas
- Fechas de creación y actualización

#### ✏️ Editar Denuncia (Botón Lápiz)
**Permisos:**
- **Usuarios:** Pueden editar solo sus propias denuncias
- **Admins:** Pueden editar cualquier denuncia

**Campos editables:**
- Título
- Descripción
- Categoría
- Prioridad
- Ubicación General

**Características:**
- Validación en tiempo real
- Contador de caracteres
- Mensaje de éxito con redirección automática
- Botón "Guardar Cambios" con indicador de carga

#### 🗑️ Eliminar Denuncia (Botón Papelera)
**Confirmación Mejorada:**
```
⚠️ CONFIRMACIÓN DE ELIMINACIÓN

¿Estás seguro de que deseas eliminar la siguiente denuncia?

"[Título de la denuncia]"

⚠️ Esta acción NO se puede deshacer.
⚠️ Se perderán todos los datos asociados (evidencias, comentarios, etc.)

¿Deseas continuar?
```

**Permisos:**
- **Usuarios:** Solo pueden eliminar sus propias denuncias
- **Admins:** Pueden eliminar cualquier denuncia
- **Supervisores:** NO pueden eliminar denuncias

#### 📊 Roles y Acceso a Denuncias

| Rol | Ver Denuncias | Crear | Editar | Eliminar |
|-----|---------------|-------|--------|----------|
| **ADMIN** | Todas | ✅ | Todas | Todas |
| **SUPERVISOR** | Asignadas | ✅ | Asignadas | ❌ |
| **DENUNCIANTE** | Propias | ✅ | Propias | Propias |

---

## 📜 Comandos de Referencia Rápida

### 🚀 Desarrollo

```bash
# Iniciar aplicación en desarrollo
npm run dev

# Compilar para producción
npm run build

# Iniciar en producción
npm start

# Ver errores de ESLint
npm run lint
```

### 💾 Base de Datos

```bash
# Ver datos en interfaz gráfica (Prisma Studio)
npx prisma studio
# Abre en http://localhost:5555 - Ver/editar todas las tablas

# Resetear base de datos (CUIDADO: Borra todo)
npx prisma migrate reset

# Volver a poblar datos de prueba después de reset
npm run seed

# Ver estado de migraciones
npx prisma migrate status

# Generar Prisma Client después de cambios en schema.prisma
npx prisma generate

# Crear nueva migración (después de editar schema.prisma)
npx prisma migrate dev --name nombre_migracion
```

### 🐘 PostgreSQL (Terminal)

```bash
# Ver todas las tablas
psql -U postgres -d vozsegura -c "\dt"

# Ver usuarios
psql -U postgres -d vozsegura -c "SELECT * FROM usuarios;"

# Ver todas las denuncias
psql -U postgres -d vozsegura -c "SELECT * FROM denuncias;"

# Contar denuncias por estado
psql -U postgres -d vozsegura -c "SELECT estado, COUNT(*) FROM denuncias GROUP BY estado;"

# Ver mensajes de chat
psql -U postgres -d vozsegura -c "SELECT * FROM mensajes_chat ORDER BY created_at DESC LIMIT 10;"
```

---

## 🐛 Solución de Problemas Comunes

### ❌ Error: `psql` no se reconoce como comando

**Causa:** PostgreSQL no está en el PATH de Windows.

**Solución Windows PowerShell:**
```powershell
# Opción 1: Añadir temporalmente (solo para esta terminal)
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"
psql --version

# Opción 2: Añadir permanentemente
# 1. Busca "Variables de entorno" en el menú de Windows
# 2. Clic en "Variables de entorno..."
# 3. En "Variables del sistema", edita "Path"
# 4. Añade: C:\Program Files\PostgreSQL\18\bin
# 5. Reinicia PowerShell
```

**Solución Linux/Mac:**
```bash
# Añadir a ~/.bashrc o ~/.zshrc
export PATH="/usr/lib/postgresql/18/bin:$PATH"
source ~/.bashrc  # o ~/.zshrc
```

---

### ❌ Error: "Connection refused" o "ECONNREFUSED"

**Causa:** PostgreSQL no está corriendo.

**Verificar Estado (Windows):**
```powershell
# Ver estado del servicio
Get-Service -Name postgresql*

# Si está "Stopped", iniciar
Start-Service -Name postgresql-x64-18

# Verificar que arrancó
Get-Service -Name postgresql-x64-18
```

**Verificar Estado (Linux):**
```bash
# Ver estado
sudo systemctl status postgresql

# Iniciar
sudo systemctl start postgresql

# Habilitar inicio automático
sudo systemctl enable postgresql
```

**Verificar Estado (Mac):**
```bash
# Ver estado
brew services list | grep postgresql

# Iniciar
brew services start postgresql@18
```

---

### ❌ Error: "Prisma Client not generated"

**Causa:** No se generó el cliente de Prisma después de clonar o cambios en schema.

**Solución Windows PowerShell:**
```powershell
$env:DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/vozsegura"
npx prisma generate
```

**Solución Linux/Mac:**
```bash
export DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/vozsegura"
npx prisma generate
```

**O simplemente:**
```bash
# Si ya tienes .env configurado
npx prisma generate
```

---

### ❌ Error: "Port 3000 already in use"

**Causa:** Ya hay un proceso usando el puerto 3000.

**Solución Windows PowerShell:**
```powershell
# Ver qué proceso usa el puerto 3000
netstat -ano | findstr :3000

# Matar el proceso (reemplaza [PID] con el número que viste)
taskkill /PID [PID] /F

# Ejemplo:
# netstat -ano | findstr :3000
# Output: TCP 0.0.0.0:3000 0.0.0.0:0 LISTENING 12345
# taskkill /PID 12345 /F
```

**Solución Linux/Mac:**
```bash
# Ver y matar proceso
lsof -ti:3000 | xargs kill -9

# O ver primero qué proceso es
lsof -i:3000
```

---

### ❌ Error: "Invalid credentials" al hacer login

**Posibles causas y soluciones:**

1. **Contraseña incorrecta:**
   - Verifica que uses las contraseñas correctas:
     - Admin: `Admin123!`
     - Usuario: `Prueba123!`
   - Las contraseñas distinguen mayúsculas/minúsculas

2. **Base de datos no poblada:**
   ```bash
   npm run seed
   ```

3. **Datos corruptos (resetear todo):**
   ```bash
   npx prisma migrate reset
   npm run seed
   ```

4. **Verificar usuario existe:**
   ```bash
   psql -U postgres -d vozsegura -c "SELECT email, nombre FROM usuarios;"
   ```

---

### ❌ Error: "Chat no conecta" o mensajes no llegan

**Diagnóstico:**

1. **Verificar Socket.IO está corriendo:**
   - Cuando ejecutas `npm run dev`, deberías ver:
   ```
   ✅ Socket.IO inicializado correctamente
   ✅ Chat en tiempo real disponible
   ```

2. **Verificar navegador tiene token:**
   - Abre DevTools (F12)
   - Ve a Application → Local Storage → http://localhost:3000
   - Debes ver:
     - `token`: "eyJhbGc..."
     - `user`: {"id":...}

3. **Reiniciar servidor:**
   - Ctrl+C para detener `npm run dev`
   - Volver a ejecutar `npm run dev`

4. **Limpiar localStorage y login de nuevo:**
   ```javascript
   // En consola del navegador (F12)
   localStorage.clear()
   // Luego recarga la página y vuelve a hacer login
   ```

---

### ❌ Error: "Cannot read properties of undefined" en editar denuncia

**Causa:** Campo `ubicacionGeneral` no existe en la denuncia antigua.

**Solución:**
```bash
# Opción 1: Actualizar esquema (ya aplicado)
npx prisma generate

# Opción 2: Resetear base de datos
npx prisma migrate reset
npm run seed
```

**Verificar en código:**
- Asegúrate que `src/app/api/denuncias/[id]/route.ts` incluya `ubicacionGeneral` en el schema de actualización

---

### ❌ Error: "Module not found" o errores de import

**Solución:**
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Windows PowerShell:
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

---

### ❌ Error: Variables de entorno no se leen

**Verificar archivo .env:**
```bash
# Debe estar en la raíz del proyecto
# Nombre exacto: .env (no .env.local ni .env.example)
```

**Contenido mínimo requerido:**
```env
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/vozsegura"
JWT_SECRET="tu-secreto-super-seguro-cambiar-en-produccion"
```

**Windows PowerShell alternativa:**
```powershell
# Si .env no funciona, usar variables de entorno temporales
$env:DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/vozsegura"
$env:JWT_SECRET="tu-secreto-super-seguro"
npm run dev
```

---

### ❌ Error: "TypeError: Cannot read properties of null (reading 'indexOf')"

**Causa:** Servidor Next.js no se detuvo correctamente y dejó archivo de bloqueo.

**Solución Windows PowerShell:**
```powershell
# Matar todos los procesos de Node.js
Get-Process -Name node | Stop-Process -Force

# Eliminar archivos de bloqueo
Remove-Item -Recurse -Force .next

# Reiniciar aplicación
npm run dev
```

**Solución Linux/Mac:**
```bash
# Matar procesos de Node.js
pkill -9 node

# Eliminar carpeta .next
rm -rf .next

# Reiniciar
npm run dev
```

---

### 📂 Estructura del Proyecto

```
voz-segura-system/
├── prisma/                    # Prisma ORM y migraciones
│   ├── schema.prisma         # Esquema de base de datos
│   ├── seed.ts               # Datos iniciales
│   └── migrations/           # Historial de migraciones
├── public/                    # Archivos estáticos
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (auth)/          # Rutas de autenticación (login, register, reset)
│   │   ├── api/             # API Routes
│   │   │   ├── auth/        # Endpoints de autenticación
│   │   │   ├── chat/        # API REST de chat
│   │   │   ├── denuncias/   # CRUD de denuncias
│   │   │   └── socketio/    # Socket.IO server
│   │   └── dashboard/       # Dashboard protegido
│   │       ├── chat/        # Página de chat
│   │       └── denuncias/   # Gestión de denuncias
│   └── lib/                  # Utilidades y configuración
│       ├── auth.ts          # JWT y autenticación
│       ├── prisma.ts        # Cliente de Prisma
│       └── auditoria.ts     # Sistema de auditoría
├── server.ts                 # Custom Next.js + Socket.IO server
├── .env                      # Variables de entorno (NO subir a Git)
├── package.json              # Dependencias
└── tsconfig.json             # Configuración TypeScript
```

### 🔄 Flujo de Datos

#### Autenticación (JWT)
```
1. Usuario envía email + password → /api/auth/login
2. Backend verifica credenciales en PostgreSQL
3. Si es válido, genera JWT token (7 días expiración)
4. Frontend guarda token en localStorage
5. Cada petición incluye token en header: Authorization: Bearer {token}
6. Middleware verifica token antes de acceder a rutas protegidas
```

#### Chat en Tiempo Real (Socket.IO)
```
1. Usuario hace login → recibe JWT token
2. Página /dashboard/chat se conecta a Socket.IO
3. Envía evento "authenticate" con el token
4. Servidor valida token y une usuario a salas:
   - Admins → "admin-room"
   - Usuarios → "user-{userId}"
5. Mensajes se emiten a salas específicas
6. Se guardan en tabla mensajes_chat en PostgreSQL
```

#### CRUD Denuncias
```
1. Crear: POST /api/denuncias → Genera código anónimo → Inserta en BD
2. Leer: GET /api/denuncias → Filtra por rol (admin ve todas, usuario solo propias)
3. Ver Detalles: GET /api/denuncias/[id] → Muestra info completa
4. Actualizar: PUT /api/denuncias/[id] → Valida permisos → Actualiza
5. Eliminar: DELETE /api/denuncias/[id] → Valida permisos → Elimina
```

### 🗄️ Modelo de Base de Datos

**Tablas principales:**

```sql
usuarios
- id (UUID)
- email (único)
- password (bcrypt hash)
- nombre, apellido, telefono
- rol (ADMIN, SUPERVISOR, DENUNCIANTE)
- intentos_fallidos, bloqueado_hasta
- created_at, updated_at

denuncias
- id (UUID)
- codigo (anónimo, generado automáticamente)
- titulo, descripcion
- categoria, prioridad, estado
- ubicacion_general
- usuario_id → usuarios(id)
- supervisor_id → usuarios(id) [nullable]
- created_at, updated_at

mensajes_chat
- id (UUID)
- contenido
- remitente_id → usuarios(id)
- destinatario_id → usuarios(id)
- leido (boolean)
- created_at

auditoria_logs
- id (UUID)
- usuario_id → usuarios(id)
- accion (LOGIN, CREATE_DENUNCIA, etc.)
- detalles (JSON)
- created_at
```

**Relaciones:**
- Un usuario tiene muchas denuncias (usuario_id)
- Un supervisor tiene muchas denuncias asignadas (supervisor_id)
- Los mensajes conectan dos usuarios (remitente y destinatario)

---

## 📚 Documentación Adicional

### 📖 Enlaces Útiles

- **Next.js:** [https://nextjs.org/docs](https://nextjs.org/docs)
- **Prisma ORM:** [https://www.prisma.io/docs](https://www.prisma.io/docs)
- **PostgreSQL:** [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)
- **Socket.IO:** [https://socket.io/docs/](https://socket.io/docs/)
- **TypeScript:** [https://www.typescriptlang.org/docs/](https://www.typescriptlang.org/docs/)
- **Tailwind CSS:** [https://tailwindcss.com/docs](https://tailwindcss.com/docs)

### 🎓 Tutoriales Recomendados

**Si eres nuevo en estas tecnologías:**

1. **Next.js:** [Tutorial oficial paso a paso](https://nextjs.org/learn)
2. **Prisma:** [Quickstart Guide](https://www.prisma.io/docs/getting-started/quickstart)
3. **Socket.IO:** [Get Started Guide](https://socket.io/get-started/chat)
4. **PostgreSQL:** [Tutorial básico](https://www.postgresqltutorial.com/)

### 🔧 Herramientas Útiles

```bash
# Prisma Studio - Interfaz gráfica para ver/editar BD
npx prisma studio

# Ver logs de migraciones
npx prisma migrate status

# Ver estructura de la BD
psql -U postgres -d vozsegura -c "\d+ usuarios"
```

---

## 👥 Contribuidores

Este proyecto fue desarrollado por el Grupo 7 como parte del proyecto de la materia Aplicaciones Web Avanzadas:

- **Sebastian Aisalla** - Desarrollo fullstack y arquitectura
- **Jhoel Narváez** - Backend y API REST
- **Francis Velastegui** - Frontend y UI/UX

---

## 📄 Licencia

Este proyecto es de uso académico para la Escuela Politécnica Nacional.

---

## 📞 Contacto

Para consultas sobre el proyecto, contactar a través de:
- **GitHub:** [Sebasky26/voz-segura-system](https://github.com/Sebasky26/voz-segura-system)
- **Issues:** [Reportar problema](https://github.com/Sebasky26/voz-segura-system/issues)

---

**Voz Segura** - Protegiendo a quienes alzan la voz 🛡️
