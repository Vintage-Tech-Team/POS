# POS System - Quick Start Guide

This guide will help you get your POS system up and running in minutes.

## 🚀 Quick Start

### Option 1: Using Docker (Recommended)

The fastest way to get started:

```bash
# Start all services
docker-compose up -d

# Wait for services to be healthy (about 30 seconds)
# Then access:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:3001
# - API Docs: http://localhost:3001/api/docs
```

**Default Login Credentials:**

👤 **Admin (Full Access):**

- Email: `admin@example.com`
- Password: `admin123`

👤 **Manager (Sales, Purchases, Inventory, Reports):**

- Email: `manager@example.com`
- Password: `manager123`

👤 **Cashier (POS & Sales Only):**

- Email: `cashier@example.com`
- Password: `cashier123`

👤 **Accountant (Accounting & Reports Only):**

- Email: `accountant@example.com`
- Password: `accountant123`

### Option 2: Manual Setup

If you prefer to run services individually:

#### 1. Setup PostgreSQL

```bash
# Using Docker
docker run -d \
  --name pos-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=posdb \
  -p 5432:5432 \
  postgres:15-alpine

# OR install PostgreSQL locally and create a database named 'posdb'
```

#### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Run migrations
npm run migration:run

# Seed database with sample data
npm run seed

# Start backend server
npm run start:dev
```

Backend will run on http://localhost:3001

#### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on http://localhost:3000

## 📋 First Steps After Login

### 1. Review Dashboard

- Check the dashboard for today's sales summary
- View low stock alerts
- Quick access to key features

### 2. Explore Products

- Navigate to **Products** from the sidebar
- Review the 3 sample products that were seeded
- Try adding a new product
- Generate barcodes for products

### 3. Try the POS System

- Click **POS** in the sidebar
- Scan a barcode or search for a product:
  - Barcode: `100000000001`
  - Barcode: `100000000002`
  - Barcode: `100000000003`
- Add products to cart
- Complete a sale

### 4. Check Inventory

- Go to **Inventory** to see stock levels
- Notice how stock decreased after your sale
- Check products that need reordering

### 5. View Reports

- Navigate to **Reports**
- Generate reports for the current month
- View sales summary, top products, and P&L

### 6. Review Accounting

- Check **Accounting** section
- See auto-generated vouchers from your sale
- Review chart of accounts

## 🛠️ Key Features to Try

### Making a Sale (POS)

1. Go to POS screen
2. Scan barcode or search product by name
3. Adjust quantities if needed
4. Select payment method
5. Complete sale
6. Stock automatically decreases
7. Accounting entries automatically created

### Adding Products

1. Go to Products → Add Product
2. Enter product details
3. Leave barcode empty for auto-generation
4. Set purchase & sale prices
5. Set reorder level for alerts
6. Save

### Viewing Reports

1. Go to Reports
2. Select date range
3. Click "Generate Reports"
4. View:
   - Sales summary
   - Top selling products
   - Profit & Loss statement

### Managing Inventory

1. View current stock levels
2. Get low stock alerts
3. Manually adjust stock if needed

## 📱 API Testing

The backend includes Swagger documentation:

**Access API Docs:** http://localhost:3001/api/docs

### Test with Postman/cURL

**Login:**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

**Create POS Sale:**

```bash
curl -X POST http://localhost:3001/api/sales/pos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "items": [
      {
        "barcode": "100000000001",
        "qty": 2
      }
    ],
    "payments": [
      {
        "method": "cash",
        "amount": 200
      }
    ]
  }'
