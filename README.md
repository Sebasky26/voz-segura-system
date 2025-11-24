# 🛡️ VOZ SEGURA - Plataforma de Denuncias Anónimas

## 📌 Información del Proyecto

**Institución:** Escuela Politécnica Nacional  
**Facultad:** Ingeniería de Sistemas  
**Materia:** Aplicaciones web avanzadas
**Grupo:** 7  
**Integrantes:**
- Sebastian Aisalla
- Jhoel Narváez
- Francis Velastegui
---

## 📖 Descripción

Voz Segura es una plataforma web de denuncias anónimas que protege la identidad de los denunciantes desde el primer momento. El sistema garantiza confidencialidad, integridad y disponibilidad mediante la implementación de controles de seguridad robustos alineados con estándares internacionales.

### Características Principales

 **Anonimato Real:** Sistema de identificación único sin datos personales  
 **Cifrado de Contraseñas:** Hash con bcrypt (12 rounds)  
 **Autenticación Segura:** JWT con expiración configurable  
 **Control de Acceso:** Basado en roles (RBAC)  
 **Auditoría Completa:** Logs de todas las operaciones críticas  
 **Chat en Tiempo Real:** WebSocket con Socket.IO  
 **CRUD Completo:** Operaciones sobre denuncias  
 **Bloqueo por Intentos Fallidos:** Protección contra fuerza bruta  

---

## 🛠️ Stack Tecnológico

### Backend
- **Next.js 14** (App Router) - Framework fullstack
- **TypeScript** - Tipado estático
- **Prisma ORM** - Gestión de base de datos
- **PostgreSQL** - Base de datos relacional
- **Socket.IO** - WebSocket para chat en tiempo real
- **JWT** - Autenticación basada en tokens
- **bcryptjs** - Hashing de contraseñas
- **Zod** - Validación de esquemas

