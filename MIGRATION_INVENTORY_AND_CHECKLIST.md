> **⚠️ OUTDATED (superseded on 2026-11-26).** Do not follow the setup steps below — running `supabase/schema.sql` or `supabase/rls_policies.sql` (now in `supabase/migrations/_legacy/`) would disable Row Level Security and expose user data. Current documentation: [docs/database/SCHEMA.md](docs/database/SCHEMA.md), [docs/database/MIGRATIONS.md](docs/database/MIGRATIONS.md), [docs/database/BACKUP_RECOVERY.md](docs/database/BACKUP_RECOVERY.md).

# Misbah-ul-Quran IMS — Migration Inventory & Implementation Checklist

**Date:** October 14, 2026  
**Target:** Supabase PostgreSQL Migration & Full-Stack Backend Integration for Misbah-ul-Quran IMS  
**Deployment Platform:** Hostinger (VPS / Cloud) + Supabase Cloud PostgreSQL  

---

## 1. Complete Repository & Architecture Inventory

### 1.1 Frontend
- **Framework**: React 19.0.1 SPA with Vite 8.3.0, TypeScript 7.0.2, and Tailwind CSS 4.3.3.
- **Entry Points**: `index.html` -> `src/main.tsx` -> `src/App.tsx`.
- **Navigation & Routing**:
  - `src/App.tsx` handles role-based viewport routing across four distinct personas:
    1. `SUPER_ADMIN`: Central executive dashboard, branch drill-downs, cross-campus financial audit, admission approvals, Quranic matrix, user governance, audit logs. Supports "Branch View Mode" (campus impersonation).
    2. `CAMPUS_ADMIN`: Scoped operational dashboard for single campus (`uk` or `kts`), students, teachers, classes, student & teacher attendance, payments, academic progress, incidents, and reports.
    3. `TEACHER`: Teacher Portal (`TeacherPortal.tsx`) with assigned classes, student roll-call with arrival times, history with edit workflow, lesson/Sabaq logs, teaching materials, and self check-in under strict time rules.
    4. `PARENT`: Family portal (`ParentPortal.tsx`) with linked student academic history, Sabaq progress, fee invoices, and incident notices.
- **Layout & Component Library**:
  - `Sidebar.tsx`: Accordion navigation with role badge and campus switchers.
  - `Header.tsx`: Contextual campus selector, Islamic calendar dates, global search (`Ctrl+K`), quick prayer times modal, and profile management.
  - Modals: `SecurityVerificationModal`, `EditProfileModal`, `GlobalSearchModal`, `NamazScheduleModal`, `StudentModal`, `TeacherModal`, `HifzSanadCertificateModal`, `StudentAttendanceHistoryModal`, `PortalAccountModal`, `DeleteConfirmModal`.
  - Views: 25+ view components across `src/components/views/` and `src/components/views/super-admin/`.

### 1.2 Database Access Layer & Current State Management
- **Current State Manager**: `src/services/imsStateService.ts` (2,179 lines) acting as an in-memory reactive state manager with 225 call-sites across UI components.
- **Data Source**: Initialized from `src/data/seedData.ts` and `src/data/islamicData.ts`.
- **Existing ORM & Database Definitions**:
  - `packages/database/prisma/schema.prisma`: Multi-campus relational schema for MySQL.
  - `my sql/ims_db.sql`: Original production MySQL dump with 24 tables.
  - `my sql/ims_db_latest_migration.sql`: MySQL migration script.
  - `supabase/schema.sql`: Initial Supabase PostgreSQL schema.

### 1.3 Authentication & Authorization System
- **Service**: `src/services/authGuardService.ts` simulating a 4-layer NestJS pipeline:
  1. `JwtAuthGuard`: Validates session existence and token integrity.
  2. `RolesGuard`: Restricts routes to `SUPER_ADMIN`, `CAMPUS_ADMIN`, `TEACHER`, `PARENT`.
  3. `CampusScopeGuard`: Enforces campus isolation (UK `uk` vs KTS Pakistan `kts`).
  4. `ResourceOwnershipGuard`: Enforces parent-child and teacher-class ownership.
- **Current UI Auth**: `src/components/views/LoginView.tsx` accepting username/email + password, issuing demo JWT tokens stored in reactive session state.

