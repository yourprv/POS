# POS System (Closed Protocol)

A compact Point of Sale application for internal retail operations. This repository contains a React + Supabase frontend, an Express backend, and database schema files for a small store workflow.

## Overview

This project is designed for a closed-store environment where staff manage inventory, record sales, and track shipments between locations. It is intended for internal use by administrators and salespersons rather than public ecommerce.

The system includes:

- role-based access for `admin` and `salesperson`
- product catalog management
- sales recording with daily revenue aggregation
- shipment creation and receipt workflow
- Supabase realtime synchronization
- an Express backend for authenticated write operations

## What’s Included

- `src/` — React frontend application
- `server/` — Express backend API service
- `SUPABASE_SCHEMA.sql` — PostgreSQL schema definition
- `SUPABASE_RLS.sql` — Supabase row-level security rules
- `docs/salesman-quick-start.md` — salesperson quick-start guide
- `supabase/functions/rolling-archive/README.md` — edge function documentation
- `.env.example` — frontend environment template

## Core Features

- Admin dashboard for product, shipment, ledger, and user management
- Sales dashboard optimized for quick sales entry and product search
- Product creation, update, delete, and stock management
- Shipment workflow with `IN_TRANSIT` and `RECEIVED` status
- Revenue tracking by day and cumulative totals
- Realtime data updates via Supabase subscription channels
- Frontend data cache with remote refresh support

## Technology Stack

- Frontend: React 19, TypeScript, Vite 7, TailwindCSS 4
- Backend: Node.js, Express 4, JSON Web Tokens
- Database: Supabase / PostgreSQL
- Realtime: Supabase Realtime
- Build: `vite-plugin-singlefile`

## Project Structure

```
pos/
├── server/                  # Express backend API service
│   ├── index.js             # Backend routes and business logic
│   └── package.json         # Backend dependencies
├── src/                     # React frontend source
│   ├── main.tsx             # App entry point
│   ├── App.tsx              # Role-based UI routing
│   ├── types.ts             # Type definitions
│   ├── store.ts             # Data layer and API helpers
│   ├── context/             # React context provider
│   ├── components/          # UI components
│   ├── lib/                 # Supabase client code
│   └── utils/               # helper utilities
├── scripts/                 # helper scripts and migration utilities
├── docs/                    # user documentation and guides
├── supabase/                # Supabase functions and edge docs
├── SUPABASE_SCHEMA.sql      # database schema setup
├── SUPABASE_RLS.sql         # security policy definitions
├── .env.example             # env variable template
├── vite.config.ts           # Vite config
├── package.json             # frontend package config
└── LICENSE                  # project license file
```

## Backend Details

The backend is implemented in `server/index.js` and provides:

- authentication via `/api/login`
- role verification via `/api/verify-role`
- sale recording via `/api/record-sale`
- shipment creation via `/api/create-shipment`
- shipment receipt via `/api/receive-shipment`
- revenue queries via `/api/revenue` and `/api/revenue/:date`
- product management via `/api/create-product`, `/api/update-product`, and `/api/delete-product`

The backend uses a Supabase service role key to perform trusted updates and enforce business rules outside of direct client access.

## Frontend Details

The frontend entry point is `src/App.tsx`, which renders either the admin dashboard or salesperson dashboard depending on the logged-in user role.

`src/context/AppContext.tsx` manages global application state, remote refreshes, and Supabase realtime subscriptions.

`src/store.ts` provides the core data layer and includes helpers for login, product operations, sales recording, shipment handling, and analytics.

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Supabase project with PostgreSQL
- Supabase anon key for frontend reads
- Supabase service role key for backend writes

### Setup

1. Install frontend dependencies:

```bash
cd /home/pravat/Music/POS/pos
npm install
```

2. Install backend dependencies:

```bash
cd /home/pravat/Music/POS/pos/server
npm install
```

3. Create environment files:

```bash
cp .env.example .env
# create server/.env manually with the values below
```

4. Configure environment variables:

Frontend `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_URL=http://localhost:3000
```

Backend `server/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
PORT=3000
```

### Database Setup

Use the SQL files to define the database schema and access rules:

- `SUPABASE_SCHEMA.sql`
- `SUPABASE_RLS.sql`

### Run Locally

Start the backend service:

```bash
cd /home/pravat/Music/POS/pos/server
npm run dev
```

Start the frontend app:

```bash
cd /home/pravat/Music/POS/pos
npm run dev
```

Open the URL shown by Vite in your browser.

## Notes

- Login is handled through `local_users` in Supabase rather than Supabase Auth.
- The shipped backend requires the service role key and should be hosted securely.
- Shipments are recorded separately from stock decrementing, and stock is updated when the shipment is received.
- The application is designed for internal store operations, not public sales.

## Documentation

- `docs/salesman-quick-start.md` — quick usage guide for sales staff
- `supabase/functions/rolling-archive/README.md` — rolling archive function information

## License

This project is licensed under the MIT License. See `license.md` for the full text.
