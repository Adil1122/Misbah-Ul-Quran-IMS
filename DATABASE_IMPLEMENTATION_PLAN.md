> **⚠️ OUTDATED (superseded on 2026-11-26).** Do not follow the setup steps below — running `supabase/schema.sql` or `supabase/rls_policies.sql` (now in `supabase/migrations/_legacy/`) would disable Row Level Security and expose user data. Current documentation: [docs/database/SCHEMA.md](docs/database/SCHEMA.md), [docs/database/MIGRATIONS.md](docs/database/MIGRATIONS.md), [docs/database/BACKUP_RECOVERY.md](docs/database/BACKUP_RECOVERY.md).

# Misbah-ul-Quran IMS — Database Architecture & Implementation Plan

A comprehensive, phased technical roadmap for transitioning the **Misbah-ul-Quran International Institute Management System (IMS)** from local in-memory state to a production relational/persistent database.

---

## Executive Architecture Summary

The Misbah-ul-Quran IMS currently utilizes an in-memory reactive state manager (`IMSStateService`) with structured seed data for multi-campus operations across **UK** (`Europe/London`, GBP) and **KTS Pakistan** (`Asia/Karachi`, PKR). 

The repository includes complete production-ready database definitions:
1. **Supabase PostgreSQL Production Schema & Policies**: `/supabase/schema.sql` with full Row-Level-Security (RLS), Pakistan & UK timezone strict attendance triggers, and seed data.
2. **Hostinger MySQL Migration**: `/my sql/ims_db_latest_migration.sql` upgrading existing MySQL dump with attendance rules and multi-campus tables.
3. **Prisma Relational Schema**: `/packages/database/prisma/schema.prisma` defining models for Campuses, Users, Students, Teachers, Classes, Student Attendance, Teacher Attendance, Fees, Payments, Incidents, Medical, and Academic Progress.
4. **Baseline MySQL Dump**: `/my sql/ims_db.sql` with table definitions.
5. **Full Deployment Guide**: `/SUPABASE_AND_HOSTINGER_DEPLOYMENT_PLAN.md` containing step-by-step Hostinger VPS & Supabase setup.

---

## 1. Database Technology Selection Matrix

| Criteria | Option A: Relational Database with Prisma (Recommended) | Option B: Cloud SQL PostgreSQL | Option C: Firebase Firestore |
| :--- | :--- | :--- | :--- |
| **Engine** | MySQL 8.0 / MariaDB / PostgreSQL | Managed Google Cloud PostgreSQL | NoSQL Document Store |
| **Existing Alignment** | Directly matches `/packages/database/prisma/schema.prisma` & `ims_db.sql` | Fully compatible with Prisma / Drizzle | Requires schema transformation from relational to document collections |
| **Hostinger / Production** | Native MySQL / PostgreSQL database on Hostinger VPS or Shared Hosting | Google Cloud Platform managed instance | Firebase console |
| **Complex Relations** | Strict foreign keys, 15-tab student history, audit logs, dual currencies | Strict ACID transactions & relational integrity | Requires denormalized document references |
| **Recommendation** | **Primary Choice (Direct fit for Hostinger & existing schemas)** | **Enterprise Cloud Option** | **Alternative for mobile real-time apps** |

---

## 2. System Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REACT 19 SPA (VITE)                                │
│   [Super Admin]   [Campus Admin]   [Teacher Portal]   [Parent Portal]       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Async HTTP / JSON
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       EXPRESS FULL-STACK BACKEND                            │
│                     (server.ts / tsx / port 3000)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Middleware: JWT Auth, Role-Based Access Control (RBAC), Campus Scoping    │
│ • Attendance Rules Engine (Local Timezone Asia/Karachi & Europe/London)     │
│ • Audit Logger: Immutable security logs for all writes & corrections        │
├─────────────────────────────────────────────────────────────────────────────┤
│  /api/auth      /api/campuses    /api/students    /api/teachers             │
│  /api/classes   /api/attendance  /api/finance     /api/academic             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Database Driver / Prisma ORM
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RELATIONAL DATABASE (MYSQL)                          │
│ • campuses              • users                  • student_profiles         │
│ • teacher_profiles      • classes                • student_attendances      │
│ • teacher_attendances   • payment_invoices       • audit_logs               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Phased Implementation Roadmap

