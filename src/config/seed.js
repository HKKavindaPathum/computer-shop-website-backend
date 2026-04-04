const db = require('./db');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {

    // Admin user හදනවා
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.query(`
      INSERT IGNORE INTO User (name, email, password, phone, address, role) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      ['Admin', 'admin@gmail.com', hashedPassword, '0111234567', 'Colombo', 'admin']
    );
    console.log('✅ Admin user created');
    console.log('   Email: admin@gmail.com');
    console.log('   Password: admin123');

    // Categories හදනවා
    await db.query(`
      INSERT IGNORE INTO Category (category_name, description) VALUES
      ('Electronics', 'Electronic items'),
      ('Clothing', 'Clothes and accessories'),
      ('Food', 'Food and beverages'),
      ('Books', 'Books and stationery')
    `);
    console.log('✅ Categories created');

    // Products හදනවා
    await db.query(`
      INSERT IGNORE INTO Product (product_name, brand, description, price, stock_quantity, image_url, category_id) VALUES
      ('Samsung Galaxy S24', 'Samsung', 'Latest Samsung phone', 150000.00, 10, 'https://example.com/s24.jpg', 1),
      ('iPhone 15', 'Apple', 'Latest Apple phone', 200000.00, 5, 'https://example.com/iphone15.jpg', 1),
      ('Nike T-Shirt', 'Nike', 'Comfortable cotton t-shirt', 3500.00, 50, 'https://example.com/nike.jpg', 2),
      ('Harry Potter', 'J.K. Rowling', 'Famous novel', 1500.00, 20, 'https://example.com/hp.jpg', 4)
    `);
    console.log('✅ Products created');

    console.log('\n🎉 Seed completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();