```

## 🎯 Common Use Cases

### Scenario 1: Daily Store Opening

1. Login to system
2. Check dashboard for yesterday's summary
3. Review low stock alerts
4. Order stock if needed
5. Open POS for first customer

### Scenario 2: Making Sales

1. Customer brings products
2. Scan barcodes one by one
3. Adjust quantities if multiple items
4. Select customer (optional)
5. Choose payment method
6. Complete transaction
7. Stock updates automatically

### Scenario 3: End of Day

1. Go to Reports
2. Generate daily sales report
3. Review top selling products
4. Check remaining stock
5. Plan for next day

### Scenario 4: Receiving Stock

1. Go to Purchases
2. Create new purchase
3. Add supplier and items
4. Stock increases automatically
5. Accounting entries created

## 🔐 User Roles

The system supports different roles:

- **Admin**: Full access to all features
- **Manager**: Sales, purchases, inventory, reports
- **Cashier**: POS and sales only
- **Accountant**: Accounting and reports only

## 📊 Sample Data Included

After running the seed script, you'll have:

**Products:**

- Sample Product A (SKU: SPA-001, Barcode: 100000000001)
- Sample Product B (SKU: SPB-002, Barcode: 100000000002)
- Sample Product C (SKU: SPC-003, Barcode: 100000000003)

**Chart of Accounts:**

- Cash (1000)
- Bank Account (1100)
- Accounts Receivable (1200)
- Inventory (1500)
- Accounts Payable (2000)
- Tax Payable (2100)
- Capital (3000)
- Sales Revenue (4000)
- Cost of Goods Sold (5000)
- Operating Expenses (6000)

**Others:**

- 1 Customer (Walk-in Customer)
- 1 Supplier (ABC Suppliers Ltd)
- 1 Warehouse (Main Warehouse)

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database connection
psql -U postgres -h localhost -d posdb

# View backend logs
cd backend && npm run start:dev
```

### Frontend won't start

```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Database migration errors

```bash
cd backend
# Revert last migration
npm run migration:revert

# Run migrations again
npm run migration:run

# Re-seed if needed
npm run seed
```

### Port already in use

```bash
# Change ports in docker-compose.yml or .env files
# Backend: PORT=3001
# Frontend: change in package.json dev script
# PostgreSQL: change port mapping in docker-compose.yml
```

## 📚 Next Steps

1. **Customize for your business:**

   - Add your products
   - Set up your chart of accounts
   - Configure tax rates
   - Add customers and suppliers

2. **Configure settings:**

   - Update company information
   - Set currency and timezone
   - Configure receipt format

3. **Train your team:**

   - Create user accounts with appropriate roles
   - Train on POS operations
   - Establish end-of-day procedures

4. **Go live:**
   - Start with a test period
   - Monitor reports daily
   - Adjust stock levels
   - Fine-tune processes

## 🎓 Learning Resources

- **API Documentation:** http://localhost:3001/api/docs
- **Architecture:** See main README.md
- **Database Schema:** Check migrations in `backend/src/database/migrations/`
- **Sample Requests:** See PRD in project root

## 💡 Tips

1. **Use barcodes:** For faster checkout, use barcode scanner or the built-in barcode input
2. **Set reorder levels:** Get automatic alerts when stock is low
3. **Review reports daily:** Monitor business performance
4. **Use idempotency keys:** For POS sales to prevent duplicates
5. **Backup regularly:** Use PostgreSQL backup tools

## ✅ Testing Everything Works

We've created comprehensive testing tools to verify all modules:

### 1. Quick System Status

```bash
./system-status.sh
```

Shows real-time dashboard of stock, sales, and accounting.

### 2. Automated Full Test

```bash
./test-workflow.sh
```

Runs a complete purchase → sale → accounting → reports workflow.

### 3. Data Integrity Check

```bash
./verify-data-integrity.sh
```

Verifies all data is consistent across modules.

### 4. Manual Testing

See `TESTING_GUIDE.md` for step-by-step testing scenarios covering:

- Stock increases on purchase ✅
- Stock decreases on sale ✅
- Automatic accounting vouchers ✅
- P&L profit calculations ✅
- Role-based access control ✅
- Low stock alerts ✅

### 5. Quick Reference

See `TEST_REFERENCE.md` for:

- All test user credentials
- Sample data details
- Expected calculation results
- Common troubleshooting

### Expected Test Results

After running `test-workflow.sh`, verify:

**Stock Flow:**

```
Purchase: +20 units → Sale: -5 units → Net: +15 units
```

**Accounting:**

```
Every sale creates balanced voucher (Debit = Credit)
P&L shows positive profit
```

**Reports:**

```
Daily sales matches actual transactions
Inventory valuation accurate
```

## 🆘 Need Help?

Check the main README.md for:

- Detailed architecture
- API endpoints
- Development guidelines
- Deployment instructions

---

**🎉 You're all set! Start making sales with your new POS system!**
