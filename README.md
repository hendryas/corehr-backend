# CoreHR Backend

Backend API untuk technical test CoreHR Sistem HR. Project ini dibangun dengan Node.js, Express, TypeScript, MySQL, dan JWT dengan pendekatan modular sederhana agar rapi, mudah dipelihara, dan siap diintegrasikan ke Angular frontend.

## Fitur Utama

- Authentication login untuk `admin_hr` dan `employee`
- Master data `departments` dan `positions`
- Master data `leave_types`
- Manajemen `employees`
- Attendance dengan endpoint `check-in` dan `check-out`
- Leave request dengan alur `approve` dan `reject`
- Notifikasi in-app untuk event pengajuan dan approval/rejection cuti
- Dashboard summary untuk kebutuhan HR
- Custom migration runner tanpa ORM
- Seed data awal untuk demo
- Optional CSV export untuk employee, attendance, dan leave request

## Tech Stack

- Node.js
- Express
- TypeScript
- MySQL
- `mysql2/promise`
- JWT
- bcryptjs
- dotenv

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

## Setup Project

### 1. Install dependency

```bash
npm install
```

### 2. Siapkan file environment

```bash
cp .env.example .env
```

Isi `.env` minimal:

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:4200,http://127.0.0.1:4200

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=corehr

JWT_SECRET=replace_with_a_long_random_secret_key
JWT_EXPIRES_IN=1d
SESSION_IDLE_TIMEOUT_MINUTES=15
```

### 3. Buat database MySQL

Masuk ke MySQL:

```bash
mysql -u root -p
```

Lalu buat database:

```sql
CREATE DATABASE corehr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Jalankan migration

```bash
npm run migrate
```

### 5. Jalankan seed

```bash
npm run seed
```

