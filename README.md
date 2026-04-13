# CoreHR Backend

Backend API untuk aplikasi HR sederhana dengan fitur autentikasi, manajemen karyawan, absensi, pengajuan cuti, notifikasi, dan dashboard ringkas. Project ini cocok dipakai sebagai fondasi aplikasi internal HR atau sebagai backend pendamping frontend web/mobile.

API dibangun dengan Node.js, Express, TypeScript, dan MySQL, dengan struktur kode modular agar mudah dipelihara dan dikembangkan.

## Fitur Utama

- Login berbasis JWT
- Manajemen department dan position
- Manajemen data karyawan
- Absensi dengan alur check-in dan check-out
- Pengajuan cuti dengan approval atau rejection
- Master data jenis cuti
- Notifikasi in-app berbasis polling API
- Dashboard ringkas untuk admin HR dan employee
- Export data CSV untuk beberapa resource
- Migration dan seed database tanpa ORM

## Role yang Tersedia

- `admin_hr`
  - Mengelola master data, karyawan, dan dashboard admin
  - Melihat seluruh data attendance dan leave
  - Menyetujui atau menolak pengajuan cuti
  - Mengakses endpoint export CSV
- `employee`
  - Login dan melihat profil sendiri
  - Melihat attendance dan leave miliknya
  - Melakukan check-in dan check-out
  - Membuat, mengubah, dan menghapus leave miliknya selama masih `pending`

## Tech Stack

- Node.js
- Express
- TypeScript
- MySQL
- `mysql2/promise`
- JWT
- bcryptjs
- dotenv
- pino

## Quick Start

### 1. Clone repository

```bash
git clone <repository-url>
cd corehr-backend
```

### 2. Install dependency

```bash
npm install
```

### 3. Siapkan environment

Salin file contoh environment:

```bash
cp .env.example .env
```

Jika memakai Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Lalu sesuaikan isinya, minimal seperti ini:

```env
NODE_ENV=development
LOG_LEVEL=debug
PORT=3000
CORS_ORIGIN=http://localhost:4200,http://127.0.0.1:4200

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=corehr_db

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
SESSION_IDLE_TIMEOUT_MINUTES=15
```

### 4. Buat database MySQL

Masuk ke MySQL:

```bash
mysql -u root -p
```

Lalu buat database:

```sql
CREATE DATABASE corehr_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Jalankan migration

```bash
npm run migrate
```

### 6. Isi data awal

```bash
npm run seed
```

### 7. Jalankan server

Mode development:

```bash
npm run dev
```

Build production:

```bash
npm run build
npm run start
```

Jika server berhasil berjalan:

- Root URL: `http://localhost:3000`
- API base URL: `http://localhost:3000/api`

Endpoint root `GET /` akan mengembalikan status sederhana bahwa API sedang berjalan.

## Akun Demo

Jika Anda menjalankan seed, akun berikut akan tersedia:

- Admin HR
  - Email: `admin.hr@corehr.local`
  - Password: `Admin123!`
- Employee
  - Email: `budi@corehr.local`
  - Password: `Employee123!`
- Employee
  - Email: `citra@corehr.local`
  - Password: `Employee123!`

## Cara Menggunakan API

### 1. Login

Request:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin.hr@corehr.local",
  "password": "Admin123!"
}
```

Contoh memakai `curl`:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin.hr@corehr.local\",\"password\":\"Admin123!\"}"
```

Response login akan mengembalikan `accessToken`.

### 2. Kirim token pada endpoint terproteksi

Gunakan header berikut:

```http
Authorization: Bearer <access_token>
```

### 3. Mulai eksplorasi endpoint

Urutan yang biasanya paling praktis:

1. `POST /api/auth/login`
2. `GET /api/auth/me`
3. `GET /api/departments`
4. `GET /api/positions`
5. `GET /api/leave-types`
6. `GET /api/employees` atau `GET /api/employees/me/profile`
7. `GET /api/attendances` atau `POST /api/attendances/check-in`
8. `GET /api/leaves` atau `POST /api/leaves`
9. `GET /api/notifications`
10. `GET /api/dashboard/stats` atau `GET /api/dashboard/me`

