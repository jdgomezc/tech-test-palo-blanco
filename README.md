# Prueba técnica — Desarrollos Palo Blanco

**Autor:** José Daniel Gómez Cabrera  
**Fecha:** Lunes 9 de febrero de 2026  
**Prueba técnica** para plaza de desarrollador full stack.

### [Demo en video](https://youtu.be/N9_IDfWrUwU)

[![Ver demo en YouTube](https://img.youtube.com/vi/N9_IDfWrUwU/maxresdefault.jpg)](https://youtu.be/N9_IDfWrUwU)

_Haz clic en la miniatura para ver la demo._

---

## Descripción del proyecto

Aplicación full stack con **backend** (Express + TypeScript + Prisma + MySQL) y **frontend** (React + Vite + TypeScript + Tailwind CSS 4). Incluye autenticación con JWT, registro y listado de inversores, procedimiento almacenado (inversores por monto mínimo) y función (estado activo/inactivo por ID).

### Estructura

```
tech-test-palo-blanco/
├── client/          # Frontend (React, Vite, TanStack Query, React Router)
├── server/          # Backend (Express, Prisma, MySQL)
└── README.md
```

### Stack

- **Backend:** Node.js, Express, TypeScript, Prisma ORM 7, MySQL, JWT, HMAC-SHA256 para encriptación de contraseñas.
- **Frontend:** React 19, Vite 7, TypeScript, TanStack React Query, React Router DOM, Tailwind CSS 4.

---

## Requerimientos cumplidos

A continuación se detallan los **requerimientos de la prueba técnica** implementados en el proyecto.

### Rutas del backend (API REST)

| Método | Ruta                              | Descripción                                                                                           | Protegida |
| ------ | --------------------------------- | ----------------------------------------------------------------------------------------------------- | --------- |
| `POST` | `/auth/register`                  | Registro de usuarios; encriptación de contraseñas con HMAC-SHA256 en reposo y clave base64 en `.env`  | No        |
| `POST` | `/auth/login`                     | Login con usuario y contraseña; verificación con la clave y crypto; devuelve JWT (valido por 1h)      | No        |
| `POST` | `/investors`                      | Registrar nuevo inversor (nombre, apellido, inversión); asociado al usuario que registra (JWT)        | Sí (JWT)  |
| `GET`  | `/investors`                      | Listado de inversores con información de quién los registró                                           | Sí (JWT)  |
| `GET`  | `/investors/greater?amount=15000` | Inversores con inversión **mayor o igual** al monto; parámetro `amount` opcional (por defecto 15,000) | Sí (JWT)  |
| `GET`  | `/investors/:id/state`            | Estado del inversor por ID: **activo** (id par) o **inactivo** (id impar)                             | Sí (JWT)  |

- **Rutas protegidas:** middleware de autenticación (`auth.middleware.ts`) que valida el JWT en la cabecera `Authorization: Bearer <token>` y responde 403 si el token falta o es inválido.
- **Frontend:** uso del JWT en cabeceras para todas las peticiones a rutas protegidas; login, registro y rutas protegidas (listado y alta de inversores, mayores por monto, estado por ID).

### Procedimientos y funciones en MySQL (requerimientos)

Los requerimientos incluían implementar **un procedimiento almacenado** y **una función** en MySQL, versionados con Prisma Migrate. Están definidos en:

**`server/prisma/migrations/20260209220257_add_sp_and_fn/migration.sql`**

#### 1. Procedimiento almacenado: `sp_inversionistas_mayor`

- **Nombre:** `sp_inversionistas_mayor`
- **Parámetro:** `IN p_amount DOUBLE` (opcional; si es `NULL`, se usa 15,000 por defecto).
- **Comportamiento:** devuelve los inversores cuya inversión es **mayor o igual** al monto indicado.
- **Uso en la API:** la ruta `GET /investors/greater?amount=...` invoca este procedimiento (vía driver MariaDB) para obtener el listado.

```sql
CREATE PROCEDURE sp_inversionistas_mayor(IN p_amount DOUBLE)
SELECT * FROM Investor WHERE investment >= IFNULL(p_amount, 15000);
```

#### 2. Función almacenada: `fn_estado_inversionista`

- **Nombre:** `fn_estado_inversionista`
- **Parámetro:** `p_id INT` (ID del inversor).
- **Retorno:** `VARCHAR(20)` — `'active'` si el ID es **par**, `'inactive'` si es **impar** (requerimiento de prueba).
- **Uso en la API:** la ruta `GET /investors/:id/state` ejecuta esta función y devuelve `{ state: "active" }` o `{ state: "inactive" }`.

```sql
CREATE FUNCTION fn_estado_inversionista(p_id INT) RETURNS VARCHAR(20)
DETERMINISTIC
READS SQL DATA
RETURN IF(p_id % 2 = 0, 'active', 'inactive');
```

Ambos objetos se crean y versionan mediante **migraciones de Prisma** junto con el resto del esquema (tablas, claves foráneas, etc.).

---

## Requisitos previos

- **Node.js** (v20 o superior recomendado)
- **MySQL** en ejecución (local o remoto)
- Base de datos creada en MySQL (por ejemplo `developdb`)

---

## Backend (server)

### 1. Instalar dependencias

```bash
cd server
npm install
```

El script `postinstall` ejecuta `prisma generate` automáticamente tras instalar.

### 2. Variables de entorno

Copia el archivo de ejemplo y rellena los valores:

```bash
cp .env.example .env
```

Edita `.env`. A continuación se explican los valores de **`.env.example`**:

| Variable       | Descripción                                                                                       | Ejemplo                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `DATABASE_URL` | URL de conexión a MySQL. Formato: `mysql://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_BASE_DATOS`      | `mysql://root:miPassword@localhost:3306/developdb`                                         |
| `HASH_SECRET`  | Clave en **base64** para encriptar contraseñas con el hash HMAC-SHA256. Debe ser secreta y única. | Generar con: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `JWT_SECRET`   | Secreto para firmar y verificar los tokens JWT. Usar una cadena larga y aleatoria en producción.  | `miClaveSecretaJWT-muy-larga-y-aleatoria`                                                  |

**Ejemplo completo de `.env`:**

```env
DATABASE_URL="mysql://root:miPassword@localhost:3306/developdb"
HASH_SECRET="claveBase64GeneradaConElComandoDeArriba"
JWT_SECRET="claveSecretaJWTParaFirmarTokens"
```

### 3. Migraciones de Prisma

Con MySQL en marcha y `DATABASE_URL` correcta en `.env`:

```bash
cd server
npm run db:migrate
```

Esto aplica todas las migraciones en `prisma/migrations/` (tablas `User`, `Investor`, procedimiento `sp_inversionistas_mayor`, función `fn_estado_inversionista`, etc.).

Si solo quieres generar el cliente de Prisma sin aplicar migraciones:

```bash
npm run db:generate
```

### 4. Arrancar el servidor

```bash
npm run dev
```

El API queda en **http://localhost:3000** (o el `PORT` que definas en `.env`).

**Scripts útiles:**

- `npm run dev` — desarrollo con recarga (tsx watch)
- `npm run build` — compilar TypeScript y generar Prisma Client
- `npm run start` — ejecutar compilado (`dist/`)
- `npm run db:migrate` — aplicar migraciones
- `npm run db:studio` — abrir Prisma Studio

---

## Frontend (client)

### 1. Instalar dependencias

```bash
cd client
npm install
```

No hace falta `.env` en el cliente: el proxy de Vite envía las peticiones a `/api` al backend (por defecto `http://localhost:3000`).

### 2. Arrancar el frontend

```bash
npm run dev
```

La app se abre en **http://localhost:5173** (o el puerto que indique Vite).

**Scripts útiles:**

- `npm run dev` — desarrollo con Vite
- `npm run build` — build de producción
- `npm run preview` — previsualizar el build

---

## Cómo ejecutar el proyecto completo

1. **Terminal 1 — Backend**

   ```bash
   cd server
   npm install
   cp .env.example .env
   # Editar .env con tu DATABASE_URL, HASH_SECRET y JWT_SECRET
   npm run db:migrate
   npm run dev
   ```

2. **Terminal 2 — Frontend**

   ```bash
   cd client
   npm install
   npm run dev
   ```

3. Abrir **http://localhost:5173** en el navegador.  
   Registrar un usuario, iniciar sesión y usar el dashboard (listado de inversores, registro, filtro por monto mínimo, estado por ID).

---

## API (resumen)

Todas las rutas listadas en [Requerimientos cumplidos > Rutas del backend](#rutas-del-backend-api-rest) están implementadas y operativas:

- `POST /auth/register` — Registro (usuario, contraseña hasheada con HMAC-SHA256).
- `POST /auth/login` — Login; devuelve JWT (1h). Cabecera: `Authorization: Bearer <token>`.
- `GET /investors` — Listado de inversores (protegido).
- `POST /investors` — Crear inversor (protegido).
- `GET /investors/greater?amount=15000` — Inversores con inversión ≥ monto; **usa el procedimiento** `sp_inversionistas_mayor` (protegido).
- `GET /investors/:id/state` — Estado activo/inactivo del inversor por ID; **usa la función** `fn_estado_inversionista` (protegido).

---

## Notas

- Las contraseñas se hashean con **HMAC-SHA256** usando `HASH_SECRET` (base64).
- El frontend guarda el JWT en `localStorage` y lo envía en `Authorization: Bearer` en las rutas protegidas.
- La UI está en **español**; el código y variables en **inglés**.

---

---

**Resumen de requerimientos cumplidos:** rutas REST (auth, inversores, mayores por monto, estado por ID), autenticación JWT y rutas protegidas, procedimiento almacenado `sp_inversionistas_mayor` y función `fn_estado_inversionista` versionados en migraciones de Prisma, frontend con login/registro y uso del JWT en cabeceras.

_Prueba técnica desarrollada por José Daniel Gómez Cabrera — 9 de febrero de 2026._
