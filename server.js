const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cors());

// --- 1. MONGODB CONNECTION ---
// Replace with your actual MongoDB Atlas connection string if needed
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://username:password@cluster.mongodb.net/mgplants?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('🌿 Connected to MongoDB Atlas successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- 2. DATABASE SCHEMAS & MODELS ---

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Product Schema
const productSchema = new mongoose.Schema({
  id: String,
  name: String,
  category: String,
  price: Number,
  origPrice: Number,
  bestSeller: Boolean,
  image: String,
  stockQuantity: { type: Number, default: 50 }
});
const Product = mongoose.model('Product', productSchema);

// Order Schema (Tracks Customer Details, Items, and Status)
const orderSchema = new mongoose.Schema({
  customerName: String,
  phone: String,
  address: String,
  items: Array,
  totalAmount: Number,
  status: { type: String, default: 'Pending' }, // Pending, Confirmed, Cancelled, Delivered
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// --- 3. API ROUTES ---

// Get Product Catalog
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching products' });
  }
});

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.json({ success: false, message: 'Email already registered.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.json({ success: true, user: { id: newUser._id, name: newUser.name, email: newUser.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: 'User not found.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: 'Incorrect password.' });

    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// Create Order (From Customer Checkout)
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, phone, address, items, totalAmount } = req.body;
    if (!customerName || !phone || !address || !items || items.length === 0) {
      return res.json({ success: false, message: 'Missing required order details.' });
    }

    const newOrder = new Order({ customerName, phone, address, items, totalAmount });
    await newOrder.save();
    
    res.json({ success: true, orderId: newOrder._id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error saving order.' });
  }
});

// Admin: Fetch All Customer Orders
app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching admin orders.' });
  }
});

// Customer: Cancel Order (Within 4 Hours Window)
app.post('/api/orders/cancel/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.json({ success: false, message: 'Order not found.' });

    const hoursElapsed = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursElapsed > 4) {
      return res.json({ success: false, message: 'Cancellation window (4 hours) has expired.' });
    }

    order.status = 'Cancelled';
    await order.save();
    
    res.json({ success: true, message: 'Order successfully cancelled.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error processing cancellation.' });
  }
});

// --- 4. START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 MG Plants Backend running live on port ${PORT}`);
});
