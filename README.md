# Voz Segura - Sistema de Denuncias Anónimas

## Información del Proyecto

**Institución:** Escuela Politécnica Nacional  
**Facultad:** Ingeniería de Sistemas  
**Materia:** Aplicaciones Web Avanzadas  
**Grupo:** 7  
**Integrantes:**
- Sebastian Aisalla
- Jhoel Narváez  
- Francis Velastegui

---

## Descripción

Voz Segura es una plataforma web para la gestión confidencial de denuncias laborales que garantiza el anonimato completo del denunciante. El sistema implementa controles de seguridad robustos alineados con estándares internacionales, protegiendo la identidad de los usuarios desde el primer momento.

### Características Principales

- **Anonimato Real:** Código único de seguimiento sin almacenar datos personales identificables
- **Seguridad de Datos:** Contraseñas hasheadas con bcrypt (12 rounds), tokens JWT con expiración configurable
- **Control de Acceso Basado en Roles (RBAC):** Tres roles diferenciados: Administrador, Supervisor y Denunciante
- **Sistema de Auditoría:** Logs inmutables de todas las operaciones críticas del sistema
- **Chat en Tiempo Real:** Comunicación bidireccional anónima entre denunciante y supervisor asignado mediante Socket.IO
- **Operaciones CRUD Completas:** Crear, leer, actualizar y eliminar denuncias con permisos granulares
- **Protección contra Fuerza Bruta:** Bloqueo temporal tras 5 intentos fallidos por 15 minutos
- **Gestión de Estados:** Flujo de trabajo definido para el ciclo de vida de denuncias
- **Responsive Design:** Interfaz adaptable a dispositivos móviles y escritorio

---

## Arquitectura del Sistema

### Stack Tecnológico

#### Backend
- **Next.js 15** - Framework fullstack con App Router y React Server Components
- **TypeScript 5** - Lenguaje tipado estáticamente
- **Prisma ORM 6.19.0** - Object-Relational Mapper con type-safety
- **PostgreSQL 14+** - Sistema de gestión de bases de datos relacional
- **Socket.IO 4** - Biblioteca para WebSockets y comunicación en tiempo real
- **JWT (jsonwebtoken)** - Autenticación basada en tokens
- **bcryptjs** - Hashing criptográfico de contraseñas (12 rounds)
- **Zod** - Validación de esquemas y datos

#### Frontend
- **React 19** - Librería UI con funciones concurrentes
- **Tailwind CSS 4** - Framework CSS utility-first
- **Lucide React** - Biblioteca de iconos modernos
- **Socket.IO Client** - Cliente WebSocket

### Justificación Técnica

#### ¿Por qué Next.js?

**Ventajas:**
- **Framework Full-Stack:** Combina frontend (React) y backend (API Routes) en un solo proyecto, eliminando la necesidad de mantener dos repositorios separados
- **Server-Side Rendering (SSR):** Mejora SEO y rendimiento de carga inicial al renderizar páginas en el servidor
- **API Routes:** Permite crear endpoints RESTful sin configurar un servidor Express separado
- **File-Based Routing:** El sistema de archivos define automáticamente las rutas de la aplicación, reduciendo boilerplate
- **Code Splitting Automático:** Next.js divide el código en chunks más pequeños que se cargan bajo demanda
- **Hot Module Replacement (HMR):** Recarga en caliente durante desarrollo sin perder el estado de la aplicación

**Alternativas Consideradas:**
- **Express + React (SPA):** Requiere configuración manual de dos proyectos separados
- **Django + React:** Curva de aprendizaje de Python y configuración más compleja
- **Laravel + Vue:** Similar a Django, pero con PHP

**Conclusión:** Next.js ofrece la mejor relación entre productividad, rendimiento y mantenibilidad para un proyecto de este alcance.

#### ¿Por qué PostgreSQL?

