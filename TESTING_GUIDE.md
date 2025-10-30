# POS System - Complete Testing Guide

This guide will walk you through testing all modules and verifying data accuracy across the system.

## 🎯 Test Scenario: Complete Business Workflow

We'll simulate a complete business day with purchases, sales, and financial reporting.

---

## 📋 Prerequisites

1. **Database is seeded** with sample data
2. **Backend running** on http://localhost:3001
3. **Frontend running** on http://localhost:3000
4. **Login as Admin**: admin@example.com / admin123

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

## Test 7: User Role Permissions

### Step 7.1: Test Cashier Access

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

### Step 7.2: Test Manager Access

1. Logout
2. Login as: manager@example.com / manager123
3. Verify sidebar shows:
   - Dashboard, POS, Products, Sales, Purchases, Inventory, Customers, Suppliers, Reports
4. Should NOT see: Accounting, Settings

**Expected Result:** ✅ Manager has operational access

### Step 7.3: Test Accountant Access

1. Logout
2. Login as: accountant@example.com / accountant123
3. Verify sidebar shows ONLY:
   - Dashboard
   - Accounting
   - Reports

**Expected Result:** ✅ Accountant has financial access only

---

## Test 8: Data Integrity Checks

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

## Test 9: Edge Cases

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

## Test 10: End-of-Day Verification

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

**Happy Testing! 🚀**

If you find any issues during testing, check backend logs and database state to debug.
