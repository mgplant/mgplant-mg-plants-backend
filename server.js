const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 

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
  password: { type: String, required: true }, 
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
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.json({ success: false, message: 'Email and password are required.' });

  const cleanEmail = email.toLowerCase().trim();

  try {
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) return res.json({ success: false, message: 'Account already exists. Please log in.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const generatedName = name || cleanEmail.split('@')[0];
    
    const newUser = new User({ name: generatedName, email: cleanEmail, password: hashedPassword });
    await newUser.save();
    res.json({ success: true, user: { name: newUser.name, email: newUser.email } });
  } catch (err) { res.status(500).json({ success: false, message: 'Signup failed. Please try again.' }); }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (!email || !password) return res.json({ success: false, message: 'Please enter both email and password.' });
  const cleanEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      await new LoginLog({ email: cleanEmail, ip: clientIp, status: 'Failed', reason: 'User Not Found' }).save();
      return res.json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await new LoginLog({ email: cleanEmail, ip: clientIp, status: 'Failed', reason: 'Incorrect Password' }).save();
      return res.json({ success: false, message: 'Invalid email or password.' });
    }

    await new LoginLog({ email: cleanEmail, ip: clientIp, status: 'Success' }).save();
    res.json({ success: true, user: { name: user.name, email: user.email } });
  } catch (err) { res.status(500).json({ success: false, message: 'Login failed.' }); }
});

// --- 4. PRODUCTS & STORE ROUTES ---
app.get('/api/products', async (req, res) => { 
  try { res.json(await Product.find()); } 
  catch (err) { res.status(500).json({ success: false }); } 
});

// Admin Route: Update Product Price/Image
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

// Customer Route: Submit Review
app.post('/api/review/:id', async (req, res) => { 
  try { 
    const product = await Product.findOne({ id: req.params.id }); 
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' }); 
    product.reviews.push({ user: req.body.user, rating: Number(req.body.rating), comment: req.body.comment, image: req.body.image || null }); 
    await product.save(); 
    res.json({ success: true, message: 'Review added successfully' }); 
  } catch (err) { res.status(500).json({ success: false }); } 
});

// --- 5. ORDERS & DASHBOARD ROUTES ---
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

// Admin Route: Update Order Status
app.post('/api/admin/order-status/:id', async (req, res) => { 
  try { 
    await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }); 
    res.json({ success: true }); 
  } catch (err) { res.status(500).json({ success: false }); } 
});

// Admin Route: Update Payment Status
app.post('/api/admin/payment-status/:id', async (req, res) => { 
  try { 
    await Order.findByIdAndUpdate(req.params.id, { paymentStatus: req.body.paymentStatus }); 
    res.json({ success: true }); 
  } catch (err) { res.status(500).json({ success: false }); } 
});

// Customer Route: Cancel Order
app.post('/api/orders/cancel/:id', async (req, res) => { 
  try { 
    const order = await Order.findById(req.params.id); 
    if ((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60) > 4) return res.json({ success: false, message: 'Expired.' }); 
    order.status = 'Cancelled'; await order.save(); res.json({ success: true, message: 'Cancelled.' }); 
  } catch (err) { res.status(500).json({ success: false }); } 
});

// Customer Route: Request Refund
app.post('/api/orders/refund/:id', async (req, res) => { 
  try { 
    const order = await Order.findById(req.params.id); 
    if (!order) return res.status(404).json({ success: false }); 
    order.refundRequested = true; order.status = 'Refund Processing'; await order.save(); res.json({ success: true, message: 'Refund requested.' }); 
  } catch (err) { res.status(500).json({ success: false }); } 
});

// Customer Route: Request ARTO Return
app.post('/api/orders/return/:id', async (req, res) => { 
  try { 
    const order = await Order.findById(req.params.id); 
    if (!order) return res.status(404).json({ success: false }); 
    order.status = 'ARTO Request'; order.returnReason = req.body.reason; order.returnImage = req.body.image; await order.save(); res.json({ success: true, message: 'Return requested.' }); 
  } catch (err) { res.status(500).json({ success: false }); } 
});

