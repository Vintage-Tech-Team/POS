# POS System - Complete Testing Guide

This guide will walk you through testing all modules and verifying data accuracy across the system.

## 🎯 Test Scenario: Complete Business Workflow

We'll simulate a complete business day with purchases, sales, and financial reporting.

---

## 📚 Related Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Getting started guide
- **[README.md](./README.md)** - Project overview and setup instructions

---

## 🆕 What's New in This Testing Guide

This guide now includes comprehensive testing for:

- ✅ **Admin CRUD Operations** - Customer, Supplier, and Purchase management
- ✅ **Role-Based Access Control** - Testing permissions for Admin, Manager, Cashier roles
- ✅ **Frontend UI Testing** - Modal dialogs, search functionality, form validation
- ✅ **API Security Testing** - JWT authentication and role authorization
- ✅ **Data Integrity** - Verify inventory and accounting updates from purchases

---

## 📑 Table of Contents

### Core System Tests

- [Test 1: Verify Initial State](#test-1-verify-initial-state)
- [Test 2: Purchase Flow (Stock In)](#test-2-purchase-flow-stock-in)
- [Test 3: POS Sale Flow (Stock Out)](#test-3-pos-sale-flow-stock-out)
- [Test 4: Multiple Sales (Realistic Day)](#test-4-multiple-sales-realistic-day)
- [Test 5: Reports & Analytics](#test-5-reports--analytics)
- [Test 6: Low Stock Alerts](#test-6-low-stock-alerts)

### Admin CRUD & Role Tests (NEW)

- [Test 7: Admin CRUD Operations](#test-7-admin-crud-operations-customers-suppliers-purchases) ⭐ NEW
  - Customer Management (Create, Update, Delete, Search)
  - Supplier Management (Create, Update, Delete, Search)
  - Purchase Creation (Multi-item, Auto-calculations)
  - Role-Based Access (Manager, Cashier testing)
  - API Security Testing
- [Test 8: User Role Permissions](#test-8-user-role-permissions-original-tests)

### Data Integrity & Edge Cases

- [Test 9: Data Integrity Checks](#test-9-data-integrity-checks)
- [Test 10: Edge Cases](#test-10-edge-cases)
- [Test 11: End-of-Day Verification](#test-11-end-of-day-verification)

### Quick Reference

- [Quick Daily Test (5 min)](#-quick-daily-test-5-minutes)
- [Quick Admin CRUD Test (5 min)](#-quick-admin-crud-test-5-minutes) ⭐ NEW
- [Complete Role Permission Matrix](#-complete-role-permission-matrix) ⭐ NEW
- [API Endpoints for Testing](#-api-endpoints-for-testing) ⭐ NEW

---

## 📋 Prerequisites

1. **Database is seeded** with sample data
2. **Backend running** on http://localhost:3001
3. **Frontend running** on http://localhost:3000
4. **Login as Admin**: admin@example.com / admin123

**Quick Start:**

```bash
# From project root
npm run dev
```

---

## Test 1: Verify Initial State

### Step 1.1: Check Initial Inventory

1. Go to **Inventory** page
2. Verify initial stock quantities:
   - Sample Product A: 100 units
   - Sample Product B: 150 units
   - Sample Product C: 50 units

**Expected Result:** ✅ Stock quantities match seed data

### Step 1.2: Check Chart of Accounts

1. Go to **Accounting** → Chart of Accounts
2. Verify accounts exist:
   - 1000: Cash (Asset)
   - 1500: Inventory (Asset)
   - 2000: Accounts Payable (Liability)
   - 4000: Sales Revenue (Income)
   - 5000: Cost of Goods Sold (Expense)

**Expected Result:** ✅ All accounts are present

---

## Test 2: Purchase Flow (Stock In)

### Step 2.1: Create a Purchase

1. Go to **Purchases** → (would need a create button, but let's test via API)
2. Use API or create purchase order:
   - Supplier: ABC Suppliers Ltd
   - Product: Sample Product A
   - Quantity: 20 units
   - Unit Price: $50

**Test via API:**

```bash
curl -X POST http://localhost:3001/api/purchases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "supplier_id": 1,
    "invoice_no": "PO-TEST-001",
    "date": "2024-01-15",
    "items": [
      {
        "product_id": 1,
        "qty": 20,
        "unit_price": 50,
        "tax": 0,
        "discount": 0
      }
    ]
  }'
```

### Step 2.2: Verify Stock Increased

1. Go to **Inventory**
2. Check Sample Product A stock

**Expected Result:**

- ✅ Stock = 120 units (was 100, added 20)

### Step 2.3: Verify Accounting Entries

1. Go to **Accounting** → Vouchers
2. Find the auto-generated purchase voucher
3. Verify entries:
   - **Debit**: COGS (5000) = $1,000
   - **Credit**: Accounts Payable (2000) = $1,000

**Expected Result:** ✅ Voucher created with correct entries

---

## Test 3: POS Sale Flow (Stock Out)

### Step 3.1: Make a Sale via POS

1. Go to **POS**
2. Scan barcode: `100000000001` (Sample Product A)
3. Verify product preview appears
4. Click "Add to Cart"
5. Add quantity: 5 units
6. Select payment: Cash
7. Amount received: $500
8. Click "Complete Sale"

**Expected Calculations:**

- Unit Price: $80
- Quantity: 5
- Tax (10%): $40
- Total: $440

### Step 3.2: Verify Stock Decreased

1. Go to **Inventory**
2. Check Sample Product A

**Expected Result:**

- ✅ Stock = 115 units (was 120, sold 5)

### Step 3.3: Verify Sale Record

1. Go to **Sales**
2. Find your sale (should be at top)
3. Verify:
   - Invoice number generated (INV-YYYYMM-XXXX)
   - Total amount: $440
   - Status: Completed
   - Payment status: Paid

**Expected Result:** ✅ Sale recorded correctly

### Step 3.4: Verify Accounting Entries

1. Go to **Accounting** → Vouchers
2. Find the auto-generated sale voucher
3. Verify entries:
   - **Debit**: Cash (1000) = $440
   - **Credit**: Sales Revenue (4000) = $400
   - **Credit**: Tax Payable (2100) = $40
   - **Debit**: COGS (5000) = $250 (5 × $50 cost)
   - **Credit**: Inventory (1500) = $250

**Expected Result:** ✅ Complete double-entry bookkeeping

---

## Test 4: Multiple Sales (Realistic Day)

### Step 4.1: Create 3 More Sales

Repeat the POS process for:

**Sale 2:**

- Product: Sample Product B (barcode: 100000000002)
- Quantity: 3
- Expected: 3 × $50 = $150 + tax

**Sale 3:**

- Product: Sample Product C (barcode: 100000000003)
- Quantity: 2
- Expected: 2 × $150 = $300 + tax

**Sale 4:**

- Product: Sample Product A (barcode: 100000000001)
- Quantity: 10
- Expected: 10 × $80 = $800 + tax

### Step 4.2: Verify Total Stock Changes

Go to **Inventory** and verify:

- Sample Product A: 105 (120 - 5 - 10)
- Sample Product B: 147 (150 - 3)
- Sample Product C: 48 (50 - 2)

**Expected Result:** ✅ All stock quantities correct

---

## Test 5: Reports & Analytics

### Step 5.1: Daily Sales Report

1. Go to **Reports**
2. Select today's date range
3. Click "Generate Reports"

**Expected to See:**

- Total Sales: Sum of all sales made
- Total Transactions: 4 sales
- Average Sale: Total / 4
- Net Sales: Total minus tax

### Step 5.2: Top Selling Products

Check the "Top Selling Products" section

**Expected Result:**

- Sample Product A should be #1 (15 units sold)
- Other products follow

### Step 5.3: Profit & Loss Statement

View the P&L section:

**Expected Calculations:**

- **Income (Sales Revenue)**: Total of all sales (excluding tax)
- **Expense (COGS)**: Cost of all sold items
- **Net Profit**: Income - Expense

**Example:**

```
Income:
  Sales Revenue: $1,650 (5×80 + 3×50 + 2×150 + 10×80 - taxes)

Expense:
  COGS: $950 (5×50 + 3×30 + 2×100 + 10×50)

Net Profit: $700
```

**Expected Result:** ✅ P&L shows positive profit

### Step 5.4: Inventory Valuation

1. Go to **Reports** (if valuation report exists)
2. Or check via API:

```bash
curl http://localhost:3001/api/reports/stock/valuation \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:**

- Shows remaining stock × purchase price
- Shows potential profit if all sold

---

## Test 6: Low Stock Alerts

### Step 6.1: Sell Product to Below Reorder Level

Sample Product A has reorder level: 10

1. Go to **POS**
2. Make a large sale: Sample Product A × 100 units
3. This should bring stock to: 5 units (below reorder level of 10)

### Step 6.2: Check Alerts

1. Go to **Dashboard**
2. Look for "Low Stock Alert" section
3. Should see Sample Product A highlighted in red

**Expected Result:** ✅ Low stock alert appears

### Step 6.3: Check Inventory Page

1. Go to **Inventory**
2. Sample Product A should be marked as "Low Stock" (red)

**Expected Result:** ✅ Visual indicator of low stock

---

## Test 7: Admin CRUD Operations (Customers, Suppliers, Purchases)

### Step 7.1: Test Customer Management (Admin)

**Create Customer:**

1. Login as Admin
2. Go to **Customers** page
3. Click **"Add Customer"** button (top right)
4. Fill in form:
   - Name: "John Smith" (required)
   - Phone: "+1234567890"
   - Email: "john@example.com"
   - Address: "123 Main St"
5. Click **"Create"**

**Expected Result:**

- ✅ Success toast notification
- ✅ Customer appears in table
- ✅ Search bar is visible

**Update Customer:**

1. Find "John Smith" in the list
2. Click **"Edit"** button
3. Change phone to "+0987654321"
4. Click **"Update"**

**Expected Result:**

- ✅ Success toast notification
- ✅ Updated phone shows in table

**Search Customer:**

1. Type "john" in search bar
2. Results should filter in real-time

**Expected Result:**

- ✅ Only matching customers shown
- ✅ Search works for name, phone, email

**Delete Customer (Admin only):**

1. Click **"Delete"** button next to "John Smith"
2. Confirm deletion in popup

**Expected Result:**

- ✅ Confirmation dialog appears
- ✅ Customer removed from list
- ✅ Success toast notification

### Step 7.2: Test Supplier Management (Admin)

**Create Supplier:**

1. Go to **Suppliers** page
2. Click **"Add Supplier"** button
3. Fill in form:
   - Name: "Tech Supplies Inc" (required)
   - Phone: "+1555123456"
   - Email: "sales@techsupplies.com"
   - Address: "456 Business Ave"
4. Click **"Create"**

**Expected Result:**

- ✅ Success toast notification
- ✅ Supplier appears in table with $0.00 balance

**Update Supplier:**

1. Find "Tech Supplies Inc" in the list
2. Click **"Edit"** button
3. Update email to "info@techsupplies.com"
4. Click **"Update"**

**Expected Result:**

- ✅ Changes saved successfully
- ✅ Updated email visible in table

**Delete Supplier:**

1. Click **"Delete"** button
2. Confirm deletion

**Expected Result:**

- ✅ Supplier removed from list

### Step 7.3: Test Purchase Creation (Admin/Manager)

**Create Purchase:**

1. Go to **Purchases** page
2. Click **"New Purchase"** button
3. Fill in purchase header:

   - Invoice No: Auto-generated (e.g., PUR-1234567890)
   - Date: Today's date (default)
   - Supplier: Select "ABC Suppliers Ltd"
   - Notes: "Test purchase order"

4. Add items:

   - Click **"+ Add Item"**
   - Select "Sample Product A" from dropdown
   - Qty: 10
   - Unit Price: $50 (auto-filled from product cost)
   - Tax: $50
   - Discount: $0

5. Add second item:

   - Click **"+ Add Item"** again
   - Select "Sample Product B"
   - Qty: 5
   - Unit Price: $30
   - Tax: $15
   - Discount: $0

6. Verify total: $615 ((10×50 + 50) + (5×30 + 15))
7. Click **"Create Purchase"**

**Expected Result:**

- ✅ Success toast notification
- ✅ Purchase appears in list
- ✅ Stock increased for both products
- ✅ Accounting voucher created automatically

**Verify Purchase Effects:**

1. Go to **Inventory**

   - Sample Product A stock increased by 10
   - Sample Product B stock increased by 5

2. Go to **Accounting** → Vouchers
   - New voucher created
   - Debit: COGS (5000) = $615
   - Credit: Accounts Payable (2000) = $615

**Expected Result:** ✅ All systems updated correctly

### Step 7.4: Test Role-Based Access (Manager)

**Login as Manager:**

1. Logout from Admin
2. Login as manager@example.com / manager123

**Test Customer Management:**

1. Go to **Customers**
2. Verify "Add Customer" button is visible
3. Create a new customer
4. Edit an existing customer
5. Try to find "Delete" button

**Expected Result:**

- ✅ Can view customers
- ✅ Can create customers
- ✅ Can edit customers
- ❌ Delete button NOT visible (Admin only)

**Test Supplier Management:**

1. Go to **Suppliers**
2. Verify "Add Supplier" button is visible
3. Create a new supplier
4. Try to find "Delete" button

**Expected Result:**

- ✅ Can create and edit suppliers
- ❌ Cannot delete suppliers

**Test Purchase Creation:**

1. Go to **Purchases**
2. Verify "New Purchase" button is visible
3. Create a purchase

**Expected Result:**

- ✅ Manager can create purchases

### Step 7.5: Test Role-Based Access (Cashier)

**Login as Cashier:**

1. Logout
2. Login as cashier@example.com / cashier123

**Test Customer Access:**

1. Go to **Customers**
2. Check for action buttons

**Expected Result:**

- ✅ Can view customer list
- ❌ No "Add Customer" button
- ❌ No "Edit" buttons
- ❌ No "Delete" buttons
- ✅ Search bar still works (read-only)

**Test Supplier Access:**

1. Go to **Suppliers**
2. Check for action buttons

**Expected Result:**

- ✅ Can view suppliers (read-only)
- ❌ No create/edit/delete buttons

**Test Purchase Access:**

1. Go to **Purchases**
2. Check for action buttons

**Expected Result:**

- ✅ Can view purchase list
- ❌ No "New Purchase" button
- ✅ Can see all purchase details

### Step 7.6: Test Role Permissions via API

**Test Admin Delete (Should succeed):**

```bash
# Login as Admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'

# Delete customer (Admin only)
curl -X DELETE http://localhost:3001/api/customers/1 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected:** ✅ 200 OK - Customer deleted

**Test Manager Delete (Should fail):**

```bash
# Login as Manager
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "manager@example.com", "password": "manager123"}'

# Try to delete (should fail)
curl -X DELETE http://localhost:3001/api/customers/1 \
  -H "Authorization: Bearer MANAGER_TOKEN"
```

**Expected:** ❌ 403 Forbidden - Insufficient permissions

**Test Cashier Create (Should fail):**

```bash
# Login as Cashier
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "cashier@example.com", "password": "cashier123"}'

# Try to create customer (should fail)
curl -X POST http://localhost:3001/api/customers \
  -H "Authorization: Bearer CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Customer"}'
```

**Expected:** ❌ 403 Forbidden - Insufficient permissions

## Test 8: User Role Permissions (Original Tests)

### Step 8.1: Test Cashier Access

1. Logout
2. Login as: cashier@example.com / cashier123
3. Verify sidebar shows ONLY:
   - Dashboard
   - POS
   - Sales
   - Customers
4. Try accessing `/products` directly in URL

**Expected Result:**

- ✅ Limited menu items
- ✅ Blocked from restricted pages

### Step 8.2: Test Manager Access

1. Logout
2. Login as: manager@example.com / manager123
3. Verify sidebar shows:
   - Dashboard, POS, Products, Sales, Purchases, Inventory, Customers, Suppliers, Reports
4. Should NOT see: Accounting, Settings

**Expected Result:** ✅ Manager has operational access

### Step 8.3: Test Accountant Access

1. Logout
2. Login as: accountant@example.com / accountant123
3. Verify sidebar shows ONLY:
   - Dashboard
   - Accounting
   - Reports

**Expected Result:** ✅ Accountant has financial access only

---

## Test 9: Data Integrity Checks

### Step 8.1: Verify Stock Movement Records

```bash
curl http://localhost:3001/api/inventory/movements \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Check:**

- Every sale has corresponding negative movement
- Every purchase has corresponding positive movement
- Movement types are correct (sale, purchase, adjustment)

### Step 8.2: Verify Voucher Balance

1. Go to **Accounting** → Vouchers
2. For each voucher, verify:
   - Total Debits = Total Credits
   - No voucher is unbalanced

**Expected Result:** ✅ All vouchers balanced

### Step 8.3: Cross-Reference Data

For each sale:

1. Check sale record exists in **Sales**
2. Verify stock decreased in **Inventory**
3. Verify inventory movement created
4. Verify accounting voucher created
5. Verify revenue in **Reports**

**Expected Result:** ✅ All systems synchronized

---

## Test 10: Edge Cases

### Step 9.1: Try to Sell Out of Stock

1. Go to **POS**
2. Try to add Product C × 100 (but only 48 in stock)
3. Try to complete sale

**Expected Result:** ❌ Error: "Insufficient stock"

### Step 9.2: Try Duplicate Invoice Number

Try creating purchase with same invoice_no twice

**Expected Result:** ❌ Error: "Invoice number already exists"

### Step 9.3: Invalid Barcode

1. Go to **POS**
2. Enter invalid barcode: `999999999999`
3. Press Enter

**Expected Result:** ❌ Error: "Product not found"

---

## Test 11: End-of-Day Verification

### Final Checklist:

**Stock Levels:**

- [ ] All products show correct quantities
- [ ] Low stock alerts visible for items below reorder level

**Sales Data:**

- [ ] All sales recorded with correct totals
- [ ] Payment status correct
- [ ] Invoice numbers sequential

**Accounting:**

- [ ] All vouchers generated automatically
- [ ] All vouchers balanced (Debit = Credit)
- [ ] Cash account balance reflects all transactions

**Reports:**

- [ ] Daily sales matches actual transactions
- [ ] P&L shows correct profit
- [ ] Top products ranking correct
- [ ] Inventory valuation accurate

---

## 🧮 Manual Calculation Test

To verify reports are accurate, manually calculate:

### Expected Results After All Tests:

**Starting Inventory Value:**

```
Product A: 100 × $50 = $5,000
Product B: 150 × $30 = $4,500
Product C: 50 × $100 = $5,000
Total: $14,500
```

**After Purchase (+20 Product A):**

```
Total: $14,500 + (20 × $50) = $15,500
```

**After Sales (15 A, 3 B, 2 C, 100 A):**

```
COGS = (15 × $50) + (3 × $30) + (2 × $100) + (100 × $50)
     = $750 + $90 + $200 + $5,000
     = $6,040

Remaining Inventory = $15,500 - $6,040 = $9,460
```

**Revenue:**

```
Sales = (15 × $80) + (3 × $50) + (2 × $150) + (100 × $80)
      = $1,200 + $150 + $300 + $8,000
      = $9,650 (before tax)
```

**Profit:**

```
Profit = Revenue - COGS
       = $9,650 - $6,040
       = $3,610
```

**Compare with Reports:**

- Go to Reports → P&L
- Verify profit matches calculation

---

## 🐛 Common Issues & Solutions

### Issue 1: Stock Not Updating

**Symptom:** Sale completes but stock doesn't decrease  
**Check:**

- Inventory movements table
- Backend logs for errors
- Transaction rollback issues

### Issue 2: Vouchers Not Balanced

**Symptom:** Debit ≠ Credit in vouchers  
**Check:**

- Accounting service logic
- Rounding errors
- Missing entries

### Issue 3: Reports Show Wrong Data

**Symptom:** Numbers don't match transactions  
**Check:**

- Date filters
- Company ID filter
- Timezone issues
- Query logic

---

## ✅ Success Criteria

Your POS system is working correctly if:

1. ✅ Stock updates immediately after purchases and sales
2. ✅ All sales create automatic accounting vouchers
3. ✅ Vouchers are always balanced (Debit = Credit)
4. ✅ Reports match manual calculations
5. ✅ Low stock alerts appear correctly
6. ✅ Role-based access works for all user types
7. ✅ No data inconsistencies between modules
8. ✅ Edge cases are handled with proper errors

---

## 📊 Quick Test Commands (via API)

Save these for quick testing:

```bash
# Get current stock
curl http://localhost:3001/api/inventory/stock \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get today's sales
curl "http://localhost:3001/api/sales?startDate=2024-01-15&endDate=2024-01-15" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get P&L report
curl "http://localhost:3001/api/accounting/pnl?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get low stock items
curl http://localhost:3001/api/inventory/low-stock \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 Quick Daily Test (5 minutes)

For ongoing testing, run this quick workflow:

1. **Make 1 sale via POS** (any product)
2. **Check inventory** - verify stock decreased
3. **Check sales list** - verify sale recorded
4. **Check accounting** - verify voucher created
5. **Check reports** - verify numbers updated

If all 5 steps work, your system is functioning correctly! ✅

---

## 🎯 Quick Admin CRUD Test (5 minutes)

To quickly verify admin functionality:

1. **Login as Admin**
2. **Create a Customer**: Dashboard → Customers → Add Customer → Save
3. **Create a Supplier**: Dashboard → Suppliers → Add Supplier → Save
4. **Create a Purchase**: Dashboard → Purchases → New Purchase → Add items → Create
5. **Verify Inventory**: Check stock increased
6. **Test Search**: Search for customer/supplier by name
7. **Login as Manager**: Verify can edit but not delete
8. **Login as Cashier**: Verify read-only access

If all 8 steps work with correct permissions, your CRUD system is functioning correctly! ✅

---

## 📊 Complete Role Permission Matrix

Quick reference for testing role-based access:

| Feature        | Admin | Manager | Accountant | Cashier |
| -------------- | ----- | ------- | ---------- | ------- |
| **Customers**  |
| View           | ✅    | ✅      | ✅         | ✅      |
| Create         | ✅    | ✅      | ❌         | ❌      |
| Edit           | ✅    | ✅      | ❌         | ❌      |
| Delete         | ✅    | ❌      | ❌         | ❌      |
| **Suppliers**  |
| View           | ✅    | ✅      | ✅         | ✅      |
| Create         | ✅    | ✅      | ❌         | ❌      |
| Edit           | ✅    | ✅      | ❌         | ❌      |
| Delete         | ✅    | ❌      | ❌         | ❌      |
| **Purchases**  |
| View           | ✅    | ✅      | ✅         | ✅      |
| Create         | ✅    | ✅      | ❌         | ❌      |
| Payment        | ✅    | ✅      | ✅         | ❌      |
| **Products**   |
| Manage         | ✅    | ✅      | ❌         | ❌      |
| **POS**        |
| Sales          | ✅    | ✅      | ❌         | ✅      |
| **Accounting** |
| Access         | ✅    | ❌      | ✅         | ❌      |
| **Reports**    |
| View           | ✅    | ✅      | ✅         | ❌      |

Use this matrix to verify each role has appropriate access during testing.

---

## 🔗 API Endpoints for Testing

### Admin CRUD Endpoints

**Customers:**

```bash
GET    /api/customers              # View all (All roles)
GET    /api/customers/:id          # View one (All roles)
POST   /api/customers              # Create (Admin/Manager)
PUT    /api/customers/:id          # Update (Admin/Manager)
DELETE /api/customers/:id          # Delete (Admin only)
```

**Suppliers:**

```bash
GET    /api/suppliers              # View all (All roles)
GET    /api/suppliers/:id          # View one (All roles)
POST   /api/suppliers              # Create (Admin/Manager)
PUT    /api/suppliers/:id          # Update (Admin/Manager)
DELETE /api/suppliers/:id          # Delete (Admin only)
```

**Purchases:**

```bash
GET    /api/purchases              # View all (All roles)
GET    /api/purchases/:id          # View one (All roles)
POST   /api/purchases              # Create (Admin/Manager)
POST   /api/purchases/:id/payment  # Payment (Admin/Manager/Accountant)
```

---

## 🐛 Common Issues & Troubleshooting

### Admin CRUD Issues

**Issue: Role-based buttons not showing/hiding correctly**

**Symptoms:**

- Admin sees buttons but manager doesn't
- Cashier sees edit buttons

**Solutions:**

1. Clear browser localStorage and re-login
2. Check user role in localStorage: `localStorage.getItem('user')`
3. Verify JWT token contains correct role
4. Check console for authentication errors

---

**Issue: 403 Forbidden error when creating/editing**

**Symptoms:**

- Button is visible but API call fails
- Toast error: "Forbidden"

**Solutions:**

1. Verify user role is correct (Admin or Manager required)
2. Check JWT token hasn't expired
3. Re-login to get fresh token
4. Verify backend RolesGuard is properly configured

---

**Issue: Purchase creation doesn't update inventory**

**Symptoms:**

- Purchase is created but stock doesn't increase
- No error shown

**Solutions:**

1. Check backend logs for transaction errors
2. Verify inventory service is running
3. Check database transaction was committed
4. Look for rollback messages in logs

---

**Issue: Search not working**

**Symptoms:**

- Search bar doesn't filter results
- Results remain the same

**Solutions:**

1. Check network tab for API calls
2. Verify search parameter is being sent
3. Clear search and try again
4. Check backend search query logic

---

**Happy Testing! 🚀**

If you find any issues during testing, check backend logs and database state to debug.

For more information, refer to:

- **[README.md](./README.md)** - Project overview and setup
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide
