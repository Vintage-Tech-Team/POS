import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Companies
    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "timezone" VARCHAR(100) DEFAULT 'UTC',
        "currency" VARCHAR(10) DEFAULT 'USD',
        "settings" JSONB,
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Users
    await queryRunner.query(`
      CREATE TYPE "user_role" AS ENUM('admin', 'manager', 'cashier', 'accountant');
      
      CREATE TABLE "users" (
        "id" SERIAL PRIMARY KEY,
        "company_id" INTEGER NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "name" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "password_hash" VARCHAR(255) NOT NULL,
        "role" "user_role" DEFAULT 'cashier',
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Categories
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" SERIAL PRIMARY KEY,
        "company_id" INTEGER NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "parent_id" INTEGER REFERENCES "categories"("id"),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" SERIAL PRIMARY KEY,
        "company_id" INTEGER NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "name" VARCHAR(255) NOT NULL,
        "sku" VARCHAR(100) UNIQUE NOT NULL,
        "barcode" VARCHAR(100) UNIQUE,
        "category_id" INTEGER REFERENCES "categories"("id"),
        "unit" VARCHAR(50) DEFAULT 'pcs',
        "purchase_price" DECIMAL(10,2) DEFAULT 0,
        "sale_price" DECIMAL(10,2) DEFAULT 0,
        "tax_percent" DECIMAL(5,2) DEFAULT 0,
        "reorder_level" INTEGER DEFAULT 0,
        "stock_quantity" INTEGER DEFAULT 0,
        "description" TEXT,
        "image_url" VARCHAR(500),
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Warehouses
    await queryRunner.query(`
      CREATE TABLE "warehouses" (
        "id" SERIAL PRIMARY KEY,
        "company_id" INTEGER NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "location" VARCHAR(500),
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customers
    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id" SERIAL PRIMARY KEY,
        "company_id" INTEGER NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "phone" VARCHAR(50),
        "email" VARCHAR(255),
        "address" TEXT,
        "balance" DECIMAL(10,2) DEFAULT 0,
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Suppliers
    await queryRunner.query(`
      CREATE TABLE "suppliers" (
        "id" SERIAL PRIMARY KEY,
        "company_id" INTEGER NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "phone" VARCHAR(50),
        "email" VARCHAR(255),
        "address" TEXT,
        "balance" DECIMAL(10,2) DEFAULT 0,
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Purchases
    await queryRunner.query(`
      CREATE TYPE "purchase_status" AS ENUM('draft', 'confirmed', 'cancelled');
      
      CREATE TABLE "purchases" (
        "id" SERIAL PRIMARY KEY,
        "company_id" INTEGER NOT NULL,
        "supplier_id" INTEGER NOT NULL REFERENCES "suppliers"("id"),
        "invoice_no" VARCHAR(100) UNIQUE NOT NULL,
        "date" DATE NOT NULL,
        "total_amount" DECIMAL(10,2) DEFAULT 0,
        "tax_amount" DECIMAL(10,2) DEFAULT 0,
        "status" "purchase_status" DEFAULT 'draft',
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Purchase Items
    await queryRunner.query(`
      CREATE TABLE "purchase_items" (
        "id" SERIAL PRIMARY KEY,
        "purchase_id" INTEGER NOT NULL REFERENCES "purchases"("id") ON DELETE CASCADE,
        "product_id" INTEGER NOT NULL REFERENCES "products"("id"),
        "qty" INTEGER NOT NULL,
        "unit_price" DECIMAL(10,2) NOT NULL,
        "tax" DECIMAL(10,2) DEFAULT 0,
        "discount" DECIMAL(10,2) DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sales
    await queryRunner.query(`
      CREATE TYPE "sale_status" AS ENUM('draft', 'completed', 'cancelled', 'returned');
      CREATE TYPE "payment_status" AS ENUM('unpaid', 'partial', 'paid');
      
      CREATE TABLE "sales" (
        "id" SERIAL PRIMARY KEY,
        "company_id" INTEGER NOT NULL,
        "customer_id" INTEGER REFERENCES "customers"("id"),
        "invoice_no" VARCHAR(100) UNIQUE NOT NULL,
        "date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "total_amount" DECIMAL(10,2) DEFAULT 0,
        "tax_amount" DECIMAL(10,2) DEFAULT 0,
        "status" "sale_status" DEFAULT 'completed',
        "payment_status" "payment_status" DEFAULT 'paid',
        "notes" TEXT,
        "idempotency_key" VARCHAR(36) UNIQUE,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sale Items
    await queryRunner.query(`
      CREATE TABLE "sale_items" (
        "id" SERIAL PRIMARY KEY,
        "sale_id" INTEGER NOT NULL REFERENCES "sales"("id") ON DELETE CASCADE,
        "product_id" INTEGER NOT NULL REFERENCES "products"("id"),
        "qty" INTEGER NOT NULL,
        "unit_price" DECIMAL(10,2) NOT NULL,
        "tax" DECIMAL(10,2) DEFAULT 0,
        "discount" DECIMAL(10,2) DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Inventory Movements
    await queryRunner.query(`
      CREATE TYPE "movement_type" AS ENUM('purchase', 'sale', 'adjustment', 'return', 'transfer');
      
      CREATE TABLE "inventory_movements" (
        "id" SERIAL PRIMARY KEY,
        "company_id" INTEGER NOT NULL,
        "product_id" INTEGER NOT NULL REFERENCES "products"("id"),
        "warehouse_id" INTEGER REFERENCES "warehouses"("id"),
        "qty_change" INTEGER NOT NULL,
        "movement_type" "movement_type" NOT NULL,
        "reference_id" INTEGER,
        "date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "reason" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Chart of Accounts
    await queryRunner.query(`
      CREATE TYPE "account_type" AS ENUM('Asset', 'Liability', 'Equity', 'Income', 'Expense');
      
      CREATE TABLE "chart_of_accounts" (
        "id" SERIAL PRIMARY KEY,
        "company_id" INTEGER NOT NULL,
        "code" VARCHAR(50) UNIQUE NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "type" "account_type" NOT NULL,
        "parent_id" INTEGER REFERENCES "chart_of_accounts"("id"),
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Vouchers
    await queryRunner.query(`
      CREATE TYPE "voucher_type" AS ENUM('journal', 'payment', 'receipt', 'sale', 'purchase');
      
      CREATE TABLE "vouchers" (
        "id" SERIAL PRIMARY KEY,
        "company_id" INTEGER NOT NULL,
        "type" "voucher_type" NOT NULL,
        "date" DATE NOT NULL,
        "reference_id" INTEGER,
        "auto_generated" BOOLEAN DEFAULT false,
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Journal Entries
    await queryRunner.query(`
      CREATE TABLE "journal_entries" (
        "id" SERIAL PRIMARY KEY,
        "company_id" INTEGER NOT NULL,
        "voucher_id" INTEGER NOT NULL REFERENCES "vouchers"("id") ON DELETE CASCADE,
        "account_id" INTEGER NOT NULL REFERENCES "chart_of_accounts"("id"),
        "debit" DECIMAL(10,2) DEFAULT 0,
        "credit" DECIMAL(10,2) DEFAULT 0,
        "date" DATE NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payments
    await queryRunner.query(`
      CREATE TYPE "payment_method" AS ENUM('cash', 'card', 'bank_transfer', 'cheque', 'mobile_money');
      CREATE TYPE "entity_type" AS ENUM('customer', 'supplier');
      
      CREATE TABLE "payments" (
        "id" SERIAL PRIMARY KEY,
        "company_id" INTEGER NOT NULL,
        "entity_type" "entity_type" NOT NULL,
        "entity_id" INTEGER NOT NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "method" "payment_method" NOT NULL,
        "date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "notes" TEXT,
        "reference_id" INTEGER,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "idx_users_company_id" ON "users"("company_id")`);
    await queryRunner.query(`CREATE INDEX "idx_products_company_id" ON "products"("company_id")`);
    await queryRunner.query(`CREATE INDEX "idx_products_barcode" ON "products"("barcode")`);
    await queryRunner.query(`CREATE INDEX "idx_products_sku" ON "products"("sku")`);
    await queryRunner.query(`CREATE INDEX "idx_sales_company_id" ON "sales"("company_id")`);
    await queryRunner.query(`CREATE INDEX "idx_sales_date" ON "sales"("date")`);
    await queryRunner.query(`CREATE INDEX "idx_purchases_company_id" ON "purchases"("company_id")`);
    await queryRunner.query(`CREATE INDEX "idx_inventory_movements_company_id" ON "inventory_movements"("company_id")`);
    await queryRunner.query(`CREATE INDEX "idx_inventory_movements_product_id" ON "inventory_movements"("product_id")`);
    await queryRunner.query(`CREATE INDEX "idx_journal_entries_account_id" ON "journal_entries"("account_id")`);
    await queryRunner.query(`CREATE INDEX "idx_journal_entries_date" ON "journal_entries"("date")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "payments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "journal_entries" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vouchers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chart_of_accounts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inventory_movements" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sale_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sales" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "purchase_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "purchases" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "suppliers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "warehouses" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "companies" CASCADE`);
    
    await queryRunner.query(`DROP TYPE IF EXISTS "entity_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_method"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "voucher_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "account_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "movement_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sale_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "purchase_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role"`);
  }
}


