const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cors());

// --- 1. MONGODB CONNECTION ---
const dbPassword = "0j7XArbeyiP27O6o"; 
const MONGO_URI = `mongodb+srv://mgplants_db_user:${dbPassword}@cluster0.cqsdy2b.mongodb.net/mgplants?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('🌿 Connected to MongoDB Atlas successfully');
    await seedDefaultProducts();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// --- 2. DATABASE SCHEMAS ---
const userSchema = new mongoose.Schema({ name: String, email: { type: String, unique: true }, password: String });
const User = mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({ id: String, name: String, category: String, price: Number, origPrice: Number, image: String, bestSeller: Boolean });
const Product = mongoose.model('Product', productSchema);

const orderSchema = new mongoose.Schema({ customerName: String, phone: String, address: String, items: Array, totalAmount: Number, status: { type: String, default: 'Pending' }, createdAt: { type: Date, default: Date.now } });
const Order = mongoose.model('Order', orderSchema);

// --- 3. AUTO-SEED ---
async function seedDefaultProducts() {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      // (Data already seeded in your database, so it will skip this now to protect your edits!)
      console.log('Database already populated or ready to be populated.');
    }
  } catch (err) { console.error('Error seeding products:', err); }
}

// --- 4. API ROUTES ---
// Fetch Products
app.get('/api/products', async (req, res) => { try { res.json(await Product.find()); } catch (err) { res.status(500).json({ success: false }); } });

// 🆕 NEW: Update a Product (for your Admin Panel)
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

// Auth Routes
app.post('/api/register', async (req, res) => { try { const { name, email, password } = req.body; const hashedPassword = await bcrypt.hash(password, 10); const newUser = new User({ name, email, password: hashedPassword }); await newUser.save(); res.json({ success: true, user: { name, email } }); } catch (err) { res.status(500).json({ success: false }); } });
app.post('/api/login', async (req, res) => { try { const { email, password } = req.body; const user = await User.findOne({ email }); if (!user || !(await bcrypt.compare(password, user.password))) return res.json({ success: false }); res.json({ success: true, user: { name: user.name, email: user.email } }); } catch (err) { res.status(500).json({ success: false }); } });

// Order Routes
app.post('/api/orders', async (req, res) => { try { const newOrder = new Order(req.body); await newOrder.save(); res.json({ success: true }); } catch (err) { res.status(500).json({ success: false }); } });
app.get('/api/admin/orders', async (req, res) => { try { res.json(await Order.find().sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ success: false }); } });
app.post('/api/orders/cancel/:id', async (req, res) => { try { const order = await Order.findById(req.params.id); if ((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60) > 4) return res.json({ success: false, message: 'Expired.' }); order.status = 'Cancelled'; await order.save(); res.json({ success: true, message: 'Cancelled.' }); } catch (err) { res.status(500).json({ success: false }); } });

// --- 5. START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 MG Plants Backend running on port ${PORT}`));
