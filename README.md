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

Voz Segura es una plataforma web de denuncias anónimas que protege la identidad de los denunciantes desde el primer momento. El sistema garantiza confidencialidad, integridad y disponibilidad mediante la implementación de controles de seguridad robustos alineados con estándares internacionales.

### ✨ Características Principales

- 🔒 **Anonimato Real:** Sistema de identificación único sin datos personales
- 🛡️ **Cifrado de Contraseñas:** Hash con bcrypt (12 rounds de sal)
- 🔑 **Autenticación Segura:** JWT con expiración configurable (7 días)
- 👥 **Control de Acceso:** Basado en roles (RBAC) - Admin, Supervisor, Denunciante
- 📊 **Auditoría Completa:** Logs inmutables de todas las operaciones críticas
- 💬 **Chat en Tiempo Real:** WebSocket con Socket.IO para comunicación instantánea
- ⚙️ **CRUD Completo:** Operaciones Create, Read, Update, Delete sobre denuncias
- 🚫 **Bloqueo Inteligente:** Protección contra fuerza bruta (5 intentos, 15 min bloqueo)
- 📱 **Responsive Design:** Interfaz adaptable a dispositivos móviles y desktop
- 🎨 **UI Moderna:** Diseño intuitivo con Tailwind CSS  

---

## 🛠️ Stack Tecnológico

### Backend
- **Next.js 16** (App Router) - Framework fullstack con React Server Components
- **TypeScript 5** - Tipado estático y mejor DX
- **Prisma ORM 6** - ORM moderno con type-safety
- **PostgreSQL 14+** - Base de datos relacional
- **Socket.IO 4** - WebSocket para comunicación en tiempo real
- **JWT (jsonwebtoken)** - Autenticación basada en tokens
- **bcryptjs** - Hashing seguro de contraseñas (12 rounds)
- **Zod 4** - Validación de esquemas y datos

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

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| 👨‍💼 Admin | admin@vozsegura.com | Password123! | ADMIN |
| 👷 Supervisor 1 | supervisor1@vozsegura.com | Password123! | SUPERVISOR |
| 👷 Supervisor 2 | supervisor2@vozsegura.com | Password123! | SUPERVISOR |
| 🙋 Denunciante | denunciante@test.com | Password123! | DENUNCIANTE |

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 18.x o superior → [Descargar](https://nodejs.org/)
- **PostgreSQL** 14.x o superior → [Descargar](https://www.postgresql.org/)
- **Git** → [Descargar](https://git-scm.com/)
- **Editor:** VS Code recomendado → [Descargar](https://code.visualstudio.com/)

### 🔌 Extensiones VS Code Recomendadas

- ESLint
- Prettier - Code formatter
- Prisma
- Tailwind CSS IntelliSense
- GitLens

---

## 🚀 Instalación Detallada

### 1. Clonar Repositorio

```bash
git clone https://github.com/Sebasky26/voz-segura-system.git
cd voz-segura-system
npm install
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar el archivo .env con tus credenciales
# En Windows: notepad .env
# En Mac/Linux: nano .env
```

**Configuración de `.env`:**
```env
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/vozsegura"
JWT_SECRET="cambia-este-secret-por-uno-seguro-y-aleatorio"
JWT_EXPIRES_IN="7d"
MAX_LOGIN_ATTEMPTS="5"
LOCKOUT_DURATION_MINUTES="15"
```

⚠️ **IMPORTANTE:** 
- Reemplaza `TU_CONTRASEÑA` con la contraseña de tu usuario PostgreSQL
- Cambia `JWT_SECRET` por un valor aleatorio y seguro
- El archivo `.env` NUNCA se sube a Git (está en `.gitignore`)

### 3. Crear Base de Datos y Tablas

**Opción A - Normal (usa .env):**
```bash
npx prisma generate
npx prisma migrate dev --name init
```

**Opción B - Windows PowerShell (si .env no se lee):**
```powershell
$env:DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/vozsegura"
npx prisma generate
npx prisma migrate dev --name init
```

Esto creará automáticamente:
- Base de datos `vozsegura` (si no existe)
- 8 tablas: usuarios, denuncias, evidencias, historial_denuncias, mensajes_chat, auditoria_logs, configuraciones, _prisma_migrations

### 4. Poblar Datos de Prueba

```bash
npm run seed
```

**Windows PowerShell (si hay error):**
```powershell
$env:DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/vozsegura"
npm run seed
```

Esto crea 4 usuarios de prueba:
- **Admin:** admin@vozsegura.com | Password123!
- **Supervisor 1:** supervisor1@vozsegura.com | Password123!
- **Supervisor 2:** supervisor2@vozsegura.com | Password123!
- **Denunciante:** denunciante@test.com | Password123!

### 5. Iniciar Aplicación

```bash
npm run dev
```

✅ **Aplicación corriendo en:** http://localhost:3000

**Verifica que todo funciona:**
1. Accede a http://localhost:3000
2. Inicia sesión con cualquier usuario de prueba
3. Crea una denuncia anónima
4. Explora el dashboard

---

## 📜 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Iniciar aplicación
npm run build            # Compilar para producción
npm start                # Iniciar en producción

# Base de datos
npx prisma studio        # Ver datos en interfaz gráfica (http://localhost:5555)
npx prisma migrate reset # Resetear BD y datos
npm run seed             # Volver a poblar datos

# PostgreSQL
psql -U postgres -d vozsegura -c "\dt"                    # Ver tablas
psql -U postgres -d vozsegura -c "SELECT * FROM usuarios;" # Ver usuarios
```



---

## 🐛 Problemas Comunes

### ❌ `psql` no se reconoce

```powershell
# Añadir al PATH
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"
psql --version
```

### ❌ Error de conexión a PostgreSQL

```powershell
# Verificar que está corriendo
Get-Service -Name postgresql*

# Iniciar si está detenido
Start-Service -Name postgresql-x64-18
```

### ❌ Prisma Client not generated

```powershell
# Windows
$env:DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/vozsegura"; npx prisma generate

# Linux/Mac
export DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/vozsegura"
npx prisma generate
```

### ❌ Puerto 3000 en uso

```powershell
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```



---

## 📚 Documentación Adicional

### Enlaces Útiles

- [Documentación Next.js](https://nextjs.org/docs)
- [Documentación Prisma](https://www.prisma.io/docs)
- [Documentación PostgreSQL](https://www.postgresql.org/docs/)
- [Documentación Socket.IO](https://socket.io/docs/)
- [Documentación TypeScript](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Comandos Útiles

```bash
# Ver base de datos
npx prisma studio

# Formatear código
npm run lint

# Construcción para producción
npm run build

# Iniciar en producción
npm start

# Ver logs de Prisma
npx prisma migrate status
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