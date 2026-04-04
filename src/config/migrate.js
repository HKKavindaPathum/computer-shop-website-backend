const db = require('./db');

const createTables = async () => {
  try {

    await db.query(`
      CREATE TABLE IF NOT EXISTS Category (
        category_id INT AUTO_INCREMENT PRIMARY KEY,
        category_name VARCHAR(100) NOT NULL,
        description TEXT
      )
    `);
    console.log('✅ Category table ready');

    await db.query(`
      CREATE TABLE IF NOT EXISTS User (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        role ENUM('admin', 'customer') DEFAULT 'customer'
      )
    `);
    console.log('✅ User table ready');

    await db.query(`
      CREATE TABLE IF NOT EXISTS Product (
        product_id INT AUTO_INCREMENT PRIMARY KEY,
        product_name VARCHAR(200) NOT NULL,
        brand VARCHAR(100),
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        stock_quantity INT DEFAULT 0,
        image_url VARCHAR(255),
        category_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES Category(category_id)
      )
    `);
    console.log('✅ Product table ready');

    await db.query(`
      CREATE TABLE IF NOT EXISTS Cart (
        cart_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES User(user_id)
      )
    `);
    console.log('✅ Cart table ready');

    await db.query(`
      CREATE TABLE IF NOT EXISTS CartItem (
        cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
        cart_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        FOREIGN KEY (cart_id) REFERENCES Cart(cart_id),
        FOREIGN KEY (product_id) REFERENCES Product(product_id)
      )
    `);
    console.log('✅ CartItem table ready');

    await db.query(`
      CREATE TABLE IF NOT EXISTS \`Order\` (
        order_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending','processing','shipped','delivered','cancelled') DEFAULT 'pending',
        shipping_address TEXT,
        FOREIGN KEY (user_id) REFERENCES User(user_id)
      )
    `);
    console.log('✅ Order table ready');

    await db.query(`
      CREATE TABLE IF NOT EXISTS OrderItem (
        order_item_id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES \`Order\`(order_id),
        FOREIGN KEY (product_id) REFERENCES Product(product_id)
      )
    `);
    console.log('✅ OrderItem table ready');

    await db.query(`
      CREATE TABLE IF NOT EXISTS Payment (
        payment_id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_method VARCHAR(50),
        amount DECIMAL(10,2) NOT NULL,
        payment_status ENUM('pending','completed','failed') DEFAULT 'pending',
        FOREIGN KEY (order_id) REFERENCES \`Order\`(order_id)
      )
    `);
    console.log('✅ Payment table ready');

    console.log('\n🎉 All tables created successfully!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
};

createTables();