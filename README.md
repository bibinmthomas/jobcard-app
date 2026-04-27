# Job Card Manager

A desktop application for creating, managing, and exporting professional job cards. Built with Electron, React, and Prisma on SQLite.

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

### Backend (Main Process)
- **Electron 39** — Desktop application shell
- **Prisma 6 + SQLite** — ORM and embedded database
- **bcryptjs** — Password hashing

### Build / Dev
- **Vite 7** — Renderer build tool and dev server
- **Electron Forge 7** — Packaging and installer generation
- **concurrently / cross-env** — Dev tooling

---

## Architecture

### Directory Structure

```
jobcard-app/
├── electron/                  # Main process (Node.js / Electron)
│   ├── ipc/                   # IPC handlers
│   │   ├── auth.ipc.js
│   │   ├── jobcards.ipc.js
│   │   ├── accounts.ipc.js
│   │   ├── formFields.ipc.js
│   │   ├── pdf.ipc.js
│   │   ├── fileSystem.ipc.js
│   │   ├── appSettings.ipc.js
│   │   └── database.ipc.js
│   ├── prisma/                # Schema, migrations, generated client
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── generated/client/
│   ├── utils/
│   │   └── paths.js           # userData path resolution
│   ├── main.js                # Entry point, window creation
│   └── preload.js             # contextBridge API surface
│
└── renderer/                  # Renderer process (React)
    └── src/
        ├── pages/             # Dashboard, JobCards, Accounts, Reports, Admin, Login, Signup
        ├── components/        # JobCardForm, JobCardList, PDFPreviewModal, AdminSettings, …
        ├── contexts/          # AuthContext, ThemeContext
        └── utils/             # api.js (IPC wrapper)
```

### IPC Communication Flow

```
React UI → preload (contextBridge) → ipcMain handler → Prisma → SQLite
                                                               ↓
React UI ←─────────────────────────────────────── response
```

The renderer has no direct Node.js access. All data operations go through named IPC channels exposed via `preload.js`.

---

## Features

### Authentication
- Login / Signup with bcrypt-hashed passwords
- First-launch flow: auto-redirects to Signup when no users exist
- Role-based access: `admin` and `user` roles
- Session persists across window sessions (stored in memory, cleared on logout)

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
- Export to configurable path (default: `userData/pdf-exports/`)
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

Open Prisma Studio:
```bash
npx prisma studio --schema "electron/prisma/schema.prisma"
```

### Models

| Model | Purpose |
|---|---|
| `User` | Auth — username, bcrypt password, role (admin/user) |
| `Account` | Customer/client master data |
| `JobCard` | Core job card with all fields + `extraFields` JSON |
| `FormField` | Admin-defined extra fields (type, label, options) |
| `AppSettings` | Key/value store for app config (theme, export path) |

All models use soft delete (`isDeleted` flag). Hard deletes only happen via "Empty Recycle Bin" in Admin → Database.

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm 9+
- Python 3.x and Visual Studio Build Tools (required for native module compilation)

### Install

```bash
cd jobcard-app

# Install main process dependencies
npm install

# Install renderer dependencies
npm install --prefix renderer

# Generate Prisma client
npx prisma generate --schema=electron/prisma/schema.prisma

# Run initial migration (creates the SQLite database)
npx prisma migrate dev --schema=electron/prisma/schema.prisma
```

### Development

```bash
npm run dev
```

Starts both the Vite dev server (renderer) and Electron via `concurrently`.

### Build (Windows installer)

```bash
# Build renderer then package with Electron Forge
npm run build
```

Output: `out/make/squirrel.windows/x64/JobCardManager-Setup.exe`

See `jobard-docs/packaging-and-distribution.md` for the full build guide, including required pre-build steps for Prisma native binaries.

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

**Version:** 1.0.0  
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
- Electron packaging with Electron Forge

### Pending (before first distribution)
- Production `DATABASE_URL` fix in `main.js` (see packaging doc)
- `binaryTargets` added to `schema.prisma` for packaged Prisma engine
- `forge.config.js` metadata filled in (app name, icon, installer name)
- App icon assets created (`assets/icon.ico`)

---

## License

Proprietary — All rights reserved