**Ventajas:**
- **ACID Compliance:** Garantiza integridad de datos con transacciones atómicas, consistentes, aisladas y duraderas
- **Relaciones Complejas:** Soporte nativo para claves foráneas, índices compuestos y consultas JOIN optimizadas
- **Tipos de Datos Avanzados:** JSON/JSONB para almacenar detalles de auditoría flexibles
- **Escalabilidad:** Maneja millones de registros con rendimiento consistente mediante particionamiento
- **Seguridad:** Autenticación robusta, roles granulares y encriptación de datos en reposo
- **Open Source:** Sin costos de licenciamiento, comunidad activa

**Alternativas Consideradas:**
- **MongoDB (NoSQL):** Falta de relaciones nativas dificulta la integridad referencial entre usuarios, denuncias y mensajes
- **MySQL:** Similar a PostgreSQL pero con menor soporte para tipos avanzados y funciones analíticas
- **SQLite:** No apto para producción con múltiples usuarios concurrentes

**Conclusión:** PostgreSQL es el estándar de facto para aplicaciones empresariales que requieren integridad de datos y consultas complejas.

#### ¿Por qué Prisma ORM?

**Ventajas:**
- **Type-Safety Total:** Genera tipos TypeScript automáticamente desde el esquema, eliminando errores en tiempo de ejecución
- **Migraciones Automáticas:** Control de versiones del esquema de base de datos con comandos simples
- **Query Builder Intuitivo:** API declarativa para consultas complejas sin escribir SQL manualmente
- **Relaciones Tipadas:** Navegación segura entre modelos con autocompletado en el IDE
- **Prisma Studio:** Interfaz gráfica integrada para visualizar y editar datos

**Alternativas Consideradas:**
- **TypeORM:** Configuración más compleja, decoradores verbosos
- **Sequelize:** API menos intuitiva, sin type-safety nativa
- **SQL Puro:** Propenso a errores, sin validación en tiempo de compilación

**Conclusión:** Prisma ofrece la mejor experiencia de desarrollo con TypeScript, reduciendo bugs y acelerando el desarrollo.

#### ¿Por qué Socket.IO?

**Ventajas:**
- **Comunicación Bidireccional:** Cliente y servidor pueden enviar mensajes en cualquier momento
- **Reconexión Automática:** Maneja desconexiones de red y reconecta al cliente automáticamente
- **Salas (Rooms):** Permite crear canales privados para conversaciones aisladas entre denunciante y supervisor
- **Fallback a Long Polling:** Funciona incluso en redes con firewalls que bloquean WebSockets
- **Amplia Compatibilidad:** Soporta navegadores antiguos (IE11+) y dispositivos móviles

**Alternativas Consideradas:**
- **WebSockets Nativos:** Requiere implementar manualmente reconexión, salas y fallbacks
- **Server-Sent Events (SSE):** Solo comunicación unidireccional (servidor → cliente)
- **Polling HTTP:** Latencia alta, desperdicio de recursos

**Conclusión:** Socket.IO abstrae la complejidad de WebSockets y proporciona funcionalidades listas para usar.

---

## Estructura del Proyecto