### Frontend
- **React 18** - Librería UI
- **Tailwind CSS** - Estilos
- **Lucide React** - Iconos
- **Socket.IO Client** - Cliente WebSocket

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 18.x o superior → [Descargar](https://nodejs.org/)
- **PostgreSQL** 14.x o superior → [Descargar](https://www.postgresql.org/)
- **Git** → [Descargar](https://git-scm.com/)
- **Editor:** VS Code recomendado → [Descargar](https://code.visualstudio.com/)

### Extensiones VS Code Recomendadas

- ESLint
- Prettier - Code formatter
- Prisma
- Tailwind CSS IntelliSense
- GitLens

---

## 🚀 Instalación y Configuración

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/[tu-usuario]/voz-segura.git
cd voz-segura
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Configurar Base de Datos

#### 3.1 Crear Base de Datos en PostgreSQL

```bash
# Ingresar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE voz_segura;

# Verificar
\l

# Salir
\q
```

#### 3.2 Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Base de datos
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/voz_segura"

# JWT
JWT_SECRET="tu-secreto-super-seguro-cambiar-en-produccion"
JWT_EXPIRES_IN="7d"

# Aplicación
NODE_ENV="development"
PORT=3000
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Seguridad
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15

# OTP
OTP_EXPIRATION_MINUTES=5

# WebSocket
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
```

**IMPORTANTE:** Reemplaza `TU_PASSWORD` con tu contraseña de PostgreSQL.

### Paso 4: Crear Tablas en la Base de Datos

```bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones (crear tablas)
npx prisma migrate dev --name init

# Ver base de datos en interfaz gráfica (opcional)
npx prisma studio
```

### Paso 5: Poblar con Datos Iniciales

```bash
npm run prisma:seed
```

Este comando creará usuarios de prueba:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@vozsegura.com | Password123! |
| Supervisor 1 | supervisor1@vozsegura.com | Password123! |
| Supervisor 2 | supervisor2@vozsegura.com | Password123! |
| Denunciante | denunciante@test.com | Password123! |

### Paso 6: Ejecutar la Aplicación

```bash
# Modo desarrollo
npm run dev
```

Abrir navegador en: **http://localhost:3000**

---

## 📂 Estructura del Proyecto

```
voz-segura/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   └── seed.ts                # Datos iniciales
│
├── src/
│   ├── lib/
│   │   ├── prisma.ts          # Cliente de Prisma
│   │   ├── auth.ts            # Funciones de autenticación
│   │   └── auditoria.ts       # Sistema de logs
│   │
│   ├── app/
│   │   ├── api/               # Endpoints backend
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── register/route.ts
│   │   │   │   └── reset-password/route.ts
│   │   │   ├── denuncias/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   └── chat/route.ts
│   │   │
│   │   ├── (auth)/            # Páginas de autenticación
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── reset-password/
│   │   │
│   │   └── dashboard/         # Páginas del sistema
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── denuncias/
│   │       └── chat/
│   │
│   └── components/            # Componentes reutilizables
│
├── .env                       # Variables de entorno
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## 🎯 Funcionalidades Implementadas

### 1. Sistema de Autenticación (RF-12, RF-14)

####  Login (SignIn)
- Validación de credenciales
- Cifrado de contraseñas con bcrypt
- Generación de JWT
- Control de intentos fallidos (máx. 5)
- Bloqueo temporal (15 minutos)
- Registro en auditoría

####  Registro (SignUp)
- Validación de fortaleza de contraseña:
  - Mínimo 8 caracteres
  - Al menos 1 mayúscula
  - Al menos 1 minúscula
  - Al menos 1 número
  - Al menos 1 carácter especial
- Hash seguro (bcrypt con 12 rounds)
- Asignación de roles

####  Reset Password (Olvidé Clave)
- Generación de OTP de 6 dígitos
- Expiración en 5 minutos
- Validación de código
- Cambio seguro de contraseña

### 2. Gestión de Denuncias (CRUD)

####  Create (Crear)
- Generación de código anónimo único
- Categorización (Acoso, Discriminación, etc.)
- Priorización (Baja, Media, Alta, Urgente)
- Sin exposición de datos personales

####  Read (Leer/Consultar)
- Listado completo
- Filtros por estado y categoría
- Búsqueda por título/código
- Control de acceso por rol:
  - Supervisores: solo casos asignados
  - Denunciantes: solo propias
  - Admin: todas

####  Update (Actualizar)
- Cambio de estado
- Asignación a supervisores
- Historial de cambios
- Registro en auditoría

####  Delete (Eliminar)
- Solo administradores
- Confirmación requerida
- Eliminación en cascada (evidencias e historial)
- Registro en auditoría

### 3. Chat en Tiempo Real (WebSocket)

####  Características
- Comunicación bidireccional con Socket.IO
- Mensajes en tiempo real
- Persistencia en base de datos
- Historial de conversación
- Indicador de estado de conexión
- Usuarios en línea
- Identificación por roles

### 4. Seguridad Implementada

####  Confidencialidad (RF-07, RF-10)
- Cifrado de contraseñas (bcrypt)
- Tokens JWT firmados
- Comunicación HTTPS (en producción)
- Anonimato en denuncias

####  Integridad (RF-08, RF-11)
- Validación de entrada con Zod
- Verificación de tokens
- Detección de modificaciones no autorizadas

####  Disponibilidad
- Manejo de errores robusto
- Timeouts configurables
- Bloqueo temporal en lugar de permanente

####  Autenticación (RF-12, RF-13)
- JWT con expiración
- Control de sesión
- Verificación en cada request

####  No Repudio (RNF-S3)
- Auditoría completa
- Logs inmutables
- Trazabilidad de acciones

### 5. Control de Acceso (RF-01, RF-02)

#### Roles Implementados

| Rol | Permisos |
|-----|----------|
| **DENUNCIANTE** | - Crear denuncias<br>- Ver propias denuncias<br>- Subir evidencias<br>- Usar chat |
| **SUPERVISOR** | - Ver casos asignados<br>- Actualizar estado<br>- Aprobar denuncias<br>- Derivar casos<br>- Usar chat |
| **ADMIN** | - Acceso completo<br>- Gestionar usuarios<br>- Asignar casos<br>- Eliminar denuncias<br>- Consultar auditoría |

### 6. Auditoría y Logs (RNF-S3, RNF-S5)

#### Eventos Registrados
- Login exitoso/fallido
- Creación de denuncias
- Cambios de estado
- Asignaciones
- Derivaciones
- Acceso a evidencias
- Modificaciones de datos

#### Información Capturada
- Usuario que realiza la acción
- Timestamp
- Acción realizada
- Recurso afectado
- Detalles en JSON
- IP y User-Agent (cuando aplica)
- Resultado (éxito/fallo)

---

## 🧪 Pruebas

### Flujo de Prueba Completo

#### 1. Autenticación

```bash
# 1. Abrir http://localhost:3000
# 2. Click en "Regístrate aquí"
# 3. Llenar formulario con:
#    - Email: test@test.com
#    - Contraseña: Test123!@#
#    - Confirmar contraseña: Test123!@#
#    - Nombre: Test
#    - Apellido: Usuario
#    - Teléfono: 0999999999
# 4. Click en "Crear Cuenta"
# 5. Redirige automáticamente al login
# 6. Ingresar credenciales creadas
# 7. Redirige a /dashboard
```

#### 2. CRUD de Denuncias

```bash
# 1. En dashboard, click en "Denuncias"
# 2. Click en "Nueva Denuncia"
# 3. Llenar formulario:
#    - Título: "Prueba de denuncia anónima"
#    - Descripción: (mínimo 50 caracteres)
#    - Categoría: Seleccionar una
# 4. Click en "Crear Denuncia"
# 5. Verificar que aparece en la lista
# 6. Click en ícono de ojo (ver)
# 7. Click en ícono de lápiz (editar)
# 8. Modificar y guardar
# 9. Verificar cambios
```

#### 3. Chat en Tiempo Real

```bash
# 1. Click en "Chat" en el menú
# 2. Escribir un mensaje
# 3. Presionar Enter o click en enviar
# 4. Abrir otra ventana en modo incógnito
# 5. Iniciar sesión con otro usuario
# 6. Ir al chat
# 7. Verificar que aparecen ambos usuarios
# 8. Enviar mensajes entre usuarios
# 9. Verificar recepción en tiempo real
```

#### 4. Reset de Contraseña

```bash
# 1. En login, click en "¿Olvidaste tu contraseña?"
# 2. Ingresar email registrado
# 3. En consola del servidor, copiar el código OTP
# 4. Ingresar código OTP
# 5. Ingresar nueva contraseña (cumpliendo políticas)
# 6. Confirmar nueva contraseña
# 7. Click en "Restablecer"
# 8. Volver a login
# 9. Iniciar sesión con nueva contraseña
```

### Usuarios de Prueba

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Admin | admin@vozsegura.com | Password123! | ADMIN |
| Supervisor 1 | supervisor1@vozsegura.com | Password123! | SUPERVISOR |
| Supervisor 2 | supervisor2@vozsegura.com | Password123! | SUPERVISOR |
| Denunciante | denunciante@test.com | Password123! | DENUNCIANTE |

---

## 📊 Cumplimiento de Rúbrica

| Ítem | Peso | Archivo/Implementación | Estado |
|------|------|------------------------|--------|
| 1. Introducción/Planteamiento | 5% | Documento PDF |  |
| 2. Objetivos y cronograma | 5% | Documento PDF |  |
| 3. Requerimientos funcionales | 10% | prisma/schema.prisma + Docs |  |
| 4. Diagrama de arquitectura | 5% | Presentación |  |
| 5. **Pantalla Login** | 10% | src/app/(auth)/login/page.tsx |  |
| 6. **Pantalla SignUp** | 10% | src/app/(auth)/register/page.tsx |  |
| 7. **Pantalla Reset** | 10% | src/app/(auth)/reset-password/page.tsx |  |
| 8. **Pantalla CRUD** | 15% | src/app/dashboard/denuncias/ |  |
| 9. **Pantalla Chat** | 10% | src/app/dashboard/chat/page.tsx |  |
| 10. **Base de Datos** | 10% | PostgreSQL + Prisma |  |
| 11. **Repositorio** | 5% | GitHub público |  |
| 12. **Presentación** | 15% | PowerPoint/Canva | ⏳ |

**TOTAL: 100%** 

---

## 🔒 Requerimientos de Seguridad Cumplidos

### Common Criteria (CC)

| ID | Requerimiento | Implementación |
|----|---------------|----------------|
| **RF-01** | FDP_ACC.2 - Control de acceso completo | Middleware de autenticación + Prisma RLS |
| **RF-02** | FDP_ACF.1 - Control basado en atributos | Roles y permisos por usuario |
| **RF-03** | FDP_IFC.2 - Control de flujo | Validación de acceso a recursos |
| **RF-07** | FDP_SDC.1 - Confidencialidad almacenada | bcrypt para contraseñas |
| **RF-08** | FDP_SDI.2 - Monitoreo de integridad | Auditoría de cambios |
| **RF-12** | FIA_AFL.1 - Fallos de autenticación | Bloqueo tras 5 intentos |
| **RF-13** | FIA_ATD.1 - Atributos de usuario | Modelo Usuario completo |
| **RF-14** | FIA_SOS.1 - Verificación de secretos | Validación de contraseñas robustas |
| **RF-15** | FIA_SOS.2 - Generación de secretos | OTP y códigos anónimos |

### Requerimientos No Funcionales

| ID | Requisito | Implementación |
|----|-----------|----------------|
| **RNF-S1** | Cifrado en tránsito | TLS/HTTPS (en producción) |
| **RNF-S2** | Tiempo máximo de sesión | JWT con expiración configurable |
| **RNF-S3** | Auditoría y trazabilidad | Sistema de logs completo |
| **RNF-S5** | Protección de logs | Base de datos con acceso restringido |

---

## 🐛 Solución de Problemas

### Error: "Connection refused" al conectar a PostgreSQL

```bash
# Verificar que PostgreSQL está corriendo
# Windows:
services.msc

# macOS/Linux:
sudo systemctl status postgresql

# Verificar credenciales en .env
```

### Error: "Prisma Client not generated"

```bash
npx prisma generate
```

### Error: "Port 3000 already in use"

```bash
# Cambiar puerto en .env
PORT=3001

# O matar proceso:
# Windows:
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9
```

### Error de migración de Prisma

```bash
# Resetear base de datos (CUIDADO: elimina datos)
npx prisma migrate reset

# Volver a crear
npx prisma migrate dev --name init
npm run prisma:seed
```

---

## 📚 Documentación Adicional

### Enlaces Útiles

- [Documentación Next.js](https://nextjs.org/docs)
- [Documentación Prisma](https://www.prisma.io/docs)
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

Este proyecto fue desarrollado por el Grupo 7 como parte del proyecto bimestral de la materia Desarrollo de Software Seguro:

- **Sebastian Aisalla** - Control de acceso y cifrado
- **Jhoel Narváez** - Autenticación y JWT
- **Francis Velastegui** - Chat y WebSocket
- **Marlon Vinueza** - CRUD de denuncias
- **Stalin Yungan** - Auditoría y base de datos

---

## 📄 Licencia

Este proyecto es de uso académico para la Escuela Politécnica Nacional.

---

## 📞 Contacto

Para consultas sobre el proyecto, contactar a través de:
- **Email:** [emails del grupo]
- **GitHub:** [usuario/repo]

---

**Voz Segura** - Protegiendo a quienes alzan la voz 🛡️