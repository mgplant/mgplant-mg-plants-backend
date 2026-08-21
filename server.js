const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

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
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } 
});
const Otp = mongoose.model('Otp', otpSchema);

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

// --- 3. EMAIL TRANSPORTER (ZOHO INDIA SMTP) ---
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.in',
  port: 465,
  secure: true,
  auth: {
    user: 'mgplants@zohomail.in', // ✅ Updated to your exact Zoho email
    pass: '1rWBF8EgC9mB'            // ✅ Configured Zoho App Password
  }
});

// --- 4. OTP AUTHENTICATION & LOGIN LOGS ---
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success: false, message: 'Please enter a valid email address.' });

  const cleanEmail = email.toLowerCase().trim();
  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await Otp.deleteMany({ email: cleanEmail });
    await new Otp({ email: cleanEmail, otp: generatedOtp }).save();

    const mailOptions = {
      from: '"MG Plants" <mgplants@zohomail.in>', // ✅ Updated sender email
      to: cleanEmail,
      subject: `Your Login OTP for MG Plants: ${generatedOtp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #15803d;">MG Plants Security Verification</h2>
          <p>Hello,</p>
          <p>Use the following 6-digit One-Time Password (OTP) to securely log in to your account:</p>
          <div style="font-size: 26px; font-weight: bold; letter-spacing: 4px; color: #0f172a; padding: 12px; background: #f0fdf4; text-align: center; border-radius: 8px; border: 1px solid #86efac;">
            ${generatedOtp}
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 15px;">This OTP is valid for 5 minutes. If you did not request this, please ignore this email.</p>
        </div>`
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) console.warn('Zoho Mail send warning:', error.message);
    });

    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (err) { 
    res.status(500).json({ success: false, message: 'Failed to generate OTP.' }); 
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    const cleanEmail = email.toLowerCase().trim();
    const record = await Otp.findOne({ email: cleanEmail, otp: otp.trim() });

    if (!record) {
      await new LoginLog({ email: cleanEmail, ip: clientIp, status: 'Failed', reason: 'Invalid or Expired OTP' }).save();
      return res.json({ success: false, message: 'Invalid or expired OTP. Please try again.' });
    }

    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      const generatedName = cleanEmail.split('@')[0];
      user = new User({ name: generatedName, email: cleanEmail });
      await user.save();
    }

    await Otp.deleteMany({ email: cleanEmail });
    await new LoginLog({ email: cleanEmail, ip: clientIp, status: 'Success' }).save();

    res.json({ success: true, user: { name: user.name, email: user.email } });
  } catch (err) { 
    res.status(500).json({ success: false, message: 'OTP verification failed.' }); 
  }
});

// --- 5. PRODUCTS & STORE ROUTES ---
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

// --- 6. START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 MG Plants Backend running on port ${PORT}`));
