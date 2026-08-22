const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// --- MONGODB CONNECTION ---
const dbPassword = "0j7XArbeyiP27O6o"; 
const MONGO_URI = `mongodb+srv://mgplants_db_user:${dbPassword}@cluster0.cqsdy2b.mongodb.net/mgplants?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.connect(MONGO_URI)
  .then(() => console.log('🌿 Connected to MongoDB Atlas successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- SCHEMAS ---
const userSchema = new mongoose.Schema({ 
  name: String, 
  email: { type: String, unique: true, lowercase: true, trim: true }, 
  password: { type: String, required: true }, 
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({ 
  id: String, name: String, category: String, price: Number, origPrice: Number, image: String, bestSeller: Boolean,
  description: { type: String, default: 'A gorgeous, healthy plant carefully nurtured to bring a touch of nature into your home or garden.' },
  stockCount: { type: Number, default: 10 },
  reviews: [{ user: String, rating: Number, comment: String, image: String, createdAt: { type: Date, default: Date.now } }] 
});
const Product = mongoose.model('Product', productSchema);

// Order Schema with support for customer comments and photo proof for returns/refunds
const orderSchema = new mongoose.Schema({ 
  trackingId: String, customerName: String, phone: String, address: String, items: Array, totalAmount: Number, 
  status: { type: String, default: 'Pending' }, 
  paymentStatus: { type: String, default: 'Payment Under Review' }, 
  returnReason: String, returnImage: String, 
  refundReason: String, refundImage: String, 
  refundRequested: { type: Boolean, default: false }, 
  createdAt: { type: Date, default: Date.now } 
});
const Order = mongoose.model('Order', orderSchema);

// --- AUTHENTICATION ---
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.json({ success: false, message: 'Email and password required.' });
  const cleanEmail = email.toLowerCase().trim();
  try {
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) return res.json({ success: false, message: 'Account exists.' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ name: name || cleanEmail.split('@')[0], email: cleanEmail, password: hashedPassword });
    await newUser.save();
    res.json({ success: true, user: { name: newUser.name, email: newUser.email } });
  } catch (err) { res.json({ success: false }); }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = email.toLowerCase().trim();
  try {
    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.json({ success: false, message: 'Invalid email.' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: 'Invalid password.' });
    res.json({ success: true, user: { name: user.name, email: user.email } });
  } catch (err) { res.json({ success: false }); }
});

// --- PRODUCTS ---
app.get('/api/products', async (req, res) => { 
  try { res.json(await Product.find()); } catch (err) { res.json({ success: false }); } 
});

app.post('/api/review/:id', async (req, res) => { 
  try { 
    const product = await Product.findOne({ id: req.params.id }); 
    if (!product) return res.status(404).json({ success: false }); 
    product.reviews.push({ user: req.body.user, rating: Number(req.body.rating), comment: req.body.comment, image: req.body.image || null }); 
    await product.save(); res.json({ success: true }); 
  } catch (err) { res.json({ success: false }); } 
});

// --- ADMIN PRODUCT CRUD ---
app.post('/api/admin/products', async (req, res) => {
  try {
    const newId = 'PRD-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const newProduct = new Product({ ...req.body, id: newId });
    await newProduct.save();
    res.json({ success: true, product: newProduct });
  } catch (err) { res.json({ success: false }); }
});

app.post('/api/admin/products/:id', async (req, res) => { 
  try { 
    const updatedProduct = await Product.findOneAndUpdate({ id: req.params.id }, { $set: req.body }, { new: true }); 
    res.json({ success: true, product: updatedProduct }); 
  } catch (err) { res.json({ success: false }); } 
});

app.delete('/api/admin/products/:id', async (req, res) => {
  try { await Product.findOneAndDelete({ id: req.params.id }); res.json({ success: true }); } 
  catch(err) { res.json({ success: false }); }
});

// --- ORDERS & WORKFLOW ---
app.post('/api/orders', async (req, res) => { 
  try { 
    const trackingId = 'MG-' + Math.random().toString(36).substring(2, 8).toUpperCase(); 
    const initialPayment = req.body.address.includes('[Online]') ? 'Payment Under Review' : 'Payment Pending (COD)'; 
    const newOrder = new Order({ ...req.body, trackingId, paymentStatus: initialPayment }); 
    await newOrder.save(); 
    res.json({ success: true, trackingId }); 
  } catch (err) { res.json({ success: false }); } 
});

app.get('/api/admin/orders', async (req, res) => { 
  try { res.json(await Order.find().sort({ createdAt: -1 })); } catch (err) { res.json({ success: false }); } 
});

app.post('/api/admin/order-status/:id', async (req, res) => { 
  try { await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }); res.json({ success: true }); } catch (err) { res.json({ success: false }); } 
});

app.post('/api/admin/payment-status/:id', async (req, res) => { 
  try { await Order.findByIdAndUpdate(req.params.id, { paymentStatus: req.body.paymentStatus }); res.json({ success: true }); } catch (err) { res.json({ success: false }); } 
});

app.post('/api/orders/cancel/:id', async (req, res) => { 
  try { await Order.findByIdAndUpdate(req.params.id, { status: 'Cancelled' }); res.json({ success: true, message: 'Order Cancelled.' }); } catch (err) { res.json({ success: false }); } 
});

// Customer Refund Request with Comment and Photo Proof
app.post('/api/orders/refund/:id', async (req, res) => { 
  try { 
    await Order.findByIdAndUpdate(req.params.id, { 
      refundRequested: true, 
      status: 'Refund Reviewing', 
      refundReason: req.body.reason, 
      refundImage: req.body.image 
    }); 
    res.json({ success: true, message: 'Refund request submitted for admin review.' }); 
  } catch (err) { res.json({ success: false }); } 
});

// Customer Return Request with Comment and Photo Proof (ARTO)
app.post('/api/orders/return/:id', async (req, res) => { 
  try { 
    await Order.findByIdAndUpdate(req.params.id, { 
      status: 'ARTO Reviewing', 
      returnReason: req.body.reason, 
      returnImage: req.body.image 
    }); 
    res.json({ success: true, message: 'Return request submitted. Admin will review within 48 hours of product receipt.' }); 
  } catch (err) { res.json({ success: false }); } 
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 MG Plants Backend running on port ${PORT}`));
