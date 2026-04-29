# Job Card Manager

A desktop application for creating, managing, and exporting professional job cards. Built with Tauri 2, React, and SQLite (rusqlite).

## Overview

Job Card Manager is a Windows desktop app designed for workshops and manufacturing operations. It supports multi-user access with role-based authentication, structured job card entry, account management, PDF export, and reporting — all stored locally with no internet connection required.

## Tech Stack

### Frontend
- **React 19** — UI framework
- **Tailwind CSS** — Utility-first styling
- **TanStack Query v5** — Server state management
- **React Router DOM v7** — Client-side routing
- **@react-pdf/renderer** — PDF generation and preview
- **Lucide React** — Icon library

### Backend (Tauri / Rust)
- **Tauri 2** — Desktop application shell and native bridge
- **rusqlite** — Embedded SQLite database (via Rust)
- **bcrypt** — Password hashing (Rust crate)

### Build / Dev
- **Vite 7** — Renderer build tool and dev server
- **@tauri-apps/cli** — Tauri CLI for dev and packaging

---

## Architecture

### Directory Structure

```
jobcard-app/
├── src-tauri/                 # Tauri / Rust backend
│   ├── src/
│   │   ├── main.rs            # Entry point
│   │   ├── lib.rs             # Command registrations
│   │   ├── db/                # Database setup and migrations
│   │   └── commands/          # Tauri commands (auth, jobcards, accounts, …)
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── renderer/                  # React frontend
│   └── src/
│       ├── pages/             # Dashboard, JobCards, Accounts, Reports, Admin, Login, Signup
│       ├── components/        # JobCardForm, JobCardList, PDFPreviewModal, AdminSettings, …
│       ├── contexts/          # AuthContext, ThemeContext
│       └── utils/             # api.js (invoke() wrapper)
│
└── assets/                    # App icons
```

### Communication Flow

```
React UI → invoke() (@tauri-apps/api) → Rust command → rusqlite → SQLite
                                                                  ↓
React UI ←──────────────────────────────────────────── response
```

The renderer has no direct filesystem or database access. All data operations go through Tauri commands registered in Rust and called via `invoke()`.

---

## Features

### Authentication
- Login / Signup with bcrypt-hashed passwords
- First-launch flow: auto-redirects to Signup when no users exist
- Role-based access: `admin` and `user` roles
- Session persists in memory, cleared on logout

### Job Cards
- Create, edit, soft-delete job cards
- Auto-generated job number (`PREFIX/NNNN`)
- Core fields: customer, contract/LC/OGC/PO/bill/drawing numbers, part name, qty
- Time tracking: setting time, job time, machine hours (start/end/total)
- Specifications: PL, thickness, taper
- Assignment: operator, remark, program number, amount
- Extra fields: admin-configurable dynamic fields stored as JSON per card
- Link each job card to an account

### Accounts
- Create and manage customer/client accounts
- Fields: name, address, city, PIN, fax, telex, contact person
- Soft delete; unique constraint on (name, city)
- Account selector on the job card form

### PDF Export
- Live PDF preview via `@react-pdf/renderer`
- Export to configurable path (default: app data directory)
- PDF template: `JobCardPDFTemplate`
- Report PDF: `ReportPDFTemplate`

### Reports
- Dedicated reports page with PDF export

### Admin Panel
- **Form Fields** — define extra fields (string / number / date / multiselect) that appear on every job card
- **Settings** — configure PDF export path, theme preference
- **Database** — view record counts, empty soft-deleted records, full database reset

### Theme
- Light, Dark, System (auto-sync with OS)
- Persisted via `AppSettings` table
- Real-time switching, no reload required

---

## Database Schema

Managed directly via Rust (`rusqlite`) with migration scripts in `src-tauri/src/db/`.

| Table | Purpose |
|---|---|
| `users` | Auth — username, bcrypt password, role (admin/user) |
| `accounts` | Customer/client master data |
| `job_cards` | Core job card with all fields + `extra_fields` JSON |
| `form_fields` | Admin-defined extra fields (type, label, options) |
| `app_settings` | Key/value store for app config (theme, export path) |

All tables use soft delete (`is_deleted` flag). Hard deletes only happen via "Empty Recycle Bin" in Admin → Database.

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm 9+
- Rust toolchain (`rustup`) with `stable` channel
- Tauri prerequisites: [https://tauri.app/start/prerequisites/](https://tauri.app/start/prerequisites/)

### Install

```bash
cd jobcard-app

# Install Tauri CLI
npm install

# Install renderer dependencies
npm install --prefix renderer
```

### Development

```bash
npm run dev
```

Starts the Vite dev server (renderer) and the Tauri dev window together.

### Build (Windows installer)

```bash
npm run build
```

Output: `src-tauri/target/release/bundle/`

---

## Configuration

| Setting | Where |
|---|---|
| PDF export path | Admin → Settings |
| Theme (light/dark/system) | Admin → Settings |
| Extra job card fields | Admin → Form Fields |
| Database maintenance | Admin → Database |

---

## Project Status

**Version:** 1.0.1  
**Status:** Feature-complete, pre-distribution

### What's done
- Multi-user authentication with roles
- Full job card CRUD with all domain fields
- Account management
- PDF preview and export
- Reports with PDF export
- Admin-configurable extra fields
- Theme system (light/dark/system)
- Database management (stats, recycle bin, reset)
- Migrated from Electron to Tauri 2

---

## License

Proprietary — All rights reserved
