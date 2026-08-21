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

// --- 3. AUTO-SEED ALL 137 CATALOG ITEMS ---
async function seedDefaultProducts() {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      // Image pool to save space and assign non-copyrighted HD images
      const imgs = [
        'https://images.unsplash.com/photo-1593482834166-d34559eb4e1c?w=500',
        'https://images.unsplash.com/photo-1592841200221-a689c1f07441?w=500',
        'https://images.unsplash.com/photo-1632207188724-18a22ec24765?w=500',
        'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=500',
        'https://images.unsplash.com/photo-1611211232932-da3113c5b960?w=500',
        'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=500',
        'https://images.unsplash.com/photo-1615967963246-77ae8419c86e?w=500',
        'https://images.unsplash.com/photo-1599598425838-8040b81f13f6?w=500',
        'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500',
        'https://images.unsplash.com/photo-1588610344406-444747c3cfd1?w=500',
        'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500',
        'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=500',
        'https://images.unsplash.com/photo-1536510233921-8e1043f0c33e?w=500',
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500',
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500',
        'https://images.unsplash.com/photo-1606851094090-827236dc9969?w=500'
      ];

      const defaultProducts = [
        {id:'p1',name:'Money Plant',category:'Indoor Plants',price:149,origPrice:193,bestSeller:true,image:imgs[0]},
        {id:'p2',name:'Golden Money Plant',category:'Indoor Plants',price:199,origPrice:258,bestSeller:false,image:imgs[2]},
        {id:'p3',name:'Marble Queen Pothos',category:'Indoor Plants',price:299,origPrice:388,bestSeller:false,image:imgs[4]},
        {id:'p4',name:'Snake Plant',category:'Indoor Plants',price:299,origPrice:388,bestSeller:true,image:imgs[5]},
        {id:'p5',name:'ZZ Plant',category:'Indoor Plants',price:299,origPrice:388,bestSeller:true,image:imgs[5]},
        {id:'p6',name:'Peace Lily',category:'Indoor Plants',price:249,origPrice:323,bestSeller:true,image:imgs[2]},
        {id:'p7',name:'Aglaonema Green',category:'Indoor Plants',price:299,origPrice:388,bestSeller:false,image:imgs[0]},
        {id:'p8',name:'Aglaonema Red',category:'Indoor Plants',price:349,origPrice:453,bestSeller:false,image:imgs[5]},
        {id:'p9',name:'Spider Plant',category:'Indoor Plants',price:199,origPrice:258,bestSeller:false,image:imgs[2]},
        {id:'p10',name:'Syngonium',category:'Indoor Plants',price:199,origPrice:258,bestSeller:false,image:imgs[4]},
        {id:'p11',name:'Lucky Bamboo',category:'Indoor Plants',price:149,origPrice:193,bestSeller:false,image:imgs[3]},
        {id:'p12',name:'Areca Palm',category:'Indoor Plants',price:249,origPrice:323,bestSeller:true,image:imgs[4]},
        {id:'p13',name:'Bamboo Palm',category:'Indoor Plants',price:299,origPrice:388,bestSeller:false,image:imgs[4]},
        {id:'p14',name:'Rubber Plant',category:'Indoor Plants',price:499,origPrice:648,bestSeller:false,image:imgs[5]},
        {id:'p15',name:'Philodendron',category:'Indoor Plants',price:299,origPrice:388,bestSeller:false,image:imgs[4]},
        {id:'p16',name:'Monstera',category:'Indoor Plants',price:399,origPrice:518,bestSeller:false,image:imgs[2]},
        {id:'p17',name:'Dieffenbachia',category:'Indoor Plants',price:299,origPrice:388,bestSeller:false,image:imgs[2]},
        {id:'p18',name:'Anthurium',category:'Indoor Plants',price:599,origPrice:778,bestSeller:false,image:imgs[4]},
        {id:'p19',name:'Calathea',category:'Indoor Plants',price:399,origPrice:518,bestSeller:false,image:imgs[3]},
        {id:'p20',name:'Fittonia',category:'Indoor Plants',price:199,origPrice:258,bestSeller:false,image:imgs[1]},
        {id:'p21',name:'Bougainvillea',category:'Outdoor Plants',price:199,origPrice:258,bestSeller:false,image:imgs[7]},
        {id:'p22',name:'Hibiscus',category:'Outdoor Plants',price:59,origPrice:76,bestSeller:false,image:imgs[6]},
        {id:'p23',name:'Ixora',category:'Outdoor Plants',price:199,origPrice:258,bestSeller:false,image:imgs[9]},
        {id:'p24',name:'Jasmine',category:'Outdoor Plants',price:199,origPrice:258,bestSeller:false,image:imgs[6]},
        {id:'p25',name:'Mogra',category:'Outdoor Plants',price:199,origPrice:258,bestSeller:false,image:imgs[6]},
        {id:'p26',name:'Aparajita',category:'Outdoor Plants',price:149,origPrice:193,bestSeller:false,image:imgs[9]},
        {id:'p27',name:'Rangoon Creeper',category:'Outdoor Plants',price:199,origPrice:258,bestSeller:false,image:imgs[8]},
        {id:'p28',name:'Allamanda',category:'Outdoor Plants',price:199,origPrice:258,bestSeller:false,image:imgs[7]},
        {id:'p29',name:'Plumeria',category:'Outdoor Plants',price:249,origPrice:323,bestSeller:false,image:imgs[7]},
        {id:'p30',name:'Rose',category:'Outdoor Plants',price:79,origPrice:102,bestSeller:false,image:imgs[6]},
        {id:'p31',name:'Adenium',category:'Outdoor Plants',price:299,origPrice:388,bestSeller:false,image:imgs[9]},
        {id:'p32',name:'Croton',category:'Outdoor Plants',price:249,origPrice:323,bestSeller:false,image:imgs[9]},
        {id:'p33',name:'Duranta',category:'Outdoor Plants',price:149,origPrice:193,bestSeller:false,image:imgs[6]},
        {id:'p34',name:'Tecoma',category:'Outdoor Plants',price:199,origPrice:258,bestSeller:false,image:imgs[6]},
        {id:'p35',name:'Kaner',category:'Outdoor Plants',price:149,origPrice:193,bestSeller:false,image:imgs[7]},
        {id:'p36',name:'Portulaca',category:'Outdoor Plants',price:49,origPrice:63,bestSeller:false,image:imgs[6]},
        {id:'p37',name:'Chrysanthemum',category:'Outdoor Plants',price:59,origPrice:76,bestSeller:false,image:imgs[9]},
        {id:'p38',name:'Marigold',category:'Outdoor Plants',price:49,origPrice:63,bestSeller:false,image:imgs[8]},
        {id:'p39',name:'Gardenia',category:'Outdoor Plants',price:249,origPrice:323,bestSeller:false,image:imgs[6]},
        {id:'p40',name:'Butterfly Pea',category:'Outdoor Plants',price:149,origPrice:193,bestSeller:false,image:imgs[9]},
        {id:'p41',name:'Red Rose',category:'Flowering Plants',price:199,origPrice:258,bestSeller:false,image:imgs[5]},
        {id:'p42',name:'Pink Rose',category:'Flowering Plants',price:199,origPrice:258,bestSeller:false,image:imgs[1]},
        {id:'p43',name:'White Rose',category:'Flowering Plants',price:199,origPrice:258,bestSeller:false,image:imgs[2]},
        {id:'p44',name:'Hibiscus Red',category:'Flowering Plants',price:149,origPrice:193,bestSeller:false,image:imgs[1]},
        {id:'p45',name:'Hibiscus Yellow',category:'Flowering Plants',price:199,origPrice:258,bestSeller:false,image:imgs[4]},
        {id:'p46',name:'Hibiscus Pink',category:'Flowering Plants',price:149,origPrice:193,bestSeller:false,image:imgs[3]},
        {id:'p47',name:'Mogra',category:'Flowering Plants',price:199,origPrice:258,bestSeller:false,image:imgs[5]},
        {id:'p48',name:'Jasmine',category:'Flowering Plants',price:199,origPrice:258,bestSeller:false,image:imgs[5]},
        {id:'p49',name:'Bougainvillea',category:'Flowering Plants',price:199,origPrice:258,bestSeller:false,image:imgs[1]},
        {id:'p50',name:'Adenium',category:'Flowering Plants',price:299,origPrice:388,bestSeller:false,image:imgs[3]},
        {id:'p51',name:'Plumeria',category:'Flowering Plants',price:249,origPrice:323,bestSeller:false,image:imgs[1]},
        {id:'p52',name:'Ixora',category:'Flowering Plants',price:199,origPrice:258,bestSeller:false,image:imgs[3]},
        {id:'p53',name:'Gardenia',category:'Flowering Plants',price:249,origPrice:323,bestSeller:false,image:imgs[4]},
        {id:'p54',name:'Chrysanthemum',category:'Flowering Plants',price:59,origPrice:76,bestSeller:false,image:imgs[4]},
        {id:'p55',name:'Marigold',category:'Flowering Plants',price:49,origPrice:63,bestSeller:false,image:imgs[2]},
        {id:'p56',name:'Portulaca',category:'Flowering Plants',price:49,origPrice:63,bestSeller:false,image:imgs[5]},
        {id:'p57',name:'Aparajita',category:'Flowering Plants',price:149,origPrice:193,bestSeller:false,image:imgs[3]},
        {id:'p58',name:'Rangoon Creeper',category:'Flowering Plants',price:199,origPrice:258,bestSeller:false,image:imgs[4]},
        {id:'p59',name:'Gerbera',category:'Flowering Plants',price:199,origPrice:258,bestSeller:false,image:imgs[3]},
        {id:'p60',name:'Kalanchoe',category:'Flowering Plants',price:199,origPrice:258,bestSeller:false,image:imgs[0]},
        {id:'p61',name:'Mango',category:'Fruit Plants',price:549,origPrice:713,bestSeller:false,image:imgs[11]},
        {id:'p62',name:'Guava',category:'Fruit Plants',price:69,origPrice:89,bestSeller:false,image:imgs[10]},
        {id:'p63',name:'Lemon',category:'Fruit Plants',price:59,origPrice:76,bestSeller:false,image:imgs[12]},
        {id:'p64',name:'Mosambi',category:'Fruit Plants',price:349,origPrice:453,bestSeller:false,image:imgs[12]},
        {id:'p65',name:'Orange',category:'Fruit Plants',price:79,origPrice:102,bestSeller:false,image:imgs[10]},
        {id:'p66',name:'Pomegranate',category:'Fruit Plants',price:79,origPrice:102,bestSeller:false,image:imgs[11]},
        {id:'p67',name:'Papaya',category:'Fruit Plants',price:59,origPrice:76,bestSeller:false,image:imgs[10]},
        {id:'p68',name:'Banana',category:'Fruit Plants',price:149,origPrice:193,bestSeller:false,image:imgs[11]},
        {id:'p69',name:'Dragon Fruit',category:'Fruit Plants',price:99,origPrice:128,bestSeller:false,image:imgs[12]},
        {id:'p70',name:'Strawberry',category:'Fruit Plants',price:79,origPrice:102,bestSeller:false,image:imgs[10]},
        {id:'p71',name:'Grapes',category:'Fruit Plants',price:79,origPrice:102,bestSeller:false,image:imgs[12]},
        {id:'p72',name:'Fig',category:'Fruit Plants',price:499,origPrice:648,bestSeller:false,image:imgs[12]},
        {id:'p73',name:'Litchi',category:'Fruit Plants',price:499,origPrice:648,bestSeller:false,image:imgs[11]},
        {id:'p74',name:'Jackfruit',category:'Fruit Plants',price:599,origPrice:778,bestSeller:false,image:imgs[10]},
        {id:'p75',name:'Sapota/Chikoo',category:'Fruit Plants',price:299,origPrice:388,bestSeller:false,image:imgs[12]},
        {id:'p76',name:'Custard Apple',category:'Fruit Plants',price:79,origPrice:102,bestSeller:false,image:imgs[10]},
        {id:'p77',name:'Avocado',category:'Fruit Plants',price:99,origPrice:128,bestSeller:false,image:imgs[10]},
        {id:'p78',name:'Mulberry',category:'Fruit Plants',price:299,origPrice:388,bestSeller:false,image:imgs[10]},
        {id:'p79',name:'Amla',category:'Fruit Plants',price:249,origPrice:323,bestSeller:false,image:imgs[10]},
        {id:'p80',name:'Jamun',category:'Fruit Plants',price:299,origPrice:388,bestSeller:false,image:imgs[12]},
        {id:'p81',name:'Marigold',category:'Flower Seeds',price:49,origPrice:63,bestSeller:false,image:imgs[2]},
        {id:'p82',name:'Rose',category:'Flower Seeds',price:79,origPrice:102,bestSeller:false,image:imgs[0]},
        {id:'p83',name:'Hibiscus',category:'Flower Seeds',price:59,origPrice:76,bestSeller:false,image:imgs[0]},
        {id:'p84',name:'Petunia',category:'Flower Seeds',price:49,origPrice:63,bestSeller:false,image:imgs[5]},
        {id:'p85',name:'Zinnia',category:'Flower Seeds',price:49,origPrice:63,bestSeller:false,image:imgs[5]},
        {id:'p86',name:'Sunflower',category:'Flower Seeds',price:49,origPrice:63,bestSeller:false,image:imgs[1]},
        {id:'p87',name:'Cosmos',category:'Flower Seeds',price:39,origPrice:50,bestSeller:false,image:imgs[5]},
        {id:'p88',name:'Portulaca',category:'Flower Seeds',price:49,origPrice:63,bestSeller:false,image:imgs[5]},
        {id:'p89',name:'Snapdragon',category:'Flower Seeds',price:69,origPrice:89,bestSeller:false,image:imgs[2]},
        {id:'p90',name:'Calendula',category:'Flower Seeds',price:49,origPrice:63,bestSeller:false,image:imgs[0]},
        {id:'p91',name:'Aster',category:'Flower Seeds',price:49,origPrice:63,bestSeller:false,image:imgs[2]},
        {id:'p92',name:'Dahlia',category:'Flower Seeds',price:69,origPrice:89,bestSeller:false,image:imgs[0]},
        {id:'p93',name:'Celosia',category:'Flower Seeds',price:49,origPrice:63,bestSeller:false,image:imgs[5]},
        {id:'p94',name:'Dianthus',category:'Flower Seeds',price:59,origPrice:76,bestSeller:false,image:imgs[1]},
        {id:'p95',name:'Chrysanthemum',category:'Flower Seeds',price:59,origPrice:76,bestSeller:false,image:imgs[4]},
        {id:'p96',name:'Balsam',category:'Flower Seeds',price:39,origPrice:50,bestSeller:false,image:imgs[3]},
        {id:'p97',name:'Morning Glory',category:'Flower Seeds',price:49,origPrice:63,bestSeller:false,image:imgs[3]},
        {id:'p98',name:'Sweet Pea',category:'Flower Seeds',price:59,origPrice:76,bestSeller:false,image:imgs[2]},
        {id:'p99',name:'Nasturtium',category:'Flower Seeds',price:59,origPrice:76,bestSeller:false,image:imgs[2]},
        {id:'p100',name:'Gomphrena',category:'Flower Seeds',price:59,origPrice:76,bestSeller:false,image:imgs[2]},
        {id:'p101',name:'Tomato',category:'Vegetable Seeds',price:39,origPrice:50,bestSeller:false,image:imgs[15]},
        {id:'p102',name:'Cherry Tomato',category:'Vegetable Seeds',price:59,origPrice:76,bestSeller:false,image:imgs[14]},
        {id:'p103',name:'Brinjal',category:'Vegetable Seeds',price:39,origPrice:50,bestSeller:false,image:imgs[13]},
        {id:'p104',name:'Green Chilli',category:'Vegetable Seeds',price:39,origPrice:50,bestSeller:false,image:imgs[15]},
        {id:'p105',name:'Capsicum',category:'Vegetable Seeds',price:59,origPrice:76,bestSeller:false,image:imgs[13]},
        {id:'p106',name:'Okra/Lady Finger',category:'Vegetable Seeds',price:39,origPrice:50,bestSeller:false,image:imgs[13]},
        {id:'p107',name:'Cucumber',category:'Vegetable Seeds',price:39,origPrice:50,bestSeller:false,image:imgs[14]},
        {id:'p108',name:'Bottle Gourd',category:'Vegetable Seeds',price:39,origPrice:50,bestSeller:false,image:imgs[13]},
        {id:'p109',name:'Bitter Gourd',category:'Vegetable Seeds',price:49,origPrice:63,bestSeller:false,image:imgs[13]},
        {id:'p110',name:'Ridge Gourd',category:'Vegetable Seeds',price:39,origPrice:50,bestSeller:false,image:imgs[14]},
        {id:'p111',name:'Pumpkin',category:'Vegetable Seeds',price:39,origPrice:50,bestSeller:false,image:imgs[15]},
        {id:'p112',name:'Beans',category:'Vegetable Seeds',price:49,origPrice:63,bestSeller:false,image:imgs[15]},
        {id:'p113',name:'Peas',category:'Vegetable Seeds',price:49,origPrice:63,bestSeller:false,image:imgs[14]},
        {id:'p114',name:'Carrot',category:'Vegetable Seeds',price:39,origPrice:50,bestSeller:false,image:imgs[13]},
        {id:'p115',name:'Radish',category:'Vegetable Seeds',price:29,origPrice:37,bestSeller:false,image:imgs[13]},
        {id:'p116',name:'Beetroot',category:'Vegetable Seeds',price:39,origPrice:50,bestSeller:false,image:imgs[14]},
        {id:'p117',name:'Spinach',category:'Vegetable Seeds',price:29,origPrice:37,bestSeller:false,image:imgs[13]},
        {id:'p118',name:'Coriander',category:'Vegetable Seeds',price:29,origPrice:37,bestSeller:false,image:imgs[14]},
        {id:'p119',name:'Lettuce',category:'Vegetable Seeds',price:49,origPrice:63,bestSeller:false,image:imgs[15]},
        {id:'p120',name:'Cabbage',category:'Vegetable Seeds',price:39,origPrice:50,bestSeller:false,image:imgs[13]},
        {id:'p121',name:'Cauliflower',category:'Vegetable Seeds',price:39,origPrice:50,bestSeller:false,image:imgs[13]},
        {id:'p122',name:'Broccoli',category:'Vegetable Seeds',price:59,origPrice:76,bestSeller:false,image:imgs[14]},
        {id:'p123',name:'Onion',category:'Vegetable Seeds',price:29,origPrice:37,bestSeller:false,image:imgs[15]},
        {id:'p124',name:'Watermelon',category:'Fruit Seeds',price:49,origPrice:63,bestSeller:false,image:imgs[15]},
        {id:'p125',name:'Muskmelon',category:'Fruit Seeds',price:49,origPrice:63,bestSeller:false,image:imgs[14]},
        {id:'p126',name:'Papaya',category:'Fruit Seeds',price:59,origPrice:76,bestSeller:false,image:imgs[13]},
        {id:'p127',name:'Strawberry',category:'Fruit Seeds',price:79,origPrice:102,bestSeller:false,image:imgs[15]},
        {id:'p128',name:'Dragon Fruit',category:'Fruit Seeds',price:99,origPrice:128,bestSeller:false,image:imgs[14]},
        {id:'p129',name:'Passion Fruit',category:'Fruit Seeds',price:79,origPrice:102,bestSeller:false,image:imgs[13]},
        {id:'p130',name:'Guava',category:'Fruit Seeds',price:69,origPrice:89,bestSeller:false,image:imgs[13]},
        {id:'p131',name:'Pomegranate',category:'Fruit Seeds',price:79,origPrice:102,bestSeller:false,image:imgs[14]},
        {id:'p132',name:'Lemon',category:'Fruit Seeds',price:59,origPrice:76,bestSeller:false,image:imgs[15]},
        {id:'p133',name:'Orange',category:'Fruit Seeds',price:79,origPrice:102,bestSeller:false,image:imgs[14]},
        {id:'p134',name:'Custard Apple',category:'Fruit Seeds',price:79,origPrice:102,bestSeller:false,image:imgs[13]},
        {id:'p135',name:'Avocado',category:'Fruit Seeds',price:99,origPrice:128,bestSeller:false,image:imgs[15]},
        {id:'p136',name:'Grapes',category:'Fruit Seeds',price:79,origPrice:102,bestSeller:false,image:imgs[14]},
        {id:'p137',name:'Kiwi',category:'Fruit Seeds',price:129,origPrice:167,bestSeller:false,image:imgs[13]}
      ];
      await Product.insertMany(defaultProducts);
      console.log('🌱 Full catalog (' + defaultProducts.length + ' items) successfully seeded into MongoDB!');
    }
  } catch (err) {
    console.error('Error seeding products:', err);
  }
}

