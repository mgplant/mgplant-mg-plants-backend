const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json({ limit: '10mb' })); // Increased limit to support base64 image uploads in reviews
app.use(cors());

// --- 1. MONGODB CONNECTION ---
const dbPassword = "0j7XArbeyiP27O6o"; 
const MONGO_URI = `mongodb+srv://mgplants_db_user:${dbPassword}@cluster0.cqsdy2b.mongodb.net/mgplants?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('🌿 Connected to MongoDB Atlas successfully');
  })
  .catch(err => console.error('MongoDB connection error:', err));

// --- 2. DATABASE SCHEMAS ---
const userSchema = new mongoose.Schema({ name: String, email: { type: String, unique: true }, password: String });
const User = mongoose.model('User', userSchema);

// 🆕 UPDATED: Added reviews array to support customer star ratings and photos
const productSchema = new mongoose.Schema({ 
  id: String, 
  name: String, 
  category: String, 
  price: Number, 
  origPrice: Number, 
  image: String, 
  bestSeller: Boolean,
  reviews: [{ 
    user: String, 
    rating: Number, 
    comment: String, 
    image: String, 
    createdAt: { type: Date, default: Date.now } 
  }]
});
const Product = mongoose.model('Product', productSchema);

const orderSchema = new mongoose.Schema({ 
  trackingId: String, 
  customerName: String, 
  phone: String, 
  address: String, 
  items: Array, 
  totalAmount: Number, 
  status: { type: String, default: 'Pending' }, 
  paymentStatus: { type: String, default: 'Payment Pending' }, 
  createdAt: { type: Date, default: Date.now } 
});
const Order = mongoose.model('Order', orderSchema);

// --- 3. API ROUTES ---
app.get('/api/products', async (req, res) => { try { res.json(await Product.find()); } catch (err) { res.status(500).json({ success: false }); } });

app.post('/api/admin/products/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findOneAndUpdate(
      { id: req.params.id }, 
      { $set: { name: req.body.name, price: req.body.price, origPrice: req.body.origPrice, image: req.body.image } }, 
      { new: true }
    );
    res.json({ success: true, product: updatedProduct });
  } catch (err) { res.status(500).json({ success: false, message: 'Update failed' }); }
});

// 🆕 NEW: Customer Review Submission Route (Supports photos)
app.post('/api/review/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.reviews.push({
      user: req.body.user,
      rating: Number(req.body.rating),
      comment: req.body.comment,
      image: req.body.image || null // Base64 image from frontend
    });

    await product.save();
    res.json({ success: true, message: 'Review added successfully' });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/api/register', async (req, res) => { try { const { name, email, password } = req.body; const hashedPassword = await bcrypt.hash(password, 10); const newUser = new User({ name, email, password: hashedPassword }); await newUser.save(); res.json({ success: true, user: { name, email } }); } catch (err) { res.status(500).json({ success: false }); } });
app.post('/api/login', async (req, res) => { try { const { email, password } = req.body; const user = await User.findOne({ email }); if (!user || !(await bcrypt.compare(password, user.password))) return res.json({ success: false }); res.json({ success: true, user: { name: user.name, email: user.email } }); } catch (err) { res.status(500).json({ success: false }); } });

app.post('/api/orders', async (req, res) => { 
  try { 
    const trackingId = 'MG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const initialPaymentStatus = req.body.address.includes('[Online]') ? 'Payment Pending' : 'Payment Pending (COD)';
    const newOrder = new Order({ ...req.body, trackingId, paymentStatus: initialPaymentStatus }); 
    await newOrder.save(); 
    res.json({ success: true, trackingId }); 
  } catch (err) { res.status(500).json({ success: false }); } 
});

app.get('/api/admin/orders', async (req, res) => { try { res.json(await Order.find().sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ success: false }); } });

// Update Delivery Status Route (Handles ARTO & Refund processing from Admin Panel)
app.post('/api/admin/order-status/:id', async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// Update Payment Status Route (Paid vs Payment Pending)
app.post('/api/admin/payment-status/:id', async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.id, { paymentStatus: req.body.paymentStatus });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// Customer ARTO (Return) Request Endpoint
app.post('/api/orders/return/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false });
    order.status = 'ARTO Request';
    await order.save();
    res.json({ success: true, message: 'Return requested.' });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/api/orders/cancel/:id', async (req, res) => { try { const order = await Order.findById(req.params.id); if ((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60) > 4) return res.json({ success: false, message: 'Expired.' }); order.status = 'Cancelled'; await order.save(); res.json({ success: true, message: 'Cancelled.' }); } catch (err) { res.status(500).json({ success: false }); } });

// --- 4. START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 MG Plants Backend running on port ${PORT}`));

