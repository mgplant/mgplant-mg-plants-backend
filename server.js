// server.js - MG Plants Backend Server
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); 

// Connect to Database (We will add your real link later)
mongoose.connect('mongodb+srv://mgplants_db_user:7PFZockvsScku3gi@cluster0.cqsdy2b.mongodb.net/?appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('🌱 MG Plants Database Connected!'))
  .catch(err => console.log('Database connection error:', err));

const productSchema = new mongoose.Schema({
    name: String, category: String, price: Number, origPrice: Number, stockQuantity: Number, image: String, shortDesc: String
});
const Product = mongoose.model('Product', productSchema);

app.get('/api/products', async (req, res) => {
    try {
        const plants = await Product.find(); 
        res.json(plants);
    } catch (error) {
        res.status(500).json({ message: "Error fetching products" });
    }
});

app.post('/api/checkout', async (req, res) => {
    const { customerName, totalAmount } = req.body;
    console.log(`New order received from ${customerName} for ₹${totalAmount}`);
    res.json({ message: "Order processed successfully!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 MG Plants Server is running on port ${PORT}`);
});
