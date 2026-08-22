const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Added bcrypt for secure password hashing

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// --- 1. MONGODB CONNECTION ---
const dbPassword = "0j7XArbeyiP27O6o"; 
const MONGO_URI = `mongodb+srv://mgplants_db_user:${dbPassword}@cluster0.cqsdy2b.mongodb.net/mgplants?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.connect(MONGO_URI)
  .then(() => console.log('🌿 Connected to MongoDB Atlas successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- 2. DATABASE SCHEMAS ---
const userSchema = new mongoose.Schema({ 
  name: String, 
  email: { type: String, unique: true, lowercase: true, trim: true }, 
  password: { type: String, required: true }, // New encrypted password field
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const loginLogSchema = new mongoose.Schema({
  email: String,
  ip: String,
  status: String, 
  reason: String,
  timestamp: { type: Date, default: Date.now }
});
const LoginLog = mongoose.model('LoginLog', loginLogSchema);

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
  returnReason: String, 
  returnImage: String, 
  refundRequested: { type: Boolean, default: false }, 
  createdAt: { type: Date, default: Date.now } 
});
const Order = mongoose.model('Order', orderSchema);

// --- 3. AUTHENTICATION (SIGNUP & LOGIN) ---

// Route 1: Sign Up (Create Account)
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.json({ success: false, message: 'Email and password are required.' });

  const cleanEmail = email.toLowerCase().trim();

  try {
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.json({ success: false, message: 'Account already exists. Please log in.' });
    }

    // Hash the password securely before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const generatedName = name || cleanEmail.split('@')[0];
    const newUser = new User({ 
      name: generatedName, 
      email: cleanEmail, 
      password: hashedPassword 
    });
    
    await newUser.save();
    res.json({ success: true, user: { name: newUser.name, email: newUser.email } });
  } catch (err) { 
    res.status(500).json({ success: false, message: 'Signup failed. Please try again.' }); 
  }
});

// Route 2: Log In (Verify Account)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (!email || !password) return res.json({ success: false, message: 'Please enter both email and password.' });
  const cleanEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: cleanEmail });
    
    // Check if the user exists
    if (!user) {
      await new LoginLog({ email: cleanEmail, ip: clientIp, status: 'Failed', reason: 'User Not Found' }).save();
      return res.json({ success: false, message: 'Invalid email or password.' });
    }

    // Compare the entered password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await new LoginLog({ email: cleanEmail, ip: clientIp, status: 'Failed', reason: 'Incorrect Password' }).save();
      return res.json({ success: false, message: 'Invalid email or password.' });
    }

    await new LoginLog({ email: cleanEmail, ip: clientIp, status: 'Success' }).save();
    res.json({ success: true, user: { name: user.name, email: user.email } });
  } catch (err) { 
    res.status(500).json({ success: false, message: 'Login failed.' }); 
  }
});

// --- 4. PRODUCTS & STORE ROUTES ---
app.get('/api/products', async (req, res) => { 
  try { res.json(await Product.find()); } 
  catch (err) { res.status(500).json({ success: false }); } 
});

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

app.post('/api/review/:id', async (req, res) => { 
  try { 
    const product = await Product.findOne({ id: req.params.id }); 
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' }); 
    product.reviews.push({ 
      user: req.body.user, 
      rating: Number(req.body.rating), 
      comment: req.body.comment, 
      image: req.body.image || null 
    }); 
    await product.save(); 
    res.json({ success: true, message: 'Review added successfully' }); 
  } catch (err) { res.status(500).json({ success: false }); } 
});

app.post('/api/orders', async (req, res) => { 
  try { 
    const trackingId = 'MG-' + Math.random().toString(36).substring(2, 8).toUpperCase(); 
    const initialPaymentStatus = req.body.address.includes('[Online]') ? 'Payment Pending' : 'Payment Pending (COD)'; 
    const newOrder = new Order({ ...req.body, trackingId, paymentStatus: initialPaymentStatus }); 
    await newOrder.save(); 
    res.json({ success: true, trackingId }); 
  } catch (err) { res.status(500).json({ success: false }); } 
});

app.get('/api/admin/orders', async (req, res) => { 
  try { res.json(await Order.find().sort({ createdAt: -1 })); } 
  catch (err) { res.status(500).json({ success: false }); } 
});

app.post('/api/admin/order-status/:id', async (req, res) => { 
  try { 
    await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }); 
    res.json({ success: true }); 
  } catch (err) { res.status(500).json({ success: false }); } 
});

app.post('/api/admin/payment-status/:id', async (req, res) => { 
  try { 
    await Order.findByIdAndUpdate(req.params.id, { paymentStatus: req.body.paymentStatus }); 
    res.json({ success: true }); 
  } catch (err) { res.status(500).json({ success: false }); } 
});

app.post('/api/orders/return/:id', async (req, res) => { 
  try { 
    const order = await Order.findById(req.params.id); 
    if (!order) return res.status(404).json({ success: false }); 
    order.status = 'ARTO Request'; 
    order.returnReason = req.body.reason; 
    order.returnImage = req.body.image; 
    await order.save(); 
    res.json({ success: true, message: 'Return requested.' }); 
  } catch (err) { res.status(500).json({ success: false }); } 
});

app.post('/api/orders/refund/:id', async (req, res) => { 
  try { 
    const order = await Order.findById(req.params.id); 
    if (!order) return res.status(404).json({ success: false }); 
    order.refundRequested = true; 
    order.status = 'Refund Processing'; 
    await order.save(); 
    res.json({ success: true, message: 'Refund requested.' }); 
  } catch (err) { res.status(500).json({ success: false }); } 
});

app.post('/api/orders/cancel/:id', async (req, res) => { 
  try { 
    const order = await Order.findById(req.params.id); 
    if ((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60) > 4) {
      return res.json({ success: false, message: 'Expired.' }); 
    }
    order.status = 'Cancelled'; 
    await order.save(); 
    res.json({ success: true, message: 'Cancelled.' }); 
  } catch (err) { res.status(500).json({ success: false }); } 
});

// --- 5. START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 MG Plants Backend running on port ${PORT}`));
