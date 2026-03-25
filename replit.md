# نظام نقاط البيع العربي (Arabic POS System)

## Overview

A full-featured Arabic (RTL) Point of Sale system built with the MERN-equivalent stack (MongoDB replaced with PostgreSQL/Drizzle ORM). Production-ready, portfolio-grade application.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 18 + Vite + Tailwind CSS (RTL Arabic)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (bcryptjs + jsonwebtoken)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Charts**: Recharts
- **Build**: esbuild (CJS bundle)

## Demo Credentials

- **Admin**: admin@pos.com / admin123
- **Cashier**: cashier@pos.com / cashier123

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (backend)
│   └── pos-system/         # React + Vite POS frontend (Arabic RTL)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
└── pnpm-workspace.yaml     # pnpm workspace
```

## Features

### Authentication & Authorization
- JWT-based authentication stored in localStorage
- Role-based access control (Admin & User)
- Protected routes with automatic redirect to login

### Products Management
- Full CRUD for products
- Category management
- Inventory tracking with low stock alerts
- Product search and filtering

### Sales System
- POS terminal interface (create sales/invoices)
- Multi-product cart with auto-calculation
- Support for cash, card, and bank transfer payments
- Discount and tax support

### Invoices System
- Auto-generated invoice numbers
- Full invoice details view
- Invoice search and date filtering

### Customer Management
- Full CRUD for customers
- Customer purchase history tracking

### Reports & Analytics
- Dashboard with KPI cards
- 7-day sales chart
- Daily and monthly reports
- Top products by revenue

### Notifications
- Low stock alerts (automatic)
- Sale completion notifications
- Mark as read / mark all as read

### Admin Panel
- User management (admin-only)
- Full dashboard overview

## API Routes

All routes prefixed with `/api`:

- `POST /auth/register` - Register user
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user
- `GET/POST /users` - User management
- `GET/POST /categories` - Category management
- `GET/POST /products` - Product management
- `GET/POST /customers` - Customer management
- `GET/POST /sales` - Sales transactions
- `GET /invoices` - Invoice listing
- `GET /reports/dashboard` - Dashboard stats
- `GET /reports/daily` - Daily report
- `GET /reports/monthly` - Monthly report
- `GET /reports/top-products` - Top products
- `GET /notifications` - Notifications
- `PUT /notifications/:id/read` - Mark read
- `PUT /notifications/read-all` - Mark all read

## Database Schema

Tables: `users`, `categories`, `products`, `customers`, `sales`, `sale_items`, `notifications`

Run migrations: `pnpm --filter @workspace/db run push`
