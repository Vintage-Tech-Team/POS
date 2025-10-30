# Generic Web-based POS System

A comprehensive multi-tenant Point of Sale system with sales, purchases, inventory, accounting, and reporting capabilities.

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT
- **Barcode**: bwip-js
- **PDF**: pdfkit

## Features

- 🛒 **POS System**: Barcode-enabled sales with real-time inventory updates
- 📦 **Inventory Management**: Stock tracking, warehouse management, reorder alerts
- 💰 **Purchases & Sales**: Complete purchase and sales workflow
- 📊 **Accounting**: Chart of accounts, auto-generated vouchers, P&L reports
- 🏢 **Multi-tenant**: Complete data isolation per company
- 🔐 **Role-based Access**: JWT authentication with role guards
- 📈 **Reports**: Sales, inventory, and financial reports

## Project Structure

```
POS/
├── backend/           # NestJS API
│   ├── src/
│   │   ├── modules/   # Feature modules
│   │   ├── common/    # Shared utilities
│   │   └── main.ts
│   └── package.json
├── frontend/          # Next.js app
│   ├── src/
│   │   ├── app/       # App router pages
│   │   ├── components/
│   │   └── lib/       # Utils & API client
│   └── package.json
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone and install dependencies:**

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

2. **Setup environment variables:**

```bash
# Backend (.env)
cd backend
cp .env.example .env
# Edit .env with your database credentials
```

3. **Start PostgreSQL:**

```bash
docker-compose up -d postgres
```

4. **Run migrations and seed data:**

```bash
cd backend
npm run migration:run
npm run seed
```

5. **Start the development servers:**

```bash
# Terminal 1 - Backend (port 3001)
cd backend
npm run start:dev

# Terminal 2 - Frontend (port 3000)
cd frontend
npm run dev
```

6. **Access the application:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs

### Default Login

```
Email: admin@example.com
Password: admin123
```

## API Documentation

The API follows RESTful conventions. Key endpoints:

### Authentication

- `POST /api/auth/register` - Register company + admin
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token

### Products

- `GET /api/products` - List products
- `POST /api/products` - Create product
- `POST /api/products/:id/generate-barcode` - Generate barcode

### Sales (POS)

- `POST /api/sales/pos` - Create POS sale
- `GET /api/sales` - List sales
- `POST /api/sales/:id/return` - Process return

### Purchases

- `POST /api/purchases` - Create purchase
- `POST /api/purchases/:id/payment` - Record payment

### Inventory

- `GET /api/inventory/stock` - Current stock levels
- `POST /api/inventory/adjust` - Manual adjustment

### Accounting

- `GET /api/accounting/coa` - Chart of accounts
- `GET /api/accounting/pnl` - Profit & Loss report

## Testing

### Quick Start Testing

We provide comprehensive testing tools to verify all modules work correctly:

1. **Automated Test Workflow** - Runs a complete purchase-to-sale scenario:

```bash
./test-workflow.sh
```

2. **Data Integrity Check** - Verifies data consistency:

```bash
./verify-data-integrity.sh
```

3. **Manual Testing Guide** - Step-by-step testing scenarios:

```bash
# See TESTING_GUIDE.md for detailed instructions
```

4. **Quick Reference** - Test credentials and expected results:

```bash
# See TEST_REFERENCE.md for quick lookups
```

### Test User Credentials

| Role       | Email                  | Password      |
| ---------- | ---------------------- | ------------- |
| Admin      | admin@example.com      | admin123      |
| Manager    | manager@example.com    | manager123    |
| Cashier    | cashier@example.com    | cashier123    |
| Accountant | accountant@example.com | accountant123 |

### What to Test

- ✅ **Stock Management**: Purchase increases stock, sales decrease it
- ✅ **Accounting**: Auto-generated vouchers with balanced entries
- ✅ **Reports**: P&L, daily sales, inventory valuation
- ✅ **Role-based Access**: Different user roles see different menus
- ✅ **POS**: Barcode scanning, product search, cart operations
- ✅ **Data Integrity**: Stock, sales, and accounting all synchronized

📚 **See `TESTING_GUIDE.md` for complete testing procedures**

## Development

### Running Unit Tests

```bash
# Backend unit tests
cd backend
npm run test

# Backend e2e tests
npm run test:e2e

# Frontend tests
cd frontend
npm run test
```

### Database Migrations

```bash
cd backend

# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## Deployment

### Using Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deployment

1. Build the frontend:

```bash
cd frontend
npm run build
```

2. Build the backend:

```bash
cd backend
npm run build
```

3. Run migrations on production database
4. Start the backend with PM2 or similar
5. Serve the frontend with nginx or similar

## Security

- All passwords are hashed using bcrypt
- JWT tokens for stateless authentication
- Multi-tenant data isolation via company_id
- Input validation on all endpoints
- CORS configured for production
- Rate limiting on auth endpoints

## Contributing

This is an MVP. Future enhancements:

- Advanced inventory valuation (FIFO, Weighted Average)
- Multi-currency support
- Email notifications
- Mobile app
- Advanced reporting with charts
- Bulk operations

## License

MIT
