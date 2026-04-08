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
- Attendance module dengan check-in/check-out
- Leave request module dengan approve/reject
- Dashboard stats endpoint
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

## Attendance Endpoints

- `GET /api/attendances`
- `GET /api/attendances/:id`
- `POST /api/attendances`
- `PUT /api/attendances/:id`
- `DELETE /api/attendances/:id`
- `GET /api/attendances/me`
- `POST /api/attendances/check-in`
- `POST /api/attendances/check-out`

Access:

- `admin_hr`: list semua attendance, detail semua attendance, CRUD manual
- `employee`: hanya attendance miliknya sendiri, plus check-in dan check-out

Query untuk `GET /api/attendances`:

- `user_id`
- `attendance_date`
- `status`
- `page`
- `limit`

## Leave Endpoints

- `GET /api/leaves`
- `GET /api/leaves/:id`
- `POST /api/leaves`
- `PUT /api/leaves/:id`
- `DELETE /api/leaves/:id`
- `GET /api/leaves/me`
- `PATCH /api/leaves/:id/approve`
- `PATCH /api/leaves/:id/reject`

Access:

- `admin_hr`: lihat semua leave request, approve, reject, dan bisa update/delete pending leave
- `employee`: create leave, lihat leave miliknya, update/delete leave miliknya yang masih pending

Query untuk `GET /api/leaves`:

- `user_id`
- `status`
- `leave_type`
- `start_date`
- `end_date`
- `page`
- `limit`

## Dashboard Endpoint

- `GET /api/dashboard/stats`

Access:

- `admin_hr`: akses statistik dashboard HR

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