```
voz-segura-system/
│
├── prisma/
│   ├── migrations/                    # Historial de cambios en base de datos
│   │   ├── 20251124233750_init/       # Migración inicial
│   │   ├── 20251125124005_ajustes_permisos_y_auditoria/
│   │   └── 20251125130303_fix_chat_schema/
│   ├── schema.prisma                  # Definición del modelo de datos
│   └── seed.ts                        # Datos iniciales para desarrollo
│
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── (auth)/                    # Grupo de rutas de autenticación
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   │
│   │   ├── api/                       # Backend API Routes
│   │   │   ├── auth/                  # Endpoints de autenticación
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── register/route.ts
│   │   │   │   └── reset-password/route.ts
│   │   │   ├── denuncias/             # CRUD de denuncias
│   │   │   │   ├── route.ts           # GET (listar), POST (crear)
│   │   │   │   └── [id]/route.ts      # GET, PUT, DELETE por ID
│   │   │   ├── chat/route.ts          # Mensajes anónimos
│   │   │   ├── auditoria/route.ts     # Logs del sistema (admin only)
│   │   │   └── socketio/server.ts     # Configuración de Socket.IO
│   │   │
│   │   ├── dashboard/                 # Panel de control protegido
│   │   │   ├── layout.tsx             # Layout con sidebar y navegación
│   │   │   ├── page.tsx               # Dashboard principal con cards
│   │   │   ├── denuncias/
│   │   │   │   ├── page.tsx           # Lista de denuncias con acciones
│   │   │   │   ├── crear/page.tsx     # Formulario de nueva denuncia
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx       # Detalle de denuncia
│   │   │   │       ├── editar/page.tsx
│   │   │   │       ├── estado/page.tsx  # Cambio de estado (supervisor)
│   │   │   │       └── chat/page.tsx    # Chat anónimo de la denuncia
│   │   │   ├── chat/page.tsx          # Chat general (deprecado)
│   │   │   └── auditoria/page.tsx     # Logs del sistema (admin)
│   │   │
│   │   ├── globals.css                # Estilos globales con Tailwind
│   │   ├── layout.tsx                 # Root layout con metadatos
│   │   └── page.tsx                   # Página de inicio pública
│   │
│   └── lib/                           # Utilidades y lógica compartida
│       ├── auth.ts                    # JWT, bcrypt, verificación de tokens
│       ├── auditoria.ts               # Sistema de logs y auditoría
│       └── prisma.ts                  # Cliente de Prisma singleton
│
├── public/                            # Archivos estáticos (imágenes, fuentes)
│
├── scripts/
│   └── seed-users.js                  # Script auxiliar de población de usuarios
│
├── .env                               # Variables de entorno (NO versionar)
├── .env.example                       # Ejemplo de variables de entorno
├── .gitignore                         # Archivos ignorados por Git
├── eslint.config.mjs                  # Configuración de ESLint
├── next.config.ts                     # Configuración de Next.js
├── package.json                       # Dependencias y scripts npm
├── postcss.config.mjs                 # Configuración de PostCSS
├── server.ts                          # Servidor personalizado con Socket.IO
├── tailwind.config.ts                 # Configuración de Tailwind CSS
├── tsconfig.json                      # Configuración de TypeScript
└── README.md                          # Este archivo
```

### Descripción de Directorios Clave

#### `/prisma`
- **Propósito:** Configuración y gestión de la base de datos
- **schema.prisma:** Define modelos, relaciones, índices y restricciones
- **migrations/:** Historial versionado de cambios en el esquema
- **seed.ts:** Población inicial de datos de prueba (usuarios, denuncias, mensajes)

#### `/src/app/api`
- **Propósito:** Backend API con Next.js API Routes
- **Ventaja:** Co-ubicado con el frontend, sin necesidad de CORS
- **Patrón:** Cada carpeta representa un endpoint (`/api/auth/login` → `auth/login/route.ts`)
- **Seguridad:** Middleware de autenticación valida JWT en rutas protegidas

#### `/src/app/dashboard`
- **Propósito:** Área protegida de la aplicación (requiere autenticación)
- **Layout:** `layout.tsx` valida sesión y muestra sidebar de navegación
- **Rutas Dinámicas:** `[id]` permite URLs como `/dashboard/denuncias/abc-123`

#### `/src/lib`
- **Propósito:** Lógica de negocio reutilizable
- **auth.ts:** Generación de JWT, hash de contraseñas, verificación de tokens
- **auditoria.ts:** Registro de logs con IP, user-agent y detalles JSON
- **prisma.ts:** Singleton del cliente Prisma para evitar múltiples conexiones

---

## Requisitos Previos

### Software Necesario

