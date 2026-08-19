// Add this Order Schema to your server.js
const orderSchema = new mongoose.Schema({
  customerName: String,
  phone: String,
  address: String,
  items: Array,
  totalAmount: Number,
  status: { type: String, default: 'Pending' }, // Pending, Confirmed, Cancelled, Delivered
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// API to Create Order from Checkout
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, phone, address, items, totalAmount } = req.body;
    const newOrder = new Order({ customerName, phone, address, items, totalAmount });
    await newOrder.save();
    res.json({ success: true, orderId: newOrder._id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error saving order' });
  }
});

// API for Admin to Fetch All Orders
app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// API for Customer to Cancel Order within 4 hours
app.post('/api/orders/cancel/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.json({ success: false, message: 'Order not found' });
    
    // Check if 4 hours have passed
    const hoursElapsed = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursElapsed > 4) {
      return res.json({ success: false, message: 'Cancellation window (4 hours) has expired.' });
    }
    
    order.status = 'Cancelled';
    await order.save();
    res.json({ success: true, message: 'Order cancelled successfully.' });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
