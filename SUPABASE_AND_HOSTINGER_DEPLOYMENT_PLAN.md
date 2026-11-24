# Misbah-ul-Quran IMS — Supabase Backend & Hostinger Deployment Plan

This master guide provides a production-grade, step-by-step implementation plan for connecting the **Misbah-ul-Quran International Institute Management System (IMS)** to **Supabase (PostgreSQL)** and deploying the application on **Hostinger**.

---

## Architecture & Database Files Overview

The repository now contains complete, production-ready schemas for both deployment pathways:

| File | Target Environment | Purpose |
| :--- | :--- | :--- |
| **`/supabase/schema.sql`** | **Supabase (PostgreSQL 15+)** | Complete schema with RLS policies, teacher attendance triggers (Karachi & London timezones), auto-auditing, and seed data. |
| **`/my sql/ims_db_latest_migration.sql`** | **Hostinger MySQL / phpMyAdmin** | Upgrades the existing `ims_db.sql` with multi-campus columns, audit trail, and teacher attendance tracking. |
| **`/my sql/ims_db.sql`** | **Hostinger MySQL Baseline** | Full baseline MySQL table dump. |
| **`/packages/database/prisma/schema.prisma`** | **Prisma ORM** | Multi-campus relational schema matching both UK and KTS campuses. |

---

# PART 1: Supabase Backend Implementation Plan

