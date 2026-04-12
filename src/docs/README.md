## Session Timeout

- Idle timeout menggunakan sliding expiration 15 menit untuk semua endpoint terproteksi.
- Session disimpan di tabel `auth_sessions` dengan `last_activity_at`, `invalidated_at`, dan `invalidation_reason`.
- JWT tetap dipakai sebagai access token, tetapi pengecekan idle timeout dilakukan server-side memakai `sessionId` pada payload token.
- `last_activity_at` hanya diperbarui setelah request terautentikasi selesai dengan status sukses di bawah `400`.
- Jika timeout terjadi, backend mengembalikan `401` dengan code `SESSION_IDLE_TIMEOUT` agar frontend bisa redirect ke halaman login.

## Notifications

- Notifikasi disimpan di tabel `notifications` dan dapat diambil lewat polling API.
- Event yang saat ini menghasilkan notifikasi:
  - pengajuan cuti baru untuk semua `admin_hr` aktif selain aktor
  - approval cuti oleh `admin_hr` untuk pemilik cuti
  - rejection cuti oleh `admin_hr` untuk pemilik cuti
- Endpoint:
  - `GET /api/notifications`
  - `PATCH /api/notifications/read-all`
  - `PATCH /api/notifications/:id/read`

## Leave Types

- `leave_type` pada leave request sudah direfactor menjadi master data `leave_types`.
- Request create/update leave sekarang memakai `leave_type_id`.
- Response leave sekarang mengembalikan `leaveTypeId`, `leaveTypeCode`, dan `leaveTypeName`.
- Endpoint master:
  - `GET /api/leave-types`
  - `GET /api/leave-types/:id`
  - `POST /api/leave-types`
  - `PUT /api/leave-types/:id`
  - `DELETE /api/leave-types/:id`
