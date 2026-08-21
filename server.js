const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock Databases
let products = [
    { 
        id: 1, 
        name: "Money Plant (Indoor)", 
        price: 149, 
        description: "A hardy indoor plant known for purifying indoor air. Low maintenance.", 
        deliveryTime: "3 to 4 days all over West Bengal",
        reviews: [
            { user: "Subrata M.", rating: 5, comment: "Healthy plant received in 3 days!" }
        ]
    }
];

let orders = [];

// Helper to generate default tracking ID
const generateTrackingId = () => 'MG-' + Math.random().toString(36).substring(2, 8).toUpperCase();

// --- FRONTEND ROUTE (Product Detail & Storefront) ---
app.get('/product/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    if (!product) return res.status(404).send("Product not found");

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${product.name} - MG Plants</title>
            <style>
                body { font-family: Arial, sans-serif; color: #1e293b; max-width: 700px; margin: 30px auto; padding: 20px; }
                .fee-box { background: #f0fdf4; border-left: 4px solid #15803d; padding: 12px; margin: 15px 0; font-size: 14px; }
                .review-card { border-bottom: 1px solid #e2e8f0; padding: 10px 0; }
                button { background: #15803d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
            </style>
        </head>
        <body>
            <h1>${product.name}</h1>
            <p style="font-size: 20px; color: #15803d; font-weight: bold;">₹${product.price}</p>
            <p>${product.description}</p>
            
            <div class="fee-box">
                🚚 <strong>Delivery Time:</strong> ${product.deliveryTime}<br>
                📦 Delivery Fee: ₹99 | Platform Fee: ₹5
            </div>

            <form action="/checkout" method="POST">
                <input type="hidden" name="productId" value="${product.id}">
                <label>Payment Method:</label>
                <select name="paymentMethod">
                    <option value="Online/UPI">Online / UPI (Paid)</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                </select><br><br>
                <button type="submit">Place Order (₹${product.price + 99 + 5})</button>
            </form>

            <hr style="margin: 30px 0;">
            <h3>Customer Reviews</h3>
            ${product.reviews.map(r => `<div class="review-card"><strong>${r.user}</strong> - ${'★'.repeat(r.rating)}<p>${r.comment}</p></div>`).join('')}

            <h4 style="margin-top:20px;">Write a Review</h4>
            <form action="/review/${product.id}" method="POST">
                <input type="text" name="user" placeholder="Your Name" required style="padding:6px; width:100%; margin-bottom:8px;"><br>
                <select name="rating" style="padding:6px; width:100%; margin-bottom:8px;">
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                </select><br>
                <textarea name="comment" placeholder="Your experience..." required style="padding:6px; width:100%; margin-bottom:8px;"></textarea><br>
                <button type="submit">Submit Review</button>
            </form>
        </body>
        </html>
    `);
});

// --- CHECKOUT & ORDER CREATION ---
app.post('/checkout', (req, res) => {
    const { productId, paymentMethod } = req.body;
    const product = products.find(p => p.id == productId);

    const newOrder = {
        orderId: 'ORD-' + Date.now(),
        productName: product.name,
        amount: product.price + 99 + 5, // Item + ₹99 delivery + ₹5 platform fee
        paymentMethod: paymentMethod,
        status: paymentMethod === 'Online/UPI' ? 'Paid / Confirmed' : 'Pending (COD)',
        trackingId: generateTrackingId(),
        returnRequested: false,
        refundStatus: 'None',
        orderDate: new Date()
    };

    orders.push(newOrder);
    res.redirect(`/order-success/${newOrder.orderId}`);
});

// --- ORDER SUCCESS & INVOICE MANAGEMENT ---
app.get('/order-success/:id', (req, res) => {
    const order = orders.find(o => o.orderId == req.params.id);
    
    res.send(`
        <div style="font-family: Arial; max-width: 600px; margin: 40px auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px;">
            <h2 style="color: #15803d;">Order Placed Successfully!</h2>
            <p><strong>Order ID:</strong> ${order.orderId}</p>
            <p><strong>Tracking ID:</strong> ${order.trackingId} (Default generated)</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Total Paid:</strong> ₹${order.amount} (Includes ₹99 delivery & ₹5 platform fee)</p>
            
            ${order.paymentMethod === 'Online/UPI' 
                ? `<a href="/download-invoice/${order.orderId}" style="display:inline-block; background:#15803d; color:white; padding:10px 15px; text-decoration:none; border-radius:5px; margin-top:15px;">Download Digital Invoice</a>` 
                : `<p style="background:#fef9c3; padding:10px; border-radius:5px;">📦 <strong>COD Order Notice:</strong> Your printed invoice will be enclosed <strong>inside the box</strong> for cash collection upon delivery.</p>`
            }
            <br><br>
            <a href="/customer-dashboard/${order.orderId}">Go to Order Dashboard (Returns & Refunds)</a>
        </div>
    `);
});

// --- DOWNLOAD INVOICE (Online Paid Orders) ---
app.get('/download-invoice/:id', (req, res) => {
    const order = orders.find(o => o.orderId == req.params.id);
    res.send(`<h1>MG PLANTS TAX INVOICE</h1><p>Order ID: ${order.orderId}</p><p>Item: ${order.productName}</p><p>Amount: ₹${order.amount} (Paid Online)</p><p>Thank you for shopping with us!</p><hr><small>mgplants.in</small>`);
});

// --- CUSTOMER DASHBOARD (ARTO & 3-Day Return Policy) ---
app.get('/customer-dashboard/:id', (req, res) => {
    const order = orders.find(o => o.orderId == req.params.id);
    
    res.send(`
        <div style="font-family: Arial; max-width: 600px; margin: 40px auto; padding: 20px;">
            <h2>Customer Dashboard</h2>
            <p><strong>Order:</strong> ${order.productName} (${order.orderId})</p>
            <p><strong>Tracking:</strong> ${order.trackingId}</p>
            <p><strong>Current Status:</strong> ${order.status}</p>
            <p><strong>Return Policy:</strong> Valid within 3 days of delivery.</p>
            <p><strong>Refund Status:</strong> ${order.refundStatus}</p>

            ${!order.returnRequested ? `
                <form action="/request-return/${order.orderId}" method="POST">
                    <button type="submit" style="background:#b91c1c; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer;">Request Return (ARTO)</button>
                </form>
            ` : `<p style="color: #b91c1c; font-weight:bold;">Return Request (ARTO) Pending Admin Approval.</p>`}
        </div>
    `);
});

// --- HANDLE RETURN REQUEST (ARTO) ---
app.post('/request-return/:id', (req, res) => {
    const order = orders.find(o => o.orderId == req.params.id);
    order.returnRequested = true;
    order.status = 'ARTO Return Requested';
    res.redirect(`/customer-dashboard/${order.orderId}`);
});

// --- ADMIN PANEL (Order Control & Refund Option) ---
app.get('/admin', (req, res) => {
    res.send(`
        <div style="font-family: Arial; max-width: 900px; margin: 30px auto;">
            <h2>Admin Panel - Order & Refund Control</h2>
            <table border="1" cellpadding="10" cellspacing="0" style="width:100%; border-collapse: collapse; font-size: 14px;">
                <tr style="background:#f1f5f9;">
                    <th>Order ID</th>
                    <th>Tracking ID</th>
                    <th>Details</th>
                    <th>Status / ARTO</th>
                    <th>Action (Refund Control)</th>
                </tr>
                ${orders.map(o => `
                    <tr>
                        <td>${o.orderId}</td>
                        <td>${o.trackingId}</td>
                        <td>${o.productName} <br>₹${o.amount}</td>
                        <td>${o.status}</td>
                        <td>
                            <form action="/admin/update-status/${o.orderId}" method="POST">
                                <select name="newStatus">
                                    <option value="Paid / Confirmed">Paid / Confirmed</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="ARTO Approved">ARTO Approved</option>
                                    <option value="Refund Processed">Process Refund (48h SLA)</option>
                                </select>
                                <button type="submit" style="margin-top:4px;">Update</button>
                            </form>
                        </td>
                    </tr>
                `).join('')}
            </table>
        </div>
    `);
});

// --- ADMIN UPDATE STATUS & REFUND ---
app.post('/admin/update-status/:id', (req, res) => {
    const order = orders.find(o => o.orderId == req.params.id);
    order.status = req.body.newStatus;
    if(req.body.newStatus === 'Refund Processed') {
        order.refundStatus = 'Refunded within 48h SLA';
    }
    res.redirect('/admin');
});

// --- SUBMIT REVIEW ROUTE ---
app.post('/review/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    product.reviews.push({ user: req.body.user, rating: Number(req.body.rating), comment: req.body.comment });
    res.redirect(`/product/${product.id}`);
});

app.listen(3000, () => console.log('MG Plants server running on port 3000'));