### Step 1.1: Create & Configure Supabase Project
1. Log in to [supabase.com](https://supabase.com) and click **New Project**.
2. Set the Project Name: `misbah-ul-quran-ims`.
3. Choose Database Password (record securely).
4. **Region Selection**:
   - For Pakistan operations: Select **Mumbai (ap-south-1)** or **Singapore (ap-southeast-1)** for lowest latency to KTS Haripur.
   - For UK operations: Select **London (eu-west-2)** or **Frankfurt (eu-central-1)**.
5. Once provisioned (~2 minutes), navigate to **Project Settings > API** and copy:
   - `Project URL` (e.g. `https://xxxx.supabase.co`)
   - `anon public key` (used in client React SPA)
   - `service_role secret key` (server-side only, bypasses RLS)

---

### Step 1.2: Execute Database Schema & RLS Policies
1. In the Supabase dashboard, open the **SQL Editor** from the left menu.
2. Click **New Query**.
3. Copy the entire contents of `/supabase/schema.sql` and paste it into the editor.
4. Click **Run** (or `Ctrl+Enter`).
5. Verify in **Table Editor** that the following tables are created:
   - `campuses` (Pre-seeded with UK Campus `UK-01` and KTS Pakistan Campus `KTS-01`)
   - `profiles` (Linked to `auth.users`)
   - `teachers` & `parents`
   - `students` & `classes`
   - `student_attendances` (With unique constraint on `student_id + class_id + date`)
   - `teacher_attendances` (With strict time rule validation triggers)
   - `payment_invoices` (Dual-currency PKR & GBP)
   - `audit_logs` (Records all administrative corrections)
   - `incident_logs`, `medical_logs`, and `announcements`

---

### Step 1.3: Teacher Attendance Server-Side Strict Time Enforcement
The trigger `validate_teacher_attendance_time_rules()` in `/supabase/schema.sql` automatically enforces the institute's attendance window using the campus timezone (`Asia/Karachi` for KTS, `Europe/London` for UK):

| Check-In Time (Campus Local Time) | Permitted Status | System Action |
| :--- | :--- | :--- |
| **<= 5:00:00 PM (17:00:00)** | `PRESENT` or `ABSENT` | Stored as submitted (`rule_applied = 'UP_TO_5PM'`). |
| **5:00:01 PM – 5:30:00 PM** | `LATE` or `ABSENT` | If `PRESENT` is submitted, trigger auto-corrects to `LATE` (`rule_applied = 'LATE_WINDOW_5_01_TO_5_30'`). |
| **> 5:30:00 PM (17:30:01+)** | `ABSENT` only | Status is forced to `ABSENT`, `is_system_generated = TRUE`, and `rule_applied = 'AFTER_5_30PM_AUTO_ABSENT'`. |

*Because this logic executes in PostgreSQL triggers, browser clock spoofing or manipulated client requests are rejected.*

---

### Step 1.4: Supabase Client Integration into IMS
Install `@supabase/supabase-js` and configure the client service:

```bash
npm install @supabase/supabase-js
```

Create `src/services/supabaseClient.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Configure `.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

---

# PART 2: Hostinger Deployment Plan (Step-by-Step)

Hostinger offers two hosting options for this application:
- **Option A: Hostinger VPS (Recommended)**: Best for production, full control over Node.js, PM2, and Nginx.
- **Option B: Hostinger Cloud / Shared Web Hosting (hPanel Node.js Web App)**.

---

## OPTION A: Hostinger VPS Deployment (Ubuntu 22.04 / 24.04 LTS)

### Step 2.1: Server Setup & Hardening
1. In Hostinger hPanel, order or access your **VPS (KVM 1 or KVM 2)**.
2. Choose OS template: **Ubuntu 22.04 64bit** or **Ubuntu 24.04 64bit**.
3. Connect via SSH:
   ```bash
   ssh root@YOUR_SERVER_IP
   ```
4. Update packages and configure firewall:
   ```bash
   apt update && apt upgrade -y
   apt install -y ufw curl git build-essential nginx certbot python3-certbot-nginx

   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw --force enable
   ```

---

### Step 2.2: Install Node.js 20 LTS & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
node -v   # Should output v20.x.x
```

---

### Step 2.3: Deploy Codebase to VPS
1. Create the application directory:
   ```bash
   mkdir -p /var/www/misbah-ims
   cd /var/www/misbah-ims
   ```
2. Clone repository or upload your files:
   ```bash
   git clone https://github.com/YOUR_ORGANIZATION/misbah-ims.git .
   ```
3. Install production dependencies:
   ```bash
   npm ci
   ```
4. Configure production environment variables:
   ```bash
   nano .env.production
   ```
   Add:
   ```env
   NODE_ENV=production
   PORT=3000
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   # If using Hostinger MySQL instead of Supabase:
   DATABASE_URL="mysql://u123456789_ims:YourPassword@127.0.0.1:3306/u123456789_ims_db"
   ```
5. Build the application:
   ```bash
   npm run build
   ```

---

### Step 2.4: Configure PM2 Process Manager
The repository includes a ready-to-use `/ecosystem.config.cjs`:
```javascript
module.exports = {
  apps: [
    {
      name: 'misbah-ims',
      script: 'server.js',
      cwd: '/var/www/misbah-ims',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
```

Start the application with PM2 and configure auto-start on server reboot:
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
# Run the command generated by pm2 startup
```

---

### Step 2.5: Configure Nginx Reverse Proxy
Create `/etc/nginx/sites-available/misbah-ims`:
```nginx
server {
    listen 80;
    server_name ims.misbahulquran.org www.ims.misbahulquran.org;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Proxy to Node.js / Express backend & Vite build
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        root /var/www/misbah-ims/dist;
        expires 30d;
        add_header Cache-Control "public, no-transform";
        try_files $uri @proxy;
    }

    location @proxy {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

Enable the site and reload Nginx:
```bash
ln -s /etc/nginx/sites-available/misbah-ims /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

### Step 2.6: Configure Free SSL Certificate (HTTPS)
```bash
certbot --nginx -d ims.misbahulquran.org -d www.ims.misbahulquran.org
```
Select option `2` to automatically redirect all HTTP traffic to HTTPS. Certbot installs a systemd timer for automatic certificate renewal.

---

### Step 2.7: Hostinger DNS Zone Configuration
In Hostinger hPanel under **Domains > DNS Zone**:
1. Add **A Record**:
   - Name: `@` (or `ims`)
   - Points to: `YOUR_HOSTINGER_VPS_IP`
   - TTL: `14400`
2. Add **CNAME Record**:
   - Name: `www` (or `www.ims`)
   - Points to: `@` (or `ims.misbahulquran.org`)
   - TTL: `14400`

---

## OPTION B: Hostinger Cloud / Shared Hosting (hPanel Node.js App)

If using Hostinger Shared or Cloud Hosting without root VPS access:

1. In hPanel, go to **Databases > Management > Create MySQL Database**:
   - Database Name: `u123456789_ims`
   - Username: `u123456789_admin`
   - Password: `YourStrongPassword`
2. Open **phpMyAdmin**:
   - Select the newly created database.
   - Click **Import** > Choose `/my sql/ims_db.sql`.
   - Click **Import** > Choose `/my sql/ims_db_latest_migration.sql` to apply all latest fields.
3. In hPanel, go to **Advanced > Node.js**:
   - Application root: `/domains/yourdomain.com/public_html`
   - Application URL: `https://yourdomain.com`
   - Application startup file: `server.js`
   - Node.js version: `20.x`
4. Upload the built `dist/` and backend files via Git or File Manager, then click **Run NPM Install** and **Restart Application**.

---

# PART 3: Automated Zero-Downtime Deployment Script

Save this script as `/var/www/misbah-ims/deploy.sh` on your Hostinger VPS:

```bash
#!/bin/bash
set -e

echo "🚀 Starting Misbah-ul-Quran IMS Deployment..."
cd /var/www/misbah-ims

echo "📥 Pulling latest changes from repository..."
git pull origin main

echo "📦 Installing dependencies..."
npm ci --prefer-offline

echo "🔨 Building frontend & fullstack assets..."
npm run build

echo "🔄 Reloading PM2 cluster with zero downtime..."
pm2 reload ecosystem.config.cjs --update-env

echo "✅ Deployment successful! IMS is live."
```

Make it executable:
```bash
chmod +x /var/www/misbah-ims/deploy.sh
```

---

# PART 4: Summary Checklist

- [x] **Supabase SQL Schema**: `/supabase/schema.sql` created with RLS, triggers, and seed data.
- [x] **Hostinger MySQL Migration**: `/my sql/ims_db_latest_migration.sql` created for phpMyAdmin.
- [x] **Teacher Attendance Rules**: Enforced via PostgreSQL trigger on Karachi and London timezones.
- [x] **Student Attendance Roll-Call**: Duplicate prevention enforced via unique keys.
- [x] **Audit Trail**: Trigger and table for administrative corrections.
- [x] **Hostinger Deployment**: Step-by-step VPS & Shared hosting setup documented with Nginx, PM2, and SSL.