// --- 4. API ROUTES ---
app.get('/api/products', async (req, res) => { try { res.json(await Product.find()); } catch (err) { res.status(500).json({ success: false }); } });
app.post('/api/register', async (req, res) => { try { const { name, email, password } = req.body; const hashedPassword = await bcrypt.hash(password, 10); const newUser = new User({ name, email, password: hashedPassword }); await newUser.save(); res.json({ success: true, user: { name, email } }); } catch (err) { res.status(500).json({ success: false }); } });
app.post('/api/login', async (req, res) => { try { const { email, password } = req.body; const user = await User.findOne({ email }); if (!user || !(await bcrypt.compare(password, user.password))) return res.json({ success: false }); res.json({ success: true, user: { name: user.name, email: user.email } }); } catch (err) { res.status(500).json({ success: false }); } });
app.post('/api/orders', async (req, res) => { try { const newOrder = new Order(req.body); await newOrder.save(); res.json({ success: true }); } catch (err) { res.status(500).json({ success: false }); } });
app.get('/api/admin/orders', async (req, res) => { try { res.json(await Order.find().sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ success: false }); } });
app.post('/api/orders/cancel/:id', async (req, res) => { try { const order = await Order.findById(req.params.id); if ((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60) > 4) return res.json({ success: false, message: 'Expired.' }); order.status = 'Cancelled'; await order.save(); res.json({ success: true, message: 'Cancelled.' }); } catch (err) { res.status(500).json({ success: false }); } });

// --- 5. START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 MG Plants Backend running on port ${PORT}`));
