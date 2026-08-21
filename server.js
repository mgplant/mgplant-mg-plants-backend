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
    await seedDefaultProducts(); // Automatically adds products if database is empty
  })
  .catch(err => console.error('MongoDB connection error:', err));

// --- 2. DATABASE SCHEMAS ---
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});
const User = mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({
  id: String,
  name: String,
  category: String,
  price: Number,
  origPrice: Number,
  image: String,
  bestSeller: Boolean
});
const Product = mongoose.model('Product', productSchema);

const orderSchema = new mongoose.Schema({
  customerName: String,
  phone: String,
  address: String,
  items: Array,
  totalAmount: Number,
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// --- 3. AUTO-SEED INITIAL PRODUCTS ---
async function seedDefaultProducts() {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      const defaultProducts = [
        { id: 'p1', name: 'Snake Plant', category: 'Indoor Plants', price: 199, origPrice: 279, bestSeller: true, image: 'https://images.unsplash.com/photo-1593482834166-d34559eb4e1c?w=500' },
        { id: 'p2', name: 'Peace Lily', category: 'Indoor Plants', price: 249, origPrice: 349, bestSeller: true, image: 'https://images.unsplash.com/photo-1592841200221-a689c1f07441?w=500' },
        { id: 'p3', name: 'ZZ Plant', category: 'Indoor Plants', price: 299, origPrice: 399, bestSeller: true, image: 'https://images.unsplash.com/photo-1632207188724-18a22ec24765?w=500' },
        { id: 'p4', name: 'Mango Grafted Sapling', category: 'Fruit Plants', price: 349, origPrice: 499, bestSeller: true, image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500' },
        { id: 'p5', name: 'Lemon Live Plant', category: 'Fruit Plants', price: 229, origPrice: 310, bestSeller: false, image: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=500' },
        { id: 'p6', name: 'Hybrid Tomato Seeds (50g)', category: 'Seeds', price: 99, origPrice: 150, bestSeller: false, image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500' },
        { id: 'p7', name: 'Paddy Seeds Premium (500g)', category: 'Seeds', price: 149, origPrice: 199, bestSeller: true, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500' }
      ];
      await Product.insertMany(defaultProducts);
      console.log('🌱 Default plants and seeds seeded successfully into MongoDB!');
    }
  } catch (err) {
    console.error('Error seeding products:', err);
  }
}

// --- 4. API ROUTES ---

// Fetch Products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching products' });
  }
});

// Authentication Routes
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.json({ success: true, user: { name, email } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }
    res.json({ success: true, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Order Management Routes
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error saving order' });
  }
});

app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching orders' });
  }
});

app.post('/api/orders/cancel/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    const hoursElapsed = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
    
    if (hoursElapsed > 4) {
      return res.json({ success: false, message: 'Cancellation window (4 hours) has expired.' });
    }
    
    order.status = 'Cancelled';
    await order.save();
    res.json({ success: true, message: 'Order successfully cancelled.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Cancellation error.' });
  }
});

// --- 5. START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 MG Plants Backend running on port ${PORT}`));  
    