### Phase 1: Full-Stack Server & Database Foundation
- **Step 1.1: Express Entry Point (`server.ts`)**
  - Mount Vite middlewares in development (`vite.middlewares`).
  - Configure port `3000` with JSON body parsers, CORS, and request logging.
  - Update `package.json` `"dev"` script to `"tsx server.ts"` and `"start": "node dist/server.js"`.
- **Step 1.2: Database Client & Configuration**
  - Configure `.env` with `DATABASE_URL=mysql://user:pass@host:3306/ims_db`.
  - Install `@prisma/client` and generate client from `/packages/database/prisma/schema.prisma`.
  - Create database connection singleton in `src/server/db.ts`.

### Phase 2: Database Schema Synchronization & Seeding
- **Step 2.1: Run Migrations**
  - Verify tables against `/packages/database/prisma/schema.prisma`:
    - `campuses` (UK & KTS, timezones, currency codes)
    - `users` (credentials, roles, password hashes)
    - `students` & 15-tab historical relationships
    - `teachers` & employment/salary records
    - `student_attendances` (with `arrivalTime`, `status`, `ruleApplied`, `correctionHistory`)
    - `teacher_attendances` (with `checkInTime`, `isSystemGenerated`, `ruleApplied`)
    - `payment_invoices`, `expenses`, `academic_progress`, `audit_logs`
- **Step 2.2: Seeding Data**
  - Seed baseline data from `src/data/seedData.ts` and `my sql/ims_db.sql` so all campuses, users, teachers, and enrolled students are present on initial boot.

### Phase 3: RESTful API Endpoints Implementation
- **Authentication & RBAC**:
  - `POST /api/auth/login` (JWT token issuance, password verification)
  - `GET /api/auth/me` (Current user profile & campus access permissions)
- **Campuses & Classes**:
  - `GET /api/campuses` & `GET /api/campuses/:id`
  - `GET /api/classes?campusId=` & `POST /api/classes`
- **Students & Teachers**:
  - `GET /api/students?campusId=&classId=&page=&pageSize=&search=` (Paginated 20/50/100/500)
  - `GET /api/students/:id` (Full 15-tab historical profile)
  - `POST /api/students` & `PUT /api/students/:id`
  - `GET /api/teachers?campusId=` & `GET /api/teachers/:id`
- **Attendance Engine (Strict Time Rules)**:
  - `GET /api/attendance/student?campusId=&classId=&date=&page=&pageSize=`
  - `POST /api/attendance/student/bulk` (Roll-call save with duplicate prevention)
  - `PUT /api/attendance/student/:id` (Administrative correction with audit note)
  - `GET /api/attendance/teacher?campusId=&date=`
  - `POST /api/attendance/teacher` (Enforcing <=5:00 PM Present/Absent, 5:00-5:30 PM Late/Absent, >5:30 PM Absent only)
- **Finance, Results & Audit**:
  - `GET /api/finance/payments?campusId=` (GBP / PKR separated)
  - `GET /api/academic/results?classId=` & `POST /api/academic/sabaq`
  - `GET /api/audit-logs?campusId=`

### Phase 4: Frontend State Migration (Zero Disruption)
- Create `src/services/apiClient.ts` as an async layer.
- Update `IMSStateService` to synchronize with the backend REST API:
  - Initial fetch loads live database state.
  - Mutations (saving roll-call, recording check-in, modifying records) write to the backend while updating UI state optimistically.
  - Maintains existing component props and reactive patterns without rewriting UI components.

### Phase 5: Security, Multi-Campus Isolation & Deployment
- Strict campus tenant scoping: Campus Admin queries are hard-scoped to `user.activeCampusId`.
- Super Admin cross-campus view with audit logging.
- MySQL database backups and deployment script for Hostinger VPS / production environment.

---

## 4. Key Decisions for User Approval

Before code execution begins, please confirm your preference on:
1. **Database Engine Choice**:
   - **MySQL / MariaDB via Prisma ORM** (Matches Hostinger & existing `ims_db.sql` dump) — *Recommended*
   - **Cloud SQL PostgreSQL** (Direct Google Cloud managed database)
2. **Hosting Environment**:
   - Hostinger MySQL instance (Direct connection string in `.env`)
   - Local / Development database for immediate preview and testing