// --- 6. ONE-TIME DATABASE SEED ROUTE ---
app.get('/api/seed-database', async (req, res) => {
  const newProducts = [
    { id: 'PRD-IN-01', name: 'Premium Swiss Cheese Plant (Monstera)', category: 'Indoor', price: 499, origPrice: 799, bestSeller: true, image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d40?w=500' },
    { id: 'PRD-IN-02', name: 'Air Purifying Snake Plant', category: 'Indoor', price: 299, origPrice: 450, bestSeller: true, image: 'https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=500' },
    { id: 'PRD-IN-03', name: 'Golden Pothos (Money Plant)', category: 'Indoor', price: 199, origPrice: 250, bestSeller: false, image: 'https://images.unsplash.com/photo-1600412853765-8b22a00c3b88?w=500' },
    
    { id: 'PRD-OU-01', name: 'Areca Palm Tree', category: 'Outdoor', price: 549, origPrice: 800, bestSeller: true, image: 'https://images.unsplash.com/photo-1605553106316-2d3ea9f6c0eb?w=500' },
    { id: 'PRD-OU-02', name: 'Pink Bougainvillea', category: 'Outdoor', price: 349, origPrice: 500, bestSeller: false, image: 'https://images.unsplash.com/photo-1629853925528-917fc9f627ba?w=500' },
    { id: 'PRD-OU-03', name: 'Ficus Bonsai Plant', category: 'Outdoor', price: 899, origPrice: 1200, bestSeller: true, image: 'https://images.unsplash.com/photo-1599598425947-33001c0ae5e5?w=500' },

    { id: 'PRD-FR-01', name: 'Grafted Mango Plant (Alphonso)', category: 'Fruits', price: 450, origPrice: 650, bestSeller: true, image: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=500' },
    { id: 'PRD-FR-02', name: 'Dwarf Lemon Tree (Nimbu)', category: 'Fruits', price: 299, origPrice: 400, bestSeller: true, image: 'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?w=500' },
    { id: 'PRD-FR-03', name: 'Red Guava Plant', category: 'Fruits', price: 350, origPrice: 499, bestSeller: false, image: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=500' },

    { id: 'PRD-FL-01', name: 'Classic Red Rose Plant', category: 'Flowers', price: 249, origPrice: 399, bestSeller: true, image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500' },
    { id: 'PRD-FL-02', name: 'Fragrant Jasmine (Mogra)', category: 'Flowers', price: 199, origPrice: 300, bestSeller: true, image: 'https://images.unsplash.com/photo-1546842603-519782cc4107?w=500' },
    { id: 'PRD-FL-03', name: 'Purple Lavender Plant', category: 'Flowers', price: 399, origPrice: 550, bestSeller: false, image: 'https://images.unsplash.com/photo-1498805983167-a523078d762c?w=500' },

    { id: 'PRD-SD-01', name: 'Organic Tomato Seeds (Pack of 50)', category: 'Seeds', price: 99, origPrice: 150, bestSeller: true, image: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=500' },
    { id: 'PRD-SD-02', name: 'Holy Basil (Tulsi) Seeds', category: 'Seeds', price: 79, origPrice: 120, bestSeller: true, image: 'https://images.unsplash.com/photo-1598512140407-7429d3326176?w=500' },
    { id: 'PRD-SD-03', name: 'Sunflower Seeds (Pack of 30)', category: 'Seeds', price: 89, origPrice: 140, bestSeller: false, image: 'https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?w=500' }
  ];

  try {
    await Product.insertMany(newProducts);
    res.send('<h1>✅ Success! 15 New Categorized Products Added to Your Store.</h1><p>You can close this tab and refresh your live website.</p>');
  } catch (err) {
    res.send(`<h1>⚠️ Error:</h1><p>${err.message}</p>`);
  }
});

// --- 7. START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 MG Plants Backend running on port ${PORT}`));
