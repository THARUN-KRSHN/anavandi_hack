# 🚌 BUS സഹായി (Bus Sahayi) — KSRTC Grievance & Depot Accountability Platform

[![Bilingual](https://img.shields.io/badge/Language-English%20%7C%20%E0%B4%AE%E0%B4%B2%E0%B4%AF%E0%B4%BE%E0%B4%B3%E0%B4%82-emerald)](#bilingual-ui)
[![Backend](https://img.shields.io/badge/Backend-Python%20Flask%20%7C%20APScheduler-blue)](backend/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%20%7C%20TailwindCSS-purple)](src/)
[![Database](https://img.shields.io/badge/Database-Supabase%20%7C%20PostgreSQL-green)](#database-architecture)
[![Notifications](https://img.shields.io/badge/Notifications-Fast2SMS%20%7C%20SMTP%20Email-red)](#notification-flow)

---

## 📌 Executive Summary

**BUS സഹായി** is a next-generation public transport grievance redressal and depot accountability platform built for **Kerala State Road Transport Corporation (KSRTC)**. It bridges the gap between passengers, depot heads, duty conductors, and state administration by introducing **smart route matching**, **SLA auto-escalation**, **bilingual accessibility**, and a **4-tier automated notification pipeline** via Fast2SMS and SMTP Email.

---

## ✨ Key Features

### 1. 🌐 Bilingual UI (English & Malayalam)
- Instant toggle between **English** and **മലയാളം** (Malayalam) across all pages.
- Native localization for passenger reporting, tracking, depot management, and administration.

### 2. 🗺️ Smart Depot Auto-Routing
- Automatically resolves the responsible KSRTC Depot based on bus registration (e.g. `KL-15-A-4021`) or route origins/destinations.
- Handles fuzzy alias matching (e.g. `EKM` ↔ `Ernakulam`, `Aluva` ↔ `DEPOT_ALUVA`).

### 3. ⏱️ SLA Auto-Escalation Engine
- Built-in background scheduler (`APScheduler`) monitors complaint resolution SLA deadlines.
- Automatically escalates overdue complaints to **State Admin** and notifies the Depot Head.
- SLA limits by category:
  - `UNSAFE_DRIVING`: 1 Hour (Urgent)
  - `OVERCROWDING`: 2 Hours (High)
  - `CLEANLINESS`: 4 Hours (Normal)
  - `MISSED_STOP`: 4 Hours (Medium)
  - `CONCESSION_DENIAL`: 4 Hours (Medium)
  - `OTHER`: 6 Hours (Low)

### 4. 📩 Complete 4-Tier Notification Flow

```
                      BUSINESS EVENT
                            │
                            ▼
                 ┌────────────────────┐
                 │ NotificationService│
                 └─────────┬──────────┘
                           │
                 ┌─────────┴─────────┐
                 │                   │
                 ▼                   ▼
          ┌─────────────┐     ┌─────────────┐
          │  FAST2SMS   │     │  SMTP EMAIL │
          │     SMS     │     │  HTML MAILER│
          └─────────────┘     └─────────────┘
```

| Type | Trigger | Recipient | Channels | Description |
|---|---|---|---|---|
| **1. USER_TO_DEPOT** | Complaint Submitted | Depot Head + Passenger | Email + SMS | Depot receives incident details; passenger gets confirmation ref #. |
| **2. DEPOT_TO_USER** | Status Transition | Passenger | Email + SMS | Notifies passenger when status moves to `UNDER_REVIEW`, `ASSIGNED`, `ACTION_TAKEN`, or `RESOLVED`. |
| **3. DEPOT_TO_CONDUCTOR** | Duty Assignment | Conductor | SMS + Email | Sends secure one-time action URL to duty conductor for field response. |
| **4. ESCALATION_TO_ADMIN** | SLA Breach | Admin + Depot Head | Email + SMS | Flags overdue cases to State Admin and reminds Depot Head. |

> 🔒 **DEMO MODE**: During testing, SMS is routed to `+919778585423` and Email to `tharunkrishnachoolikattil@gmail.com` while maintaining logical recipient tracking in the DB.

### 5. 📑 Official PDF Export with Brand Badge
- Generates official PDF reports containing complaint details, route information, timeline history, and the **BUS സഹായി** official logo badge.

### 6. 👥 Role-Based Access Control (RBAC)
- **Passenger**: File complaints, track status, view history, download PDF reports.
- **Depot Head**: Manage depot case queue, assign conductors, update statuses, inspect fleet/crew.
- **State Admin**: State-wide analytics, depot index, SLA breach monitoring, route hotspots.
- **Conductor**: Direct status update via secure token action link (no login required).

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 + Vite + TypeScript
- **Styling**: Vanilla CSS + TailwindCSS (Glassmorphism & White-first Design System)
- **Icons**: Lucide React
- **3D Graphics**: Three.js / React Three Fiber (Interactive Bus Canvas)
- **PDF Generation**: `jspdf` + `jspdf-autotable`

### Backend
- **Framework**: Python 3.12 Flask
- **ORM / Database**: SQLAlchemy / SQLite + Supabase Integration
- **Scheduler**: APScheduler (SLA Monitoring & Escalation)
- **SMS Gateway**: Fast2SMS / Twilio REST API
- **Email Gateway**: Python `smtplib` + HTML Email Templates

---

## 🔑 Demo Credentials

| Role | Email / Username | Password | Assigned Depot |
|---|---|---|---|
| **Depot Head (Aluva)** | `depot_aluva` | `depot123` | Aluva Depot |
| **Depot Head (EKM)** | `depot_ekm` | `depot123` | Ernakulam Depot |
| **State Admin** | `admin` | `admin123` | State Headquarters |
| **Passenger** | `passenger@example.com` | `user123` | N/A |

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 1. Clone the Repository
```bash
git clone https://github.com/THARUN-KRSHN/anavandi_hack.git
cd anavandi_hack
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```
> Backend runs at: `http://localhost:5000`

### 3. Frontend Setup
```bash
# In the root project directory
npm install
npm run dev -- --host
```
> Frontend runs at: `http://localhost:5173`

---

## ⚙️ Environment Configuration

### Backend `.env` (`backend/.env`)
```env
JWT_SECRET=hackathon-grievance-secret-2026-ksrtc-secure
DATABASE_URL=sqlite:///instance/app.db

HOST=0.0.0.0
PORT=5000
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# Supabase Storage & DB
SUPABASE_URL=https://vgventkqdwzzyxkdughg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI...

# Email Gateway (Gmail SMTP)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tharunkrishnachoolikattil@gmail.com
SMTP_PASSWORD=amqa jhmx eonn ouyf
SMTP_SENDER=BUS സഹായി KSRTC <noreply@bussahayi.gov.in>

# SMS Gateway (Fast2SMS)
FAST2SMS_API_KEY=q4oTG2H6hmWX9fBDdNkxlSsjZ5O3Aap1FQRzJLrv07nICPguwtAVFXd1tkqGh6Yc3bf9v87s4S2xzZwJ
DEMO_SMS_NUMBER=+919778585423
```

---

## 📡 Key API Endpoints

### Auth
- `POST /api/auth/login` — Authenticate passenger, depot head, or admin
- `POST /api/auth/signup` — Register new passenger account

### Complaints
- `POST /api/complaints` — Submit new complaint (with optional image uploads)
- `GET /api/complaints/mine` — Retrieve current user's complaint history
- `GET /api/complaints/<ref_no>` — Fetch complaint detail with complete timeline
- `GET /api/complaints/<ref_no>/pdf` — Download complaint PDF report

### Depot Management
- `GET /api/depot/dashboard` — Depot KPI dashboard statistics
- `GET /api/depot/complaints` — Filtered depot complaint queue
- `PATCH /api/depot/complaints/<id>/status` — Update complaint status
- `POST /api/depot/complaints/<id>/notify-conductor` — Dispatch SMS to conductor

### Conductor Action
- `GET /api/conductor/action/<token>` — View complaint details for action link
- `POST /api/conductor/action/<token>` — Submit conductor field resolution

---

## 📜 License & Acknowledgments

Developed for the **Anavandi KSRTC Hackathon 2026**. Designed to enhance public transportation governance, accountability, and passenger convenience in Kerala.
