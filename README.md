# CoreHR Backend

Backend API untuk technical test CoreHR Sistem HR. Project ini dibangun dengan pola modular sederhana agar rapi, mudah di-maintain, dan siap diintegrasikan ke Angular frontend.

## Tech Stack

- Node.js
- Express
- TypeScript
- MySQL
- `mysql2/promise`
- JWT
- bcryptjs
- dotenv

## Fitur Pada Scope Awal

- Auth login untuk `admin_hr` dan `employee`
- Endpoint `POST /api/auth/login`
- Endpoint `GET /api/auth/me`
- CRUD department
- CRUD position
- CRUD employee
- Endpoint `GET /api/employees/me/profile`
- JWT authentication
- Role-based middleware
- Custom migration runner tanpa ORM
- Seed data awal untuk HR domain

## Instalasi

```bash
npm install
cp .env.example .env
```

Sesuaikan nilai database dan JWT di `.env`.

## Menjalankan Project

```bash
npm run dev
```

Build production:

```bash
npm run build
npm start
```

## Migration dan Seed

Migration ditulis dalam TypeScript dan dijalankan lewat custom runner berbasis `mysql2/promise`. Pendekatan ini dipilih supaya:

- tidak bergantung ORM
- query schema tetap eksplisit
- mudah diaudit saat technical test
- cukup sederhana untuk dikembangkan bertahap

Jalankan migration:

```bash
npm run migrate
```

Jalankan seed:

```bash
npm run seed
```

## Demo Seed Accounts

- Admin HR
  - Email: `admin.hr@corehr.local`
  - Password: `Admin123!`
- Employee 1
  - Email: `budi@corehr.local`
  - Password: `Employee123!`
- Employee 2
  - Email: `citra@corehr.local`
  - Password: `Employee123!`

## Auth Endpoints

### `POST /api/auth/login`

Request body:

```json
{
  "email": "admin.hr@corehr.local",
  "password": "Admin123!"
}
```

### `GET /api/auth/me`

Header:

```text
Authorization: Bearer <token>
```

## Department Endpoints

- `GET /api/departments`
- `GET /api/departments/:id`
- `POST /api/departments`
- `PUT /api/departments/:id`
- `DELETE /api/departments/:id`

Access:

- `admin_hr`: full CRUD
- `employee`: GET list dan detail

## Position Endpoints

- `GET /api/positions`
- `GET /api/positions/:id`
- `POST /api/positions`
- `PUT /api/positions/:id`
- `DELETE /api/positions/:id`

Access:

- `admin_hr`: full CRUD
- `employee`: GET list dan detail

## Employee Endpoints

- `GET /api/employees`
- `GET /api/employees/:id`
- `POST /api/employees`
- `PUT /api/employees/:id`
- `DELETE /api/employees/:id`
- `GET /api/employees/me/profile`

Access:

- `admin_hr`: full CRUD employee
- `employee`: hanya `GET /api/employees/me/profile`

Query untuk `GET /api/employees`:

- `search`
- `department_id`
- `position_id`
- `is_active`
- `page`
- `limit`

## Response Format

Success:

```json
{
  "success": true,
  "message": "Success message",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Error message",
  "errors": {}
}
```

## Struktur Folder

```text
src/
  config/
  controllers/
  routes/
  middlewares/
  services/
  repositories/
  utils/
  validators/
  types/
  docs/
  database/
    migrations/
    seeds/
  app.ts
  server.ts
```
