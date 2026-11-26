# Entity-relationship diagram — Misbah-ul-Quran IMS

State after migrations `20261126_01` … `20261126_04`. Column lists show keys and the
fields that matter for relationships; see [SCHEMA.md](SCHEMA.md) for every column.

Labels on each relationship give the `ON DELETE` rule.

## Core model

```mermaid
erDiagram
    AUTH_USERS ||--o| USERS : "auth_user_id (SET NULL)"
    CAMPUSES ||--o{ USER_CAMPUS_ACCESS : "RESTRICT"
    USERS ||--o{ USER_CAMPUS_ACCESS : "CASCADE"
    CAMPUSES ||--o{ USERS : "active_campus_id (SET NULL)"

    USERS ||--o| TEACHER_PROFILES : "teacher_id (CASCADE)"
    CAMPUSES ||--o{ TEACHER_PROFILES : "RESTRICT"

    CAMPUSES ||--o{ CLASSES : "RESTRICT"
    USERS ||--o{ CLASSES : "lead teacher (SET NULL)"

    CAMPUSES ||--o{ STUDENTS : "RESTRICT"
    CLASSES ||--o{ STUDENTS : "class_id (SET NULL)"
    USERS ||--o{ STUDENTS : "parent_id (SET NULL)"

    USERS ||--o{ TEACHER_ATTENDANCES : "teacher_id (RESTRICT)"
    CAMPUSES ||--o{ TEACHER_ATTENDANCES : "RESTRICT"

    STUDENTS ||--o{ STUDENT_ATTENDANCES : "RESTRICT"
    CLASSES ||--o{ STUDENT_ATTENDANCES : "RESTRICT"
    CAMPUSES ||--o{ STUDENT_ATTENDANCES : "RESTRICT"

    STUDENTS ||--o{ PAYMENT_INVOICES : "student_id (RESTRICT)"
    CAMPUSES ||--o{ PAYMENT_INVOICES : "RESTRICT"

    STUDENTS ||--o{ INCIDENT_LOGS : "SET NULL"
    CAMPUSES ||--o{ INCIDENT_LOGS : "RESTRICT"
    STUDENTS ||--o{ MEDICAL_RECORDS : "RESTRICT"
    USERS ||--o{ MEDICAL_RECORDS : "reported_by (SET NULL)"

    CAMPUSES ||--o{ DOCUMENTS : "RESTRICT"
    USERS ||--o{ AUDIT_LOGS : "user_id (SET NULL)"
    CAMPUSES ||--o{ AUDIT_LOGS : "SET NULL"

    AUTH_USERS {
        uuid id PK "Supabase Auth: email + bcrypt password"
    }
    USERS {
        text id PK
        uuid auth_user_id FK "unique"
        text email "unique, case-insensitive"
        text username "unique, case-insensitive"
        text role "SUPER_ADMIN | CAMPUS_ADMIN | TEACHER | PARENT | STUDENT"
        text active_campus_id FK
        int status "1 active, 0 inactive"
    }
    USER_CAMPUS_ACCESS {
        text user_id PK, FK
        text campus_id PK, FK "'all' = every campus"
    }
    CAMPUSES {
        text id PK "uk | kts | all"
        text code "unique"
        text timezone
        text currency_code "PKR | GBP"
    }
    TEACHER_PROFILES {
        text id PK "tch-..."
        text teacher_id FK "unique, users.id"
        text campus_id FK
        text employee_code "unique"
        numeric salary
    }
    CLASSES {
        text id PK
        text campus_id FK
        text teacher_id FK "lead teacher, users.id"
        text code "unique per campus (active)"
        text grade_level
        text room
        text schedule_time
        bool is_active "duplicates deactivated"
    }
    STUDENTS {
        text id PK
        text campus_id FK
        text class_id FK
        text parent_id FK
        text roll_number "unique"
        text status "active | inactive | archived"
        jsonb primary_contact_details
        text blood_group
        text medical_notes
        text quran_milestone
        timestamptz archived_at
    }
    TEACHER_ATTENDANCES {
        text id PK
        text teacher_id FK "unique per date"
        date date
        text status "PRESENT | ABSENT | LATE | LEAVE"
        text rule_applied "set by trigger"
    }
    STUDENT_ATTENDANCES {
        text id PK
        text student_id FK
        text class_id FK
        date date "unique (student, class, date)"
        text status "PRESENT | ABSENT | LATE | EXCUSED"
    }
    PAYMENT_INVOICES {
        text id PK
        text student_id FK
        text campus_id FK
        numeric amount
        text currency
        text payment_status
    }
    INCIDENT_LOGS {
        text id PK
        text student_id FK
        text campus_id FK
        text status
    }
    MEDICAL_RECORDS {
        text id PK
        text student_id FK
        text reported_by FK
        text severity
    }
    DOCUMENTS {
        text id PK
        text campus_id FK
        text type "teacher | incident | ..."
        text reference_id "polymorphic, no FK"
    }
    AUDIT_LOGS {
        text id PK
        text user_id FK
        text campus_id FK
        text action
        jsonb details "append-only"
    }
```

## Content and reserved tables

```mermaid
erDiagram
    CAMPUSES ||--o{ NEWS : "RESTRICT"
    CAMPUSES ||--o{ SLIDER_IMAGES : "RESTRICT"
    CAMPUSES ||--o{ PRAYER_TIMINGS : "RESTRICT"
    CAMPUSES ||--o{ EXPENSE_LOGS : "RESTRICT"
    CAMPUSES ||--o{ EVENT_ANNOUNCEMENTS : "RESTRICT"
    STUDENTS ||--o{ EXAM_RESULTS : "RESTRICT"
    CLASSES ||--o{ EXAM_RESULTS : "RESTRICT"
    STUDENTS ||--o{ ACADEMIC_PROGRESS : "RESTRICT"
    USERS ||--o{ ACADEMIC_PROGRESS : "teacher_id (SET NULL)"

    NEWS {
        int id PK
        text campus_id FK "'all' = global"
    }
    SLIDER_IMAGES {
        int id PK
        text campus_id FK
    }
    PRAYER_TIMINGS {
        int id PK
        text campus_id FK
    }
    EXPENSE_LOGS {
        text id PK
        text campus_id FK
    }
    EVENT_ANNOUNCEMENTS {
        text id PK
        text campus_id FK
    }
    EXAM_RESULTS {
        text id PK
        text student_id FK
        text class_id FK
    }
    ACADEMIC_PROGRESS {
        text id PK
        text student_id FK
        text teacher_id FK
    }
```

`news`, `slider_images` and `prayer_timings` are public (readable while signed out).
`expense_logs`, `event_announcements`, `exam_results` and `academic_progress` are reserved:
the tables exist with keys and RLS, but no app feature writes to them yet.

## Reading the diagram

- **Identity:** a person signs in through Supabase Auth (`auth.users`). Their app profile is one `users` row,
  and `user_campus_access` says which campuses they may see. Teachers also have one `teacher_profiles` row.
- **History is protected:** campuses, students and teachers with history cannot be hard-deleted
  (`RESTRICT`). The app archives students and deactivates teachers instead.
- **Logs keep their content:** when a user is removed, their audit and medical-report rows stay with `user_id = NULL`.
