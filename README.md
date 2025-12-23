# Job Card Application

A powerful desktop application for creating, managing, and generating professional job cards with customizable layouts, field categories, and PDF export capabilities.

## Overview

The Job Card Application is an Electron-based desktop solution that enables users to create structured job cards with dynamic custom fields, multi-layout support, and advanced PDF generation. Built with a modern tech stack, it provides a seamless user experience with features like theme customization, soft delete functionality, and database management.

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Tailwind CSS** - Utility-first styling
- **React Query (TanStack Query)** - Server state management
- **React Hook Form** - Form handling and validation
- **React Router DOM** - Client-side routing

### Backend
- **Electron** - Desktop application framework
- **Node.js** - Runtime environment
- **Prisma ORM** - Database management and migrations
- **SQLite** - Embedded database
- **PDFKit** - PDF generation engine

### Development Tools
- **Vite** - Build tool and dev server
- **ESLint** - Code linting
- **PostCSS** - CSS processing

## Architecture

### Application Structure

```
jobcard-app/
├── electron/                 # Backend (Main Process)
│   ├── ipc/                 # IPC handlers for communication
│   │   ├── jobcards.ipc.js
│   │   ├── customFields.ipc.js
│   │   ├── fieldCategories.ipc.js
│   │   ├── layouts.ipc.js
│   │   ├── appSettings.ipc.js
│   │   ├── database.ipc.js
│   │   ├── pdf.ipc.js
│   │   └── fileSystem.ipc.js
│   ├── prisma/              # Database schema and migrations
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── main.js              # Electron main process
│   └── preload.js           # Secure bridge to renderer
│
└── renderer/                # Frontend (Renderer Process)
    ├── src/
    │   ├── components/      # React components
    │   ├── contexts/        # React context providers
    │   ├── hooks/           # Custom React hooks
    │   ├── pages/           # Page components
    │   └── utils/           # Utility functions and API layer
    └── public/              # Static assets
```

### Communication Flow

The application uses Electron's IPC (Inter-Process Communication) pattern:

1. **Renderer Process** (React UI) → Preload Script (contextBridge)
2. **Preload Script** → Main Process (IPC handlers)
3. **Main Process** → Prisma ORM → SQLite Database
4. Response flows back through the same chain

This architecture ensures security by isolating the renderer process from Node.js APIs while maintaining efficient communication.

## Database Schema
 - To open prisma studio - npx prisma studio --schema "electron/prisma/schema.prisma"
### Core Models

- **JobCard** - Main job card entities with title, description, and layout association
- **Layout** - Customizable layout templates with JSON configuration
- **FieldCategory** - Organizational categories for custom fields
- **CustomField** - Dynamic field definitions (text, number, date, select)
- **LayoutCategory** - Junction table for layout-category relationships
- **AppSettings** - Application configuration (export path, theme preferences)

### Key Features
- Soft delete functionality across all models (`isDeleted` flag)
- Relational integrity with foreign key constraints
- Flexible JSON configuration for layout elements
- Order management for categories and fields

## Completed Features

### ✅ Phase 1: Field Categories + Layout Selection (Partial)

**Backend Infrastructure (60% Complete)**
- Field category management IPC handlers
- App settings IPC handlers
- Custom fields with category relationships
- Soft delete implementation for custom fields
- Frontend hooks for categories and settings

**Status:** Backend core complete, UI components pending

### ✅ Phase 2: Soft Delete + Export Path Configuration (100% Complete)

**Soft Delete System**
- Non-destructive deletion across all entities
- Filtered queries exclude deleted records
- Data recovery capabilities through database management

**Export Configuration**
- Custom export path selection with native folder dialog
- Path validation and persistence
- Default fallback to user documents
- Manual path input support

### ✅ Phase 3: Theme Support (100% Complete)

**Theme System**
- Three theme modes: Light, Dark, System
- Automatic system theme detection
- Persistent theme preferences
- Real-time theme switching (no reload required)
- Dark mode optimized UI components

**Implementation**
- Tailwind CSS dark mode with class strategy
- React Context for theme state management
- System preference synchronization
- Theme settings UI with visual indicators

### ✅ Phase 3.5: Database Management UI (100% Complete)

**Database Statistics Dashboard**
- Real-time database statistics
- Entity counts by type (JobCards, Layouts, Categories, Fields)
- Active vs deleted record breakdown
- Estimated database size
- Auto-refresh every 5 seconds

**Storage Management**
- "Empty Recycle Bin" - Permanently remove soft-deleted records
- Recoverable space calculation
- Confirmation dialogs for safety

**Danger Zone**
- Complete database reset functionality
- Double confirmation requirement
- Preserves app settings (export path, theme)
- Clear warning messages

### Core Functionality

**Job Card Management**
- Create, read, update, delete job cards
- Associate job cards with layouts
- Dynamic custom field rendering
- Search and filter capabilities

**Layout Builder**
- Visual layout designer
- Drag-and-drop element positioning
- Text elements with placeholder support
- Field category associations
- Layout preview functionality

**PDF Generation**
- Professional PDF export
- Custom export path support
- Layout-based rendering
- Job card data population

**Custom Fields**
- Multiple field types (text, number, date, select)
- Required field validation
- Custom ordering
- Category organization

## Planned Features

### ⏳ Phase 1 Completion
- Field category management UI
- Layout selection workflow in job card form
- Category-specific field management
- Enhanced layout builder with category picker

### ⏳ Phase 4: Enhanced Layout Builder
- Rich text editor (TipTap integration)
- Table creation and editing
- Image upload with crop functionality
- Multi-page layout support
- Advanced preview mode
- Enhanced PDF generation with rich formatting

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd jobcard-app

# Install dependencies
npm install

# Install renderer dependencies
cd renderer
npm install
cd ..

# Set up database
npx prisma generate
npx prisma migrate dev
```

### Development

```bash
# Start the application in development mode
npm run dev
```

### Build

```bash
# Build for production
npm run build

# Build for specific platform
npm run build:win   # Windows
npm run build:mac   # macOS
npm run build:linux # Linux
```

## Configuration

### Export Path
Configure the default PDF export location in **Admin → Settings → Export Path**

### Theme
Choose your preferred theme in **Admin → Settings → Theme**
- Light mode
- Dark mode
- System (auto-sync with OS)

### Database
Manage database operations in **Admin → Database**
- View statistics
- Empty recycle bin
- Reset database (caution!)

## Project Status

**Current Version:** 1.0.0-beta  
**Status:** Active Development

**Completion:**
- Database Schema: 100%
- Backend Infrastructure: 85%
- Core Features: 75%
- UI/UX: 60%

## Contributing

This is a private project. For questions or suggestions, please contact the development team.

## License

Proprietary - All rights reserved

---

**Built with ❤️ using Electron, React, and Prisma**