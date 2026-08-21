const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Mock Database for Products and Orders
let products = [
    { 
        id: 1, 
        name: "Money Plant (Indoor)", 
        price: 149, 
        description: "A gorgeous, low-maintenance indoor plant known for bringing prosperity and purifying air. Perfect for home desks and living rooms.", 
        deliveryTime: "3 to 4 days all over West Bengal",
        reviews: [
            { user: "Subrata M.", rating: 5, comment: "Healthy plant received in 3 days!" }
        ]
    }
];

let orders = [];

// Helper: Generate default tracking ID format
const generateTrackingId = () => 'MG-' + Math.random().toString(36).substring(2, 8).toUpperCase();

// 1. API: Get Product Details & Reviews
app.get('/api/product/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    if(!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
});

// 2. API: Submit Customer Review (Under Product Details)
app.post('/api/review/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    if(product) {
        product.reviews.unshift({ 
            user: req.body.user, 
            rating: Number(req.body.rating), 
            comment: req.body.comment 
        });
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Product not found" });
    }
});

// 3. API: Checkout & Order Creation (Detailed Fee Structure: ₹99 Delivery + ₹5 Platform Fee)
app.post('/api/checkout', (req, res) => {
    const { productId, paymentMethod } = req.body;
    const product = products.find(p => p.id == productId);
    const itemPrice = product ? product.price : 149;
    const deliveryFee = 99;
    const platformFee = 5;

    const newOrder = {
        orderId: 'ORD-' + Date.now(),
        productName: product ? product.name : "Money Plant",
        itemPrice: itemPrice,
        deliveryFee: deliveryFee,
        platformFee: platformFee,
        totalAmount: itemPrice + deliveryFee + platformFee, // Total ₹253
        paymentMethod: paymentMethod, // 'Online' or 'COD'
        status: paymentMethod === 'Online' ? 'Paid / Confirmed' : 'Pending (COD)',
        trackingId: generateTrackingId(), // Default tracking ID generated
        returnRequested: false, // ARTO flag
        refundStatus: 'None', // 48-Hour Refund SLA tracker
        orderDate: new Date().toLocaleDateString()
    };

    orders.push(newOrder);
    res.json({ success: true, order: newOrder });
});

// 4. API: Customer Order Lookup (Supports 3-Day Return Policy & ARTO)
app.get('/api/order/:id', (req, res) => {
    const order = orders.find(o => o.orderId === req.params.id);
    if(!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
});

// 5. API: Customer Request Return (ARTO & 3-Day Return Policy)
app.post('/api/customer/request-return', (req, res) => {
    const { orderId } = req.body;
    const order = orders.find(o => o.orderId === orderId);
    if(order) {
        order.returnRequested = true;
        order.status = 'ARTO Return Requested';
        res.json({ success: true, message: "Return request submitted successfully." });
    } else {
        res.status(404).json({ error: "Order not found" });
    }
});

// 6. API: Download Digital Invoice (For Online Paid Orders)
app.get('/api/invoice/:id', (req, res) => {
    const order = orders.find(o => o.orderId === req.params.id);
    if(!order) return res.status(404).send("Order not found");
    
    res.send(`
        <div style="font-family: Arial; padding: 20px; max-width: 500px; margin: auto; border: 1px solid #ccc;">
            <h2>MG PLANTS - TAX INVOICE</h2>
            <p><strong>Order ID:</strong> ${order.orderId}</p>
            <p><strong>Tracking ID:</strong> ${order.trackingId}</p>
            <hr>
            <p>Item: ${order.productName} - ₹${order.itemPrice}</p>
            <p>Delivery Fee: ₹${order.deliveryFee}</p>
            <p>Platform Fee: ₹${order.platformFee}</p>
            <hr>
            <h3>Total Paid: ₹${order.totalAmount} (Paid Online)</h3>
            <p style="color: #15803d; font-weight: bold;">Status: Paid & Verified</p>
            <small>Delivery time: 3 to 4 days all over West Bengal. mgplants.in</small>
        </div>
    `);
});

// 7. API: Get All Orders for Admin Panel (Order Status & Refund Control)
app.get('/api/admin/orders', (req, res) => {
    res.json(orders);
});

// 8. API: Admin Update Status & Process Refund (Within 48-Hour SLA)
app.post('/api/admin/update-order', (req, res) => {
    const { orderId, newStatus } = req.body;
    const order = orders.find(o => o.orderId === orderId);
    if(order) {
        order.status = newStatus;
        if(newStatus === 'Refund Processed') {
            order.refundStatus = 'Refund Completed (Within 48h SLA)';
        }
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Order not found" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MG Plants Server running on port ${PORT}`));