### 6. Jalankan backend

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm run start
```

Quality check:

```bash
npm run check
```

## Script NPM

- `npm run dev`: jalankan backend mode development
- `npm run build`: compile TypeScript ke `dist`
- `npm run typecheck`: type check tanpa emit file build
- `npm run check`: alias untuk type check
- `npm run start`: jalankan hasil build production
- `npm run start:prod`: build lalu jalankan production server
- `npm run migrate`: build lalu jalankan migration
- `npm run migrate:run`: jalankan migration dari folder `dist`
- `npm run seed`: build lalu jalankan seed
- `npm run seed:run`: jalankan seed dari folder `dist`

## Akun Demo Seed

- Admin HR
  - Email: `admin.hr@corehr.local`
  - Password: `Admin123!`
- Employee 1
  - Email: `budi@corehr.local`
  - Password: `Employee123!`
- Employee 2
  - Email: `citra@corehr.local`
  - Password: `Employee123!`

## Auth Header

Gunakan header berikut untuk semua endpoint terproteksi:

```http
Authorization: Bearer <access_token>
```

## Endpoint Summary

### Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Notifications

- `GET /api/notifications`
- `PATCH /api/notifications/read-all`
- `PATCH /api/notifications/:id/read`

## Session Idle Timeout

- Semua endpoint yang memakai middleware `authenticate` menggunakan sliding idle timeout selama 15 menit.
- Aktivitas dihitung dari request terautentikasi terakhir yang berhasil. Request sukses berikutnya akan menggeser `last_activity_at` menjadi 15 menit dari request tersebut.
- Backend menyimpan session server-side di tabel `auth_sessions`, sedangkan JWT membawa `sessionId` agar timeout tidak bisa dibypass hanya karena token masih valid di client.
- Saat idle timeout terjadi, backend mengembalikan `401 Unauthorized` tanpa redirect HTML. Frontend yang memutuskan redirect ke halaman login.

Contoh response:

```json
{
  "success": false,
  "code": "SESSION_IDLE_TIMEOUT",
  "message": "Session expired due to 15 minutes of inactivity. Please login again.",
  "errors": null,
  "requestId": "req_123456"
}
```

## Notifications

- Backend sekarang menyimpan notifikasi di tabel `notifications`.
- Pengajuan cuti membuat notifikasi untuk semua `admin_hr` aktif selain aktor yang melakukan request.
- Approval atau rejection cuti oleh `admin_hr` membuat notifikasi untuk pemilik cuti.
- Delivery notifikasi saat ini berbasis polling API, belum websocket atau push notification.
- `GET /api/notifications` mengembalikan daftar notifikasi milik user login beserta `unreadCount`.

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

### Dashboard

- `GET /api/dashboard/me`
- `GET /api/dashboard/stats`

## Hak Akses Ringkas

- `admin_hr`
  - full access untuk master data, employees, dashboard
  - bisa melihat semua attendance dan leave request
  - bisa export CSV
  - bisa approve/reject leave
- `employee`
  - bisa login dan akses profil dirinya sendiri
  - bisa melihat attendance dan leave miliknya sendiri
  - bisa check-in/check-out
  - bisa membuat, mengubah, dan menghapus leave miliknya selama masih `pending`
  - memilih jenis cuti dari master `leave_types`

## Contoh Request dan Response

### Login

Request:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin.hr@corehr.local",
  "password": "Admin123!"
}
```

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "jwt_token_here",
    "user": {
      "id": 1,
      "employeeCode": "ADM001",
      "fullName": "Aisyah Putri",
      "email": "admin.hr@corehr.local",
      "phone": "081200000001",
      "gender": "female",
      "address": "Jakarta",
      "hireDate": "2023-01-10",
      "isActive": true,
      "role": "admin_hr",
      "departmentId": 1,
      "departmentName": "Human Resources",
      "positionId": 1,
      "positionName": "HR Manager"
    }
  }
}
```

### Employee List

Request:

```http
GET /api/employees?search=budi&page=1&limit=10
Authorization: Bearer <access_token>
```

Response:

```json
{
  "success": true,
  "message": "Employees fetched successfully",
  "data": {
    "items": [
      {
        "id": 2,
        "employeeCode": "EMP001",
        "fullName": "Budi Santoso",
        "email": "budi@corehr.local",
        "phone": "081200000002",
        "gender": "male",
        "address": "Bandung",
        "hireDate": "2024-03-01",
        "isActive": true,
        "role": "employee",
        "departmentId": 2,
        "departmentName": "Engineering",
        "positionId": 2,
        "positionName": "Backend Engineer",
        "createdAt": "2026-04-08 20:00:00",
        "updatedAt": "2026-04-08 20:00:00"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### Attendance Check-in

Request:

```http
POST /api/attendances/check-in
Authorization: Bearer <access_token>
```

Response:

```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "id": 10,
    "userId": 2,
    "employeeCode": "EMP001",
    "fullName": "Budi Santoso",
    "role": "employee",
    "attendanceDate": "2026-04-08",
    "checkIn": "2026-04-08 08:05:00",
    "checkOut": null,
    "status": "present",
    "notes": null,
    "createdAt": "2026-04-08 08:05:00",
    "updatedAt": "2026-04-08 08:05:00"
  }
}
```

### Leave Approve

Request:

```http
PATCH /api/leaves/2/approve
Authorization: Bearer <access_token>
```

Response:

```json
{
  "success": true,
  "message": "Leave request approved successfully",
  "data": {
    "id": 2,
    "userId": 2,
    "employeeCode": "EMP001",
    "fullName": "Budi Santoso",
    "leaveTypeId": 1,
    "leaveTypeCode": "annual_leave",
    "leaveTypeName": "Annual Leave",
    "startDate": "2026-04-10",
    "endDate": "2026-04-10",
    "reason": "Medical check-up",
    "status": "approved",
    "approvedBy": 1,
    "approverName": "Aisyah Putri",
    "approvedAt": "2026-04-08 11:00:00",
    "rejectionReason": null,
    "createdAt": "2026-04-08 09:00:00",
    "updatedAt": "2026-04-08 11:00:00"
  }
}
```

### Dashboard Stats

Request:

```http
GET /api/dashboard/stats
Authorization: Bearer <access_token>
```

Response:

```json
{
  "success": true,
  "message": "Dashboard stats fetched successfully",
  "data": {
    "totalEmployees": 3,
    "activeEmployees": 3,
    "totalDepartments": 3,
    "totalPositions": 3,
    "totalAttendancesToday": 2,
    "totalPendingLeaves": 1,
    "totalApprovedLeaves": 1,
    "totalRejectedLeaves": 1
  }
}
```

### Validation Error

Response:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["Email is required"],
    "password": ["Password is required"]
  }
}
```

## Format Response API

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

## Manual Testing Checklist

- [ ] `POST /api/auth/login` berhasil untuk `admin_hr`
- [ ] `POST /api/auth/login` berhasil untuk `employee`
- [ ] `GET /api/auth/me` mengembalikan user login
- [ ] CRUD department berjalan sesuai role
- [ ] CRUD position berjalan sesuai role
- [ ] CRUD leave type berjalan sesuai role
- [ ] `GET /api/employees` mendukung search, filter, dan pagination
- [ ] `GET /api/employees/me/profile` hanya bisa diakses employee
- [ ] `GET /api/employees/export/csv` berhasil download CSV
- [ ] `GET /api/attendances` untuk employee hanya menampilkan attendance miliknya
- [ ] `POST /api/attendances/check-in` hanya bisa sekali per hari
- [ ] `POST /api/attendances/check-out` gagal jika belum check-in
- [ ] `GET /api/attendances/export/csv` berhasil download CSV
- [ ] `POST /api/leaves` berhasil membuat leave request dengan `leave_type_id`
- [ ] leave `pending` bisa diupdate dan dihapus oleh owner
- [ ] leave `approved/rejected` tidak bisa diubah sembarangan
- [ ] `PATCH /api/leaves/:id/approve` hanya bisa oleh admin HR
- [ ] `PATCH /api/leaves/:id/reject` wajib mengirim `rejection_reason`
- [ ] `GET /api/leaves/export/csv` berhasil download CSV
- [ ] `GET /api/dashboard/stats` mengembalikan summary HR
- [ ] semua endpoint error mengembalikan format JSON yang konsisten

## Catatan Presentasi

- Backend tidak memakai ORM agar query SQL tetap eksplisit dan mudah diaudit
- Layer `repository -> service -> controller` dipakai untuk memisahkan query, business logic, dan HTTP handling
- Endpoint dirancang agar mudah dipakai Angular, dengan response JSON yang konsisten dan pagination yang sederhana