- **Node.js:** >= 18.0.0 ([Descargar](https://nodejs.org/))
- **PostgreSQL:** >= 14.0 ([Descargar](https://www.postgresql.org/))
- **npm, yarn o pnpm:** Gestor de paquetes (npm viene con Node.js)
- **Git:** Control de versiones ([Descargar](https://git-scm.com/))

### Verificar Instalación

```bash
# Node.js
node --version  # Debe mostrar v18.x.x o superior

# npm
npm --version   # Debe mostrar 8.x.x o superior

# PostgreSQL
psql --version  # Debe mostrar 14.x o superior

# Git
git --version   # Debe mostrar 2.x.x o superior
```

---

## Instalación

### 1. Clonar Repositorio

```bash
git clone https://github.com/Sebasky26/voz-segura-system.git
cd voz-segura-system
```

### 2. Instalar Dependencias

```bash
npm install
```

Esto instalará:
- **Producción:** next, react, prisma, socket.io, bcryptjs, jsonwebtoken, zod
- **Desarrollo:** typescript, eslint, tailwindcss, @types/node

### 3. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/vozsegura"

# Ejemplo:
# DATABASE_URL="postgresql://postgres:admin123@localhost:5432/vozsegura"

# JWT Configuration
JWT_SECRET="clave-secreta-super-segura-cambiar-en-produccion-min-32-caracteres"
JWT_EXPIRES_IN="7d"

# Security Settings
MAX_LOGIN_ATTEMPTS="5"
LOCKOUT_DURATION_MINUTES="15"
```

**Importante:**
- Cambiar `usuario` y `contraseña` por tus credenciales de PostgreSQL
- Generar `JWT_SECRET` seguro:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### 4. Configurar Base de Datos

#### Opción A: Usando Prisma CLI (Recomendado)

```bash
# Crear base de datos y ejecutar migraciones
npx prisma migrate deploy

# Poblar base de datos con datos de prueba
npx prisma db seed
```

#### Opción B: Manualmente con psql

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE vozsegura;

# Salir de psql
\q

# Ejecutar migraciones
npx prisma migrate deploy

# Poblar datos
npx prisma db seed
```

### 5. Generar Cliente de Prisma

```bash
npx prisma generate
```

Esto genera:
- Tipos TypeScript basados en `schema.prisma`
- Cliente tipado para consultas de base de datos

---

## Configuración

### Usuarios de Prueba

Después de ejecutar `npx prisma db seed`:

| Rol          | Email                     | Contraseña    | Nombre  | Apellido   |
|--------------|---------------------------|---------------|---------|------------|
| Admin        | admin@vozsegura.com       | Password123!  | Juan    | Pérez      |
| Supervisor   | supervisor1@vozsegura.com | Password123!  | María   | González   |
| Denunciante  | denunciante@test.com      | Password123!  | Carlos  | Rodríguez  |

---

## Uso

### Modo Desarrollo

```bash
npm run dev
```

**Servidor disponible en:** http://localhost:3000

**Características en desarrollo:**
- Hot Module Replacement (cambios sin recargar página)
- Errores detallados en consola y navegador
- Source maps habilitados

### Modo Producción

```bash
# Compilar aplicación
npm run build

# Iniciar servidor de producción
npm start
```

**Optimizaciones en producción:**
- Código minificado y ofuscado
- Imágenes optimizadas automáticamente
- CSS purgado (solo estilos usados)
- Compresión gzip habilitada

### Comandos Adicionales

```bash
# Ver base de datos en interfaz gráfica
npx prisma studio
# Abre http://localhost:5555

# Crear nueva migración
npx prisma migrate dev --name nombre_descriptivo

# Resetear base de datos (CUIDADO: elimina todos los datos)
npx prisma migrate reset

# Ver estado de migraciones
npx prisma migrate status

# Lint de código
npm run lint
```

---

## Roles de Usuario

### 1. Denunciante

**Permisos:**
- Crear denuncias anónimas con código de seguimiento único
- Ver lista de sus propias denuncias
- Editar título, descripción, categoría y prioridad de sus denuncias
- Eliminar sus denuncias (con confirmación)
- Chat anónimo con el supervisor asignado a su denuncia
- Adjuntar evidencias (futuro)

**Restricciones:**
- NO puede ver denuncias de otros usuarios
- NO puede cambiar el estado de la denuncia (solo el supervisor)
- NO puede asignarse un supervisor manualmente

### 2. Supervisor

**Permisos:**
- Ver lista de denuncias asignadas a él
- Ver detalles completos de denuncias asignadas
- Cambiar estado de denuncias:
  - PENDIENTE
  - EN_REVISION
  - APROBADA
  - DERIVADA
  - CERRADA
  - RECHAZADA
- Agregar comentarios al cambiar estado
- Chat anónimo con denunciantes de sus casos asignados
- Derivar denuncias a instituciones externas

**Restricciones:**
- NO puede ver la identidad del denunciante (nombre, email, teléfono)
- NO puede editar el contenido de la denuncia (título, descripción)
- NO puede eliminar denuncias
- NO puede ver denuncias no asignadas a él
- NO puede acceder a logs de auditoría

### 3. Administrador

**Permisos:**
- Ver todas las denuncias del sistema (sin datos personales de denunciantes)
- Consultar logs de auditoría completos:
  - Filtrar por acción (LOGIN, CREAR_DENUNCIA, etc.)
  - Filtrar por tabla (Usuario, Denuncia, MensajeChat)
  - Búsqueda por usuario
  - Rango de fechas
- Ver estadísticas del sistema:
  - Total de logs
  - Acciones exitosas/fallidas
  - Usuarios únicos registrados
- Definir reglas de asignación automática de supervisores (futuro)
- Chat con usuarios (deprecado, se moverá a soporte)

**Restricciones:**
- NO puede editar denuncias
- NO puede eliminar denuncias
- NO puede cambiar estados de denuncias
- NO puede ver chats entre denunciante y supervisor
- Rol puramente de supervisión y auditoría

---

## Características Principales

### 1. Anonimato Completo

**Código Anónimo:**
- Formato: `DEN-YYYY-XXXX` (ej: `DEN-2024-7341`)
- Generado automáticamente al crear denuncia
- Permite seguimiento sin revelar identidad

**Protección de Identidad:**
- Nombre, apellido y teléfono son **opcionales** al registrarse
- No se almacenan direcciones IP de denunciantes
- Chat muestra solo roles (DENUNCIANTE / SUPERVISOR)
- Supervisores no ven datos personales en detalles de denuncia

### 2. Sistema de Auditoría

**Acciones Registradas:**
- LOGIN / LOGOUT / LOGIN_FALLIDO
- CREAR_DENUNCIA / MODIFICAR_DENUNCIA / ELIMINAR_DENUNCIA
- VER_DENUNCIA / LISTAR_DENUNCIAS
- CAMBIO_ESTADO_DENUNCIA
- ENVIAR_MENSAJE / VER_MENSAJES
- CONSULTA_AUDITORIA

**Información Capturada:**
```typescript
{
  usuarioId: "uuid-del-usuario",
  accion: "CREAR_DENUNCIA",
  tabla: "Denuncia",
  registroId: "uuid-de-la-denuncia",
  recurso: "DENUNCIA:uuid",
  detalles: { codigoAnonimo: "DEN-2024-1234", timestamp: "..." },
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  exitoso: true,
  createdAt: "2024-11-25T12:00:00Z"
}
```

**Consulta de Logs (Solo Admin):**
- Filtrado por acción, tabla, usuario, rango de fechas
- Paginación para grandes volúmenes de datos
- Estadísticas agregadas (total, exitosos, fallidos)

### 3. Chat en Tiempo Real

**Arquitectura:**
- **Protocolo:** WebSocket con fallback a Long Polling
- **Biblioteca:** Socket.IO 4
- **Salas:** Una sala única por denuncia (`denuncia-{uuid}`)
- **Participantes:** Solo denunciante y supervisor asignado

**Flujo de Conexión:**
```
1. Usuario hace login → Recibe JWT token
2. Página /dashboard/denuncias/[id]/chat se carga
3. Socket.IO se conecta: io.connect("http://localhost:3000")
4. Cliente emite "authenticate" con JWT token
5. Servidor valida token y une a sala de la denuncia
6. Mensajes se emiten/reciben en tiempo real
```

**Características:**
- **Indicador de Escritura:** "Supervisor está escribiendo..."
- **Estado de Conexión:** Indicador verde/rojo
- **Persistencia:** Mensajes se guardan en PostgreSQL
- **Reconexión:** Automática tras pérdida de conexión
- **Formato Anónimo:** Solo muestra rol, no nombre/email

**Ejemplo de Mensaje:**
```typescript
{
  id: "uuid",
  mensaje: "Hola, necesito ayuda",
  rol: "DENUNCIANTE",  // No muestra nombre
  esPropio: true,
  createdAt: "2024-11-25T12:30:00Z"
}
```

### 4. Gestión de Estados

**Flujo de Trabajo:**
```
PENDIENTE
  ↓
EN_REVISION
  ↓
APROBADA / RECHAZADA
  ↓
DERIVADA (opcional - a institución externa)
  ↓
CERRADA
```

**Cambio de Estado:**
- Solo supervisores pueden cambiar estado
- Requiere comentario explicativo (opcional)
- Se registra en tabla `historial_denuncias`:
  ```typescript
  {
    denunciaId: "uuid",
    estadoAnterior: "PENDIENTE",
    estadoNuevo: "EN_REVISION",
    comentario: "Se revisó la documentación",
    realizadoPor: "uuid-supervisor",
    createdAt: "2024-11-25T12:00:00Z"
  }
  ```
- Genera log en `auditoria_logs`

### 5. Seguridad

**Autenticación:**
- **Algoritmo:** JWT con HS256
- **Payload:**
  ```typescript
  {
    userId: "uuid",
    email: "user@example.com",
    rol: "DENUNCIANTE",
    iat: 1700000000,  // Issued at
    exp: 1700604800   // Expires (7 días después)
  }
  ```
- **Almacenamiento:** localStorage en cliente
- **Validación:** Middleware en cada API Route protegida

**Encriptación de Contraseñas:**
```typescript
// Hash al registrar
const passwordHash = await bcrypt.hash(password, 12);

// Verificación al login
const isValid = await bcrypt.compare(password, passwordHash);
```

**Control de Acceso:**
```typescript
// Middleware en API Routes
const payload = verifyToken(token);
if (!payload || payload.rol !== 'ADMIN') {
  return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
}
```

**Prevención de Ataques:**
- **SQL Injection:** Prisma usa queries parametrizadas
- **XSS:** React escapa automáticamente el HTML
- **CSRF:** Tokens de sesión únicos por usuario
- **Brute Force:** Bloqueo tras 5 intentos fallidos por 15 minutos

---

## Base de Datos

### Modelos Principales

#### Usuario
```prisma
model Usuario {
  id                String   @id @default(uuid())
  email             String   @unique
  passwordHash      String
  rol               Rol      @default(DENUNCIANTE)
  nombre            String?
  apellido          String?
  telefono          String?
  estado            EstadoUsuario @default(ACTIVO)
  intentosFallidos  Int      @default(0)
  bloqueadoHasta    DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relaciones
  denuncias         Denuncia[] @relation("DenuncianteUsuario")
  denunciasAsignadas Denuncia[] @relation("SupervisorAsignado")
  logs              AuditoriaLog[]
  mensajesChat      MensajeChat[]
}
```

#### Denuncia
```prisma
model Denuncia {
  id                String   @id @default(uuid())
  codigoAnonimo     String   @unique
  titulo            String
  descripcion       String   @db.Text
  categoria         CategoriaDenuncia
  estado            EstadoDenuncia @default(PENDIENTE)
  prioridad         Prioridad @default(MEDIA)
  denuncianteId     String?
  supervisorId      String?
  ubicacionGeneral  String?
  derivadaA         String?
  fechaDerivacion   DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relaciones
  denunciante       Usuario? @relation("DenuncianteUsuario", fields: [denuncianteId], references: [id])
  supervisor        Usuario? @relation("SupervisorAsignado", fields: [supervisorId], references: [id])
  evidencias        Evidencia[]
  historial         HistorialDenuncia[]
  mensajes          MensajeChat[]
}
```

#### MensajeChat
```prisma
model MensajeChat {
  id            String   @id @default(uuid())
  denunciaId    String
  denuncia      Denuncia @relation(fields: [denunciaId], references: [id], onDelete: Cascade)
  usuarioId     String
  usuario       Usuario  @relation(fields: [usuarioId], references: [id])
  mensaje       String   @db.Text
  esAnonimo     Boolean  @default(true)
  tipo          TipoMensaje @default(TEXTO)
  createdAt     DateTime @default(now())
  
  @@index([denunciaId])
  @@index([usuarioId])
}
```

#### AuditoriaLog
```prisma
model AuditoriaLog {
  id            String   @id @default(uuid())
  usuarioId     String?
  usuario       Usuario? @relation(fields: [usuarioId], references: [id])
  accion        String
  tabla         String
  recurso       String?
  registroId    String?
  detalles      String?  @db.Text
  ipAddress     String?
  userAgent     String?
  exitoso       Boolean  @default(true)
  createdAt     DateTime @default(now())
  
  @@index([usuarioId])
  @@index([accion])
  @@index([tabla])
  @@index([createdAt])
}
```

### Relaciones

```
Usuario (1) ──▶ (N) Denuncia [denunciante]
Usuario (1) ──▶ (N) Denuncia [supervisor asignado]
Usuario (1) ──▶ (N) MensajeChat
Usuario (1) ──▶ (N) AuditoriaLog

Denuncia (1) ──▶ (N) MensajeChat
Denuncia (1) ──▶ (N) Evidencia
Denuncia (1) ──▶ (N) HistorialDenuncia
```

### Índices Optimizados

```sql
-- Búsquedas frecuentes por email
CREATE INDEX usuarios_email_idx ON usuarios(email);

-- Filtrado de denuncias por estado y supervisor
CREATE INDEX denuncias_estado_idx ON denuncias(estado);
CREATE INDEX denuncias_supervisor_id_idx ON denuncias(supervisor_id);

-- Mensajes de chat por denuncia
CREATE INDEX mensajes_chat_denuncia_id_idx ON mensajes_chat(denuncia_id);

-- Logs de auditoría por fecha y acción
CREATE INDEX auditoria_logs_created_at_idx ON auditoria_logs(created_at);
CREATE INDEX auditoria_logs_accion_idx ON auditoria_logs(accion);
```

---

## Seguridad

### Autenticación y Autorización

#### JWT (JSON Web Tokens)

**Configuración:**
```typescript
// src/lib/auth.ts
const JWT_SECRET = process.env.JWT_SECRET || 'secret-default-no-usar-en-produccion';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}
```

**Flujo:**
1. Usuario envía credenciales a `/api/auth/login`
2. Servidor verifica email + contraseña
3. Si válido, genera JWT: `{ userId, email, rol, iat, exp }`
4. Cliente guarda token en `localStorage`
5. Cada request incluye header: `Authorization: Bearer {token}`
6. Middleware valida token antes de ejecutar ruta protegida

#### Middleware de Autenticación

```typescript
// Ejemplo en /api/denuncias/route.ts
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
  
  // Continuar con lógica de negocio...
}
```

### Encriptación de Contraseñas

**bcryptjs con 12 Rounds:**
```typescript
// Registro
const passwordHash = await bcrypt.hash(password, 12);
// Resultado: $2a$12$KIXcJ9C5VuXE5F.0xh9gEO7vU0qO...

// Login
const isValid = await bcrypt.compare(inputPassword, storedHash);
```

**¿Por qué 12 rounds?**
- Más de 10 rounds: Seguro contra ataques de GPU
- Menos de 15 rounds: Balance entre seguridad y rendimiento
- Tiempo de hash: ~150ms (imperceptible para usuario)

### Control de Acceso Basado en Roles (RBAC)

**Implementación:**
```typescript
// src/lib/auth.ts
export function checkPermission(userRole: Rol, resource: string, action: string): boolean {
  const permissions = {
    ADMIN: ['*'],  // Acceso total a logs, ver todas las denuncias
    SUPERVISOR: ['denuncia:ver-asignadas', 'denuncia:cambiar-estado', 'chat:enviar'],
    DENUNCIANTE: ['denuncia:crear', 'denuncia:editar-propias', 'denuncia:eliminar-propias', 'chat:enviar']
  };
  
  return permissions[userRole].includes('*') || 
         permissions[userRole].includes(`${resource}:${action}`);
}
```

**Ejemplo de Uso:**
```typescript
// En /api/denuncias/[id]/route.ts DELETE
if (payload.rol !== 'DENUNCIANTE' || denuncia.denuncianteId !== payload.userId) {
  return NextResponse.json({ error: 'No autorizado para eliminar esta denuncia' }, { status: 403 });
}
```

### Prevención de Vulnerabilidades

#### SQL Injection
**Mitigación:** Prisma ORM usa queries parametrizadas automáticamente.
```typescript
// SEGURO (Prisma)
await prisma.usuario.findUnique({ where: { email: userInput } });

// INSEGURO (SQL crudo)
// await prisma.$queryRaw`SELECT * FROM usuarios WHERE email = '${userInput}'`;
```

#### Cross-Site Scripting (XSS)
**Mitigación:** React escapa automáticamente el HTML.
```tsx
// SEGURO
<div>{denuncia.titulo}</div>  // React escapa caracteres especiales

// INSEGURO (NO HACER)
// <div dangerouslySetInnerHTML={{ __html: denuncia.titulo }} />
```

#### Cross-Site Request Forgery (CSRF)
**Mitigación:** Tokens JWT únicos por sesión.
- No usar cookies para autenticación (evita CSRF automático)
- Headers `Authorization` no se envían automáticamente en requests cross-origin

#### Brute Force
**Mitigación:** Bloqueo temporal tras intentos fallidos.
```typescript
// src/lib/auth.ts
export async function handleFailedLogin(userId: string): Promise<boolean> {
  const user = await prisma.usuario.update({
    where: { id: userId },
    data: { intentosFallidos: { increment: 1 } }
  });
  
  if (user.intentosFallidos >= MAX_LOGIN_ATTEMPTS) {
    await prisma.usuario.update({
      where: { id: userId },
      data: {
        intentosFallidos: 0,
        bloqueadoHasta: new Date(Date.now() + LOCKOUT_DURATION * 60 * 1000)
      }
    });
    return true;  // Usuario bloqueado
  }
  
  return false;
}
```

---

## Contribución

### Flujo de Trabajo

1. **Fork del repositorio**
   ```bash
   # Hacer fork en GitHub y clonar tu fork
   git clone https://github.com/TU_USUARIO/voz-segura-system.git
   ```

2. **Crear rama para feature**
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```

3. **Hacer cambios y commit**
   ```bash
   git add .
   git commit -m "Add: implementación de notificaciones por email"
   ```

4. **Push a tu fork**
   ```bash
   git push origin feature/nueva-funcionalidad
   ```

5. **Abrir Pull Request** en GitHub hacia `master` del repositorio original

### Convenciones de Código

**Naming:**
- Variables y funciones: `camelCase` (`getUserById`, `nombreCompleto`)
- Componentes React: `PascalCase` (`DenunciaCard`, `LoginForm`)
- Archivos: `kebab-case` (`user-profile.tsx`, `auth-middleware.ts`)
- Constantes: `UPPER_SNAKE_CASE` (`MAX_LOGIN_ATTEMPTS`, `JWT_SECRET`)

**Commits:**
- Formato: `Tipo: descripción breve`
- Tipos:
  - `Add:` Nueva funcionalidad
  - `Fix:` Corrección de bug
  - `Refactor:` Cambio de código sin alterar funcionalidad
  - `Docs:` Actualización de documentación
  - `Style:` Cambios de formato (espacios, comas)
  - `Test:` Añadir o corregir tests

**Ejemplo:**
```bash
git commit -m "Fix: corregir validación de email en formulario de registro"
git commit -m "Add: endpoint para eliminar evidencias de denuncia"
```

**Comentarios:**
```typescript
/**
 * Genera un código anónimo único para una denuncia
 * 
 * @returns Código en formato DEN-YYYY-XXXX (ej: DEN-2024-7341)
 */
export function generarCodigoAnonimo(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DEN-${year}-${random}`;
}
```

---

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

## Contacto

- **Repositorio:** [https://github.com/Sebasky26/voz-segura-system](https://github.com/Sebasky26/voz-segura-system)
- **Issues:** [Reportar problema](https://github.com/Sebasky26/voz-segura-system/issues)

---

**Voz Segura** - Sistema de Denuncias Anónimas  
Escuela Politécnica Nacional - 2024
