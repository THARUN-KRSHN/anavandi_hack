# 🚌 BUS സഹായി (Bus Sahayi) — KSRTC Grievance & Depot Accountability Platform

[![Bilingual](https://img.shields.io/badge/Language-English%20%7C%20%E0%B4%AE%E0%B4%B2%E0%B4%AF%E0%B4%BE%E0%B4%B3%E0%B4%82-emerald)](#bilingual-ui)
[![AI-Layer](https://img.shields.io/badge/AI%20Intelligence-OpenRouter%20%7C%20Gemini%20%7C%20Rule%20Fallback-purple)](#ai-intelligence-layer)
[![Backend](https://img.shields.io/badge/Backend-Python%20Flask%20%7C%20APScheduler-blue)](backend/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%20%7C%20TailwindCSS-purple)](src/)
[![Database](https://img.shields.io/badge/Database-Supabase%20%7C%20PostgreSQL-green)](#database-architecture)
[![Notifications](https://img.shields.io/badge/Notifications-SMTP%20Email%20%7C%20Fast2SMS-red)](#notification-flow)

---

## 📌 Executive Summary

**BUS സഹായി** is a next-generation public transport grievance redressal, AI intelligence, and depot accountability platform built for **Kerala State Road Transport Corporation (KSRTC)**. It bridges the gap between passengers, depot heads, duty conductors, and state administration by introducing **smart route matching**, **SLA auto-escalation**, **floating glassmorphic pill UI**, **100% bilingual accessibility**, an **AI Intelligence & Resilience Layer (OpenRouter + Level 2 Rule Fallback)**, and a **4-tier automated email/SMS dispatch pipeline**.

---

## ✨ Key Features

### 1. 🌐 Floating Pill Design & 100% Site-Wide Bilingual UI
- **Floating Pill Header Module**: Sleek floating glassmorphic header pill (`bg-white/90 backdrop-blur-xl border border-emerald-200/80 rounded-full shadow-lg`) containing brand logo badges, role pill tags, and controls.
- **100% Site-Wide Bilingual System**: Seamless one-click toggle between **English** and **മലയാളം** (Malayalam) across all pages — including the **Login/Sign-up Page**, Left Sidebar Menu, Depot Head Reports Dashboard, Conductor Dispatch Outbox, State HQ Governance, and Conductor Mobile Portal.

### 2. 🧠 AI Intelligence Layer & Fallback Engine
Powered by OpenRouter API (`nex-agi/nex-n2.5-mini:free` / Gemini) with an isolated **Level 2 Rule Fallback Engine**:
- **Complaint Intelligence (`/api/ai/analyze/<id>`)**: Analyzes grievance text, verifies category mismatches, and suggests resolution priority.
- **Duplicate Signal Detection (`/api/ai/duplicates/<id>`)**: Compares incoming complaints against recent depot submissions on the same route/bus/time to alert depot heads.
- **Submission Spike Anomaly (`/api/ai/anomalies`)**: Monitors rapid submission spikes (e.g. 30 complaints / 10 mins) and flags suspicious activity for Admin review.
- **Statewide Executive Transit Trends (`/api/ai/trends`)**: Aggregates multi-depot complaint volume and generates executive trend advisories for State HQ.
- **Level 2 Rule Fallback Engine**: If OpenRouter API times out or fails, deterministic rule fallback executes seamlessly with 0% system disruption.
- **BUS സഹായി AI Lab & Security Simulator**: Interactive frontend console (`AILabDemoConsole.tsx`) for testing hackathon edge cases, AI resilience, and authentication safeguards.

### 3. 🗺️ Smart Depot Auto-Routing
- Automatically resolves responsible KSRTC Depots based on bus registration (e.g. `KL-15-A-4021`) or route origin/destination nodes.
- Handles fuzzy alias matching (`EKM` ↔ `Ernakulam`, `Aluva` ↔ `DEPOT_ALUVA`).

### 4. ⏱️ SLA Auto-Escalation Engine
- Background scheduler (`APScheduler`) checks complaint resolution SLA deadlines every minute.
- Automatically escalates overdue complaints to **State Admin** and notifies Depot Heads.
- SLA limits by category:
  - `UNSAFE_DRIVING`: 1 Hour (Urgent)
  - `OVERCROWDING`: 2 Hours (High)
  - `CLEANLINESS`: 4 Hours (Normal)
  - `MISSED_STOP`: 4 Hours (Medium)
  - `CONCESSION_DENIAL`: 4 Hours (Medium)
  - `OTHER`: 6 Hours (Low)

### 5. 📩 Complete 4-Tier Email & Action Link Dispatch
- **USER_TO_DEPOT**: Sends instant notification email to Depot Head and confirmation to passenger.
- **DEPOT_TO_USER**: Notifies passenger on status updates (`UNDER_REVIEW`, `ASSIGNED`, `RESOLVED`).
- **DEPOT_TO_CONDUCTOR**: Dispatches secure single-use action links via email to the Depot Head for duty conductors.
- **ESCALATION_TO_ADMIN**: Flags SLA breaches to State HQ Admin.

---

## 🔑 Demo Credentials

| Role | Email / Username | Password | Assigned Depot |
|---|---|---|---|
| **Depot Head (Adoor)** | `head@adoor.demo` | `depot123` | Adoor Depot |
| **Depot Head (Aluva)** | `head@aluva.demo` | `depot123` | Aluva Depot |
| **Depot Head (Ernakulam)** | `head@ernakulam.demo` | `depot123` | Ernakulam Central Depot |
| **Depot Head (Trivandrum)** | `head@trivandrum.demo` | `depot123` | Trivandrum Central |
| **State HQ Admin** | `admin_head` | `admin123` | State Headquarters |
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

### 4. Mobile Testing via Cloudflare Tunnel
```bash
cloudflared tunnel --protocol http2 --url http://localhost:5173
```

---

## 📡 Key AI & Core API Endpoints

### AI Layer Endpoints
- `POST /api/ai/analyze/<id>` — AI complaint classification & priority suggestion
- `POST /api/ai/duplicates/<id>` — Vector duplicate detection against candidate complaints
- `GET /api/ai/anomalies` — Submission frequency anomaly detection
- `GET /api/ai/trends` — Statewide executive transit trend advisory
- `POST /api/ai/demo/simulate` — AI Lab & Security Simulator scenario endpoint

### Core Grievance Endpoints
- `POST /api/auth/login` — Authenticate passenger, depot head, or admin
- `POST /api/complaints` — Submit new complaint
- `GET /api/complaints/<ref_no>` — Fetch complaint details & status timeline
- `GET /api/depot/complaints` — Filtered depot complaint queue
- `POST /api/depot/complaints/<id>/notify-conductor` — Dispatch single-use conductor action link via email
- `GET /api/conductor/action/<token>` — Conductor mobile field update view

---

## 📜 License & Acknowledgments

Developed for the **Anavandi KSRTC Hackathon 2026**. Designed to enhance public transportation governance, AI-assisted intelligence, and passenger convenience in Kerala.
