import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Create demo company
    const companyResult = await AppDataSource.query(`
      INSERT INTO companies (name, timezone, currency, settings)
      VALUES ('Demo Company', 'UTC', 'USD', '{}')
      RETURNING id
    `);
    const companyId = companyResult[0].id;
    console.log('✅ Created demo company');

    // Create users with different roles
    const users = [
      { name: 'Admin User', email: 'admin@example.com', password: 'admin123', role: 'admin' },
      { name: 'Manager User', email: 'manager@example.com', password: 'manager123', role: 'manager' },
      { name: 'Cashier User', email: 'cashier@example.com', password: 'cashier123', role: 'cashier' },
      { name: 'Accountant User', email: 'accountant@example.com', password: 'accountant123', role: 'accountant' },
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await AppDataSource.query(
        `
        INSERT INTO users (company_id, name, email, password_hash, role)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [companyId, user.name, user.email, hashedPassword, user.role],
      );
      console.log(`✅ Created ${user.role} user (email: ${user.email}, password: ${user.password})`);
    }

    // Create chart of accounts
    const accounts = [
      { code: '1000', name: 'Cash', type: 'Asset', parent_id: null },
      { code: '1100', name: 'Bank Account', type: 'Asset', parent_id: null },
      { code: '1200', name: 'Accounts Receivable', type: 'Asset', parent_id: null },
      { code: '1500', name: 'Inventory', type: 'Asset', parent_id: null },
      { code: '2000', name: 'Accounts Payable', type: 'Liability', parent_id: null },
      { code: '2100', name: 'Tax Payable', type: 'Liability', parent_id: null },
      { code: '3000', name: 'Capital', type: 'Equity', parent_id: null },
      { code: '4000', name: 'Sales Revenue', type: 'Income', parent_id: null },
      { code: '5000', name: 'Cost of Goods Sold', type: 'Expense', parent_id: null },
      { code: '6000', name: 'Operating Expenses', type: 'Expense', parent_id: null },
    ];

    for (const account of accounts) {
      await AppDataSource.query(
        `
        INSERT INTO chart_of_accounts (company_id, code, name, type, parent_id)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [companyId, account.code, account.name, account.type, account.parent_id],
      );
    }
    console.log('✅ Created chart of accounts');

    // Create default warehouse
    await AppDataSource.query(
      `
      INSERT INTO warehouses (company_id, name, location)
      VALUES ($1, 'Main Warehouse', 'Main Store')
    `,
      [companyId],
    );
    console.log('✅ Created default warehouse');

    // Create sample categories
    const categoryResult = await AppDataSource.query(
      `
      INSERT INTO categories (company_id, name, description)
      VALUES ($1, 'General', 'General products')
      RETURNING id
    `,
      [companyId],
    );
    const categoryId = categoryResult[0].id;
    console.log('✅ Created sample category');

    // Create sample products
    const products = [
      {
        name: 'Sample Product A',
        sku: 'SPA-001',
        barcode: '100000000001',
        purchase_price: 50,
        sale_price: 80,
        stock_quantity: 100,
        reorder_level: 10,
      },
      {
        name: 'Sample Product B',
        sku: 'SPB-002',
        barcode: '100000000002',
        purchase_price: 30,
        sale_price: 50,
        stock_quantity: 150,
        reorder_level: 15,
      },
      {
        name: 'Sample Product C',
        sku: 'SPC-003',
        barcode: '100000000003',
        purchase_price: 100,
        sale_price: 150,
        stock_quantity: 50,
        reorder_level: 5,
      },
    ];

    for (const product of products) {
      await AppDataSource.query(
        `
        INSERT INTO products (
          company_id, name, sku, barcode, category_id, 
          purchase_price, sale_price, stock_quantity, reorder_level, tax_percent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 10)
      `,
        [
          companyId,
          product.name,
          product.sku,
          product.barcode,
          categoryId,
          product.purchase_price,
          product.sale_price,
          product.stock_quantity,
          product.reorder_level,
        ],
      );
    }
    console.log('✅ Created sample products');

    // Create sample customer
    await AppDataSource.query(
      `
      INSERT INTO customers (company_id, name, phone, email)
      VALUES ($1, 'Walk-in Customer', '+1234567890', 'customer@example.com')
    `,
      [companyId],
    );
    console.log('✅ Created sample customer');

    // Create sample supplier
    await AppDataSource.query(
      `
      INSERT INTO suppliers (company_id, name, phone, email)
      VALUES ($1, 'ABC Suppliers Ltd', '+0987654321', 'supplier@example.com')
    `,
      [companyId],
    );
    console.log('✅ Created sample supplier');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('\n👤 Admin (Full Access):');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    console.log('\n👤 Manager (Sales, Purchases, Inventory, Reports):');
    console.log('   Email: manager@example.com');
    console.log('   Password: manager123');
    console.log('\n👤 Cashier (POS & Sales Only):');
    console.log('   Email: cashier@example.com');
    console.log('   Password: cashier123');
    console.log('\n👤 Accountant (Accounting & Reports):');
    console.log('   Email: accountant@example.com');
    console.log('   Password: accountant123');
    console.log('\n✨ You can now start the backend with: npm run start:dev');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();


