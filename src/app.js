const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/cart', require('./routes/cart.routes'));
app.use('/api/orders', require('./routes/order.routes'));

const PORT = process.env.PORT || 5000;

db.getConnection()
  .then((connection) => {
    console.log('✅ DB CONNECTED SUCCESSFULLY');
    connection.release();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ DB CONNECTION FAILED:', err.message);
    process.exit(1); // DB connect නොවුනොත් server stop වෙනවා
  });