## Ringkasan Endpoint

### Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Departments

- `GET /api/departments`
- `GET /api/departments/:id`
- `POST /api/departments`
- `PUT /api/departments/:id`
- `DELETE /api/departments/:id`

### Positions

- `GET /api/positions`
- `GET /api/positions/:id`
- `POST /api/positions`
- `PUT /api/positions/:id`
- `DELETE /api/positions/:id`

### Leave Types

- `GET /api/leave-types`
- `GET /api/leave-types/:id`
- `POST /api/leave-types`
- `PUT /api/leave-types/:id`
- `DELETE /api/leave-types/:id`

### Employees

- `GET /api/employees`
- `GET /api/employees/export/csv`
- `GET /api/employees/:id`
- `POST /api/employees`
- `PUT /api/employees/:id`
- `DELETE /api/employees/:id`
- `GET /api/employees/me/profile`

### Attendances

- `GET /api/attendances`
- `GET /api/attendances/export/csv`
- `GET /api/attendances/:id`
- `POST /api/attendances`
- `PUT /api/attendances/:id`
- `DELETE /api/attendances/:id`
- `GET /api/attendances/me`
- `POST /api/attendances/check-in`
- `POST /api/attendances/check-out`

### Leaves

- `GET /api/leaves`
- `GET /api/leaves/export/csv`
- `GET /api/leaves/:id`
- `POST /api/leaves`
- `PUT /api/leaves/:id`
- `DELETE /api/leaves/:id`
- `GET /api/leaves/me`
- `PATCH /api/leaves/:id/approve`
- `PATCH /api/leaves/:id/reject`

### Notifications

- `GET /api/notifications`
- `PATCH /api/notifications/read-all`
- `PATCH /api/notifications/:id/read`

### Dashboard

- `GET /api/dashboard/me`
- `GET /api/dashboard/stats`

## Format Response

Response sukses:

```json
{
  "success": true,
  "message": "Success message",
  "data": {}
}
```

Response error:

```json
{
  "success": false,
  "message": "Error message",
  "errors": {},
  "requestId": "req_xxx"
}
```

## Session dan Autentikasi

- Semua endpoint yang memakai middleware autentikasi menggunakan JWT Bearer token.
- Session juga dicatat server-side di tabel `auth_sessions`.
- Idle timeout default adalah `15` menit dan memakai sliding expiration.
- Jika session idle terlalu lama, API akan mengembalikan `401 Unauthorized` dengan code `SESSION_IDLE_TIMEOUT`.

## Scripts

- `npm run dev` menjalankan server development
- `npm run build` compile TypeScript ke folder `dist`
- `npm run start` menjalankan hasil build production
- `npm run start:prod` build lalu menjalankan server production
- `npm run test` build lalu menjalankan test
- `npm run typecheck` menjalankan type checking tanpa emit
- `npm run check` alias untuk type check
- `npm run migrate` build lalu menjalankan migration
- `npm run migrate:run` menjalankan migration dari folder `dist`
- `npm run seed` build lalu menjalankan seed
- `npm run seed:run` menjalankan seed dari folder `dist`

## Struktur Project

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
  database/
    migrations/
    seeds/
  docs/
  app.ts
  server.ts
```

## Catatan Penggunaan

- Pastikan MySQL sudah aktif sebelum menjalankan migration, seed, atau server.
- Jika frontend Anda berjalan di origin lain, sesuaikan `CORS_ORIGIN` di `.env`.
- Export CSV tersedia untuk resource tertentu dan dibatasi oleh role.
- Notifikasi saat ini memakai polling API, belum websocket atau push notification.

## Pengembangan Lanjutan

Beberapa ide pengembangan yang bisa ditambahkan:

- Swagger atau OpenAPI documentation
- Refresh token
- Upload avatar atau dokumen
- Unit test dan integration test yang lebih luas
- Docker setup untuk local development

## License

ISC