### 1.4 Configuration & Environment
- `.env.example`: Defines `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `DEFAULT_UK_CAMPUS_ID`, `DEFAULT_KTS_CAMPUS_ID`, `NEXT_PUBLIC_API_URL`.
- `vite.config.ts`: Configured for port 3000, 0.0.0.0 host, `@` alias, Tailwind CSS plugin.

---

## 2. Original MySQL Database Dump Inspection (`my sql/ims_db.sql`)

The legacy dump contains **24 tables**, engine `InnoDB`, charset `utf8mb4_unicode_ci`:

| Table | Columns | Row Count | Primary Key | Key Foreign Keys & Relationships |
| :--- | :--- | :--- | :--- | :--- |
| `users` | 11 | 13 | `id` (bigint) | Base user table (admin: Ahsan Hanif, teachers 1-5, 12-14, parents) |
| `teacher_profiles` | 8 | 8 | `id` (bigint) | `teacher_id` -> `users.id` (PKR salaries 55k-75k, Friday pay day) |
| `classes` | 7 | 15 | `id` (bigint) | `teacher_id` -> `users.id` (Junior/Senior Boys, Girls, Hifz) |
| `students` | 21 | 1 | `id` (bigint) | `class_id` -> `classes.id`, `parent_id` (REG-1000, female, 2014-04-08) |
| `payment_invoices` | 10 | 238 | `id` (bigint) | `reference_id` -> `students.id` (Tuition fee invoices 980-1655) |
| `incident_logs` | 10 | 2 | `id` (bigint) | `student_id` -> `students.id` |
| `attendance_batches` | 6 | 0 | `id` (bigint) | `class_id` -> `classes.id` (Batch header for attendance roll-call) |
| `student_attendances`| 7 | 0 | `id` (bigint) | `batch_id` -> `attendance_batches.id`, `student_id` |
| `teacher_attendances`| 7 | 0 | `id` (bigint) | `batch_id` -> `attendance_batches.id`, `teacher_id` |
| `student_report_cards`| 10 | 0 | `id` (bigint) | `student_id` -> `students.id`, `class_id` -> `classes.id` |
| `medical_logs` | 9 | 0 | `id` (bigint) | `student_id` -> `students.id` |
| `expense_logs` | 10 | 0 | `id` (bigint) | Category, amount, date, payment method |
| `event_announcements`| 10 | 0 | `id` (bigint) | `name` -> `classes.id` |
| `news` | 5 | 6 | `id` (bigint) | Islamic news announcements |
| `slider_images` | 5 | 6 | `id` (bigint) | Campus showcase banner images |
| `document_uplouds` | 7 | 3 | `id` (bigint) | Identity docs and admission forms |
| `prayer_timings` | 11 | 288 | `id` (bigint) | Full yearly calendar for Fajr, Dhuhr, Asr, Maghrib, Isha |
| `personal_access_tokens` | 10 | 3 | `id` (bigint) | Sanctum API tokens for user 1 |
| `sessions` | 6 | 2 | `id` (varchar) | Web sessions |
| `payment_methods` | 7 | 0 | `id` (bigint) | `user_id` -> `users.id` |
| `migrations` | 3 | 34 | `id` (int) | Historical migration index |
| `cache` / `cache_locks`| 3 / 3 | 1 / 0 | `key` | Framework application cache |
| `password_reset_tokens`| 3 | 0 | `email` | Password resets |

---

## 3. MySQL-Specific Queries, Models, and Syntax to Convert

1. **Auto-Increment vs UUID/BigSerial**:
   - MySQL uses `bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT`.
   - PostgreSQL in Supabase supports `BIGSERIAL`, `BIGINT GENERATED ALWAYS AS IDENTITY`, or `UUID` / `TEXT`.
   - **Resolution**: Use `TEXT` primary keys with `DEFAULT gen_random_uuid()::text` for new multi-campus records, while supporting legacy numeric IDs (`1`, `2`, `3`) or preserving exact legacy integer primary keys using a legacy compatibility table or dual ID mapping.
2. **Backticks (`` `table` ``)**:
   - MySQL uses backtick identifiers; PostgreSQL uses double quotes `""` or lower-case identifiers.
3. **Data Types**:
   - `tinyint(1)` -> `BOOLEAN`.
   - `datetime` / `timestamp NULL` -> `TIMESTAMPTZ`.
   - `longtext` / `mediumtext` -> `TEXT`.
   - `json` / serialized PHP strings `(DC2Type: Array)` -> `JSONB` or `TEXT`.
   - MySQL `ON UPDATE CURRENT_TIMESTAMP` -> PostgreSQL `BEFORE UPDATE` trigger function `set_updated_at()`.
4. **Timezone Handling**:
   - MySQL `SET time_zone = "+00:00"`.
   - PostgreSQL requires timezone conversions: `(NEW.check_in_time AT TIME ZONE campus_tz)::time`.

---

## 4. Incomplete APIs, Disconnected Forms & Mock Data to Address

| Module | Current State | Missing Real Database Operation | Action to Complete |
| :--- | :--- | :--- | :--- |
| **Authentication** | Validates against in-memory `INITIAL_USERS` in `imsStateService.ts` | No backend JWT verification or Supabase Auth session | Implement Supabase Auth / backend `/api/auth/login` |
| **Teacher Attendance** | Evaluated via local utility `teacherAttendanceRules.ts` | Server-side time boundary enforcement trigger | Enforce via Postgres trigger on `Asia/Karachi` and `Europe/London` |
| **Student Attendance** | In-memory roll-call state in `imsStateService.ts` | Real persistent bulk insert with duplicate key prevention | Implement `POST /api/attendance/student/bulk` with `ON CONFLICT` |
| **Student Directory** | Filtered in-memory in `StudentDirectoryView.tsx` | Paginated database queries with filters | Implement Supabase `/api/students` query |
| **Teacher Directory** | In-memory `getTeachers()` | Database records with payroll & class assignments | Connect to `teachers` table |
| **Fee Invoices** | Read from `INITIAL_PAYMENTS` | 238 legacy invoices + multi-campus PKR/GBP billing | Migrate 238 legacy invoices into `payment_invoices` table |
| **Incidents & Medical** | Local array in `IMSStateService` | Persistent incident reports and admin approvals | Connect to `incident_reports` and `medical_logs` |
| **Approval Center** | In-memory `pendingAdmissions` & `pendingTeachers` | Formal approval workflow saving to database | Connect to `admissions_approval` & `students` tables |
| **Audit Center** | In-memory `auditLogs` | Immutable database audit ledger | Auto-populate via Postgres trigger & API logging |

---

## 5. Master Implementation Checklist

- [x] **Phase 1: Repository & Database Inspection** (Completed)
- [ ] **Phase 2: Complete PostgreSQL Migration Script for Supabase**
  - [ ] Write unified migration script `supabase/migrations/20261014_complete_migration.sql` containing:
    - Complete multi-campus schema (Campuses, Users, Profiles, Teachers, Students, Classes, Attendances, Invoices, Incidents, Audits, Prayers).
    - Preserved data from `my sql/ims_db.sql`: 13 users, 15 classes, 8 teachers, 1 student, 238 payment invoices, 2 incident logs, 288 prayer timings, 6 news, 6 slider images.
    - Multi-campus seed data: UK Campus (London, GBP) and KTS Pakistan Campus (Haripur, PKR).
    - Strict teacher attendance PostgreSQL triggers enforcing 5:00 PM and 5:30 PM boundaries in local time.
    - Row Level Security (RLS) policies for tenant isolation.
- [ ] **Phase 3: Supabase Client Integration**
  - [ ] Install `@supabase/supabase-js`.
  - [ ] Create `src/services/supabaseClient.ts` with graceful fallback when env vars are pending.
- [ ] **Phase 4: Full-Stack Backend API & NestJS-Style Pipeline**
  - [ ] Create `server.ts` mounting Vite in dev mode and providing NestJS-style modular controllers, DTOs, guards, and REST endpoints:
    - `/api/auth/login`, `/api/auth/me`
    - `/api/campuses`, `/api/classes`
    - `/api/students` (CRUD, pagination, search)
    - `/api/teachers` (CRUD, profile, payroll)
    - `/api/attendance/student` & `/api/attendance/teacher` (strict time window validation)
    - `/api/finance/invoices`, `/api/finance/payments`, `/api/finance/expenses`
    - `/api/approvals`, `/api/incidents`, `/api/audit-logs`
    - `/api/health`
  - [ ] Update `package.json` `"dev"` and `"start"` scripts to run `server.ts`.
- [ ] **Phase 5: Frontend Service Connection**
  - [ ] Connect `IMSStateService` to synchronize with Supabase / `/api/*` endpoints while maintaining reactive UI state.
- [ ] **Phase 6: Verification & Test Scenarios**
  - [ ] Run security verification tests (RolesGuard, CampusScopeGuard, ResourceOwnershipGuard).
  - [ ] Test teacher attendance strict boundaries (5:00 PM / 5:30 PM).
  - [ ] Test student roll-call bulk attendance and duplicate prevention.
  - [ ] Verify build (`compile_applet`) and lint (`lint_applet`).
- [ ] **Phase 7: Deployment Documentation**
  - [ ] Finalize Hostinger VPS & Cloud deployment guide with backup and rollback procedures.
