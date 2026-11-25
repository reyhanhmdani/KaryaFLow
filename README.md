# KaryaFlow — Modern Employee Portal & HRIS

KaryaFlow is a full-stack Employee Self-Service (ESS) and lightweight HRIS built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Prisma v7 (PostgreSQL)**.

---

## Key Features

- **Role-Based Architecture (`User` + Optional `EmployeeProfile`):**
  - **`EMPLOYEE`**: Personal workspace for GPS geofenced clock-in/out, leave requests, digital payslips, and live KPI scorecards.
  - **`HR_ADMIN`**: Full HR operations (leave approval/rejection with anti self-approval, deterministic monthly payroll generation, KPI evaluations, office geofence configuration). Supports both HR staff with an employee profile and non-employee system admins.
  - **`EXECUTIVE` (Read-Only)**: Executive oversight dashboard monitoring HR attendance discipline, leave SLA processing times, payroll pipeline status, and cross-team performance.
- **Smart Attendance & Geofencing:**
  - Server-verified Haversine distance validation (`100m` default radius) with mandatory WFH notes when outside office radius.
  - Interactive **OpenStreetMap (Leaflet)** radar map with a toggleable **Google Maps** embed view.
- **Transactional Leave Management:**
  - Weekday-only (`Mon–Fri`) leave calculation, overlap protection, and atomic `prisma.$transaction` updates deducting `leaveQuota` and recording `ON_LEAVE` attendance entries.
- **Deterministic Payroll & A4 Print Slip:**
  - Automated calculation of base salary, fixed allowances, late penalties, unpaid leave deductions, and 5% BPJS, with `DRAFT` → `PROCESSED` → `PAID` immutability and a dedicated `/print/payroll/[id]` A4 print layout.

---

## Tech Stack

- **Framework:** Next.js 16.4.6 (App Router), React 19, TypeScript
- **Styling & Motion:** Tailwind CSS v4, `Bricolage Grotesque` + `Onest` + `JetBrains Mono`, `motion/react` v14
- **Database & ORM:** PostgreSQL, Prisma v7 (`@prisma/adapter-pg`, `pg`)
- **Maps & Icons:** Leaflet (OpenStreetMap), `lucide-react`
- **Validation & Auth:** Zod, stateless HMAC-SHA256 HTTP-only session cookies, `crypto.scryptSync`

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/karyaflow"
SESSION_SECRET="replace-with-a-random-secret-at-least-32-characters-long"
NEXT_PUBLIC_DEMO_MODE="true"
```

### 3. Push Schema & Seed Demo Data
```bash
npx prisma db push
npx prisma generate
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000`.

---

## Demo Accounts (`password123`)

| Email | Role | Profile | Purpose |
| :--- | :--- | :--- | :--- |
| `budi@karyaflow.id` | `EMPLOYEE` | `KF-2026-001` | Standard employee self-service |
| `siti@karyaflow.id` | `HR_ADMIN` | `KF-2026-002` | HR Manager with active attendance & payroll |
| `admin@karyaflow.id` | `HR_ADMIN` | `null` | Non-employee system HR admin |
| `bos@karyaflow.id` | `EXECUTIVE` | `null` | Read-only executive oversight |
