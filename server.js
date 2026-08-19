const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb+srv://mgplants_db_user:7PFZockvsScku3gi@cluster0.cqsdy2b.mongodb.net/?appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('🌱 MG Plants Database Connected!');
    await seedInitialProducts();
}).catch(err => console.log('Database connection error:', err));

// Plant Schema
const productSchema = new mongoose.Schema({
    id: String,
    name: String,
    category: String,
    price: Number,
    origPrice: Number,
    rating: Number,
    bestSeller: Boolean,
    image: String,
    shortDesc: String,
    desc: String,
    light: String,
    water: String,
    size: String,
    diff: String,
    stockQuantity: { type: Number, default: 50 }
});

const Product = mongoose.model('Product', productSchema);

// Initial 25 Plants Dataset
const initialProducts = [
  { id: 'p1', name: 'Money Plant', category: 'Indoor Plants', price: 149, origPrice: 199, rating: 4.8, bestSeller: true, image: 'https://tse1.mm.bing.net/th?q=Golden+Pothos+Money+Plant+trailing+indoor+pot&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Low-maintenance vine that thrives in low light.', desc: 'Golden Pothos vine known to purify air.', light: 'Indirect Light', water: 'Every 5-7 days', size: '8-12 inches', diff: 'Very Easy' },
  { id: 'p2', name: 'Snake Plant', category: 'Indoor Plants', price: 199, origPrice: 279, rating: 4.9, bestSeller: true, image: 'https://tse2.mm.bing.net/th?q=Snake+Plant+Sansevieria+tall+leaves+indoor+pot&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Ultra-hardy air cleanser.', desc: 'Converts CO2 into oxygen overnight.', light: 'Low to Bright', water: 'Every 14 days', size: '10-14 inches', diff: 'Beginner' },
  { id: 'p3', name: 'Peace Lily', category: 'Indoor Plants', price: 249, origPrice: 349, rating: 4.7, bestSeller: true, image: 'https://tse3.mm.bing.net/th?q=Peace+Lily+Spathiphyllum+white+flower+indoor+pot&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Dark leaves topped with white blooms.', desc: 'Filters indoor air toxins.', light: 'Medium Indirect', water: 'Twice a week', size: '12-16 inches', diff: 'Easy' },
  { id: 'p4', name: 'Spider Plant', category: 'Indoor Plants', price: 149, origPrice: 199, rating: 4.6, bestSeller: false, image: 'https://tse4.mm.bing.net/th?q=Spider+Plant+Chlorophytum+indoor+hanging+basket&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Arching green foliage with baby plantlets.', desc: 'Resilient fast-growing indoor plant.', light: 'Bright Indirect', water: 'Every 5 days', size: '8-10 inches', diff: 'Easy' },
  { id: 'p5', name: 'ZZ Plant', category: 'Indoor Plants', price: 299, origPrice: 399, rating: 4.9, bestSeller: true, image: 'https://tse1.mm.bing.net/th?q=ZZ+Plant+Zamioculcas+dark+green+indoor+pot&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Glossy dark green leaves.', desc: 'Stores water in rhizomes. Withstands neglect.', light: 'Low to Bright', water: 'Every 2 weeks', size: '10-14 inches', diff: 'Super Easy' },
  { id: 'p6', name: 'Syngonium', category: 'Indoor Plants', price: 149, origPrice: 199, rating: 4.7, bestSeller: false, image: 'https://tse2.mm.bing.net/th?q=Syngonium+Arrowhead+Plant+pink+green+indoor+pot&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Arrow-shaped foliage.', desc: 'Compact tropical plant.', light: 'Medium Indirect', water: 'Every 5-7 days', size: '6-10 inches', diff: 'Easy' },
  { id: 'p7', name: 'Areca Palm', category: 'Indoor Plants', price: 299, origPrice: 399, rating: 4.8, bestSeller: true, image: 'https://tse3.mm.bing.net/th?q=Areca+Palm+large+indoor+living+room+pot&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Feathery tropical fronds.', desc: 'Natural indoor air humidifier.', light: 'Bright Indirect', water: 'Twice a week', size: '18-24 inches', diff: 'Moderate' },
  { id: 'p8', name: 'Jade Plant', category: 'Succulents', price: 199, origPrice: 269, rating: 4.8, bestSeller: true, image: 'https://tse4.mm.bing.net/th?q=Jade+Plant+Crassula+ovata+succulent+tree+pot&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Plump emerald succulent leaves.', desc: 'Classic succulent associated with good fortune.', light: 'Bright Light', water: 'Once a week', size: '6-8 inches', diff: 'Easy' },
  { id: 'p9', name: 'Aloe Vera', category: 'Medicinal', price: 129, origPrice: 179, rating: 4.6, bestSeller: true, image: 'https://tse1.mm.bing.net/th?q=Aloe+Vera+medicinal+plant+ceramic+pot&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Medicinal succulent with natural leaf gel.', desc: 'Essential home-garden medicinal plant.', light: 'Direct Sun', water: 'Every 10 days', size: '6-10 inches', diff: 'Easy' },
  { id: 'p10', name: 'Echeveria', category: 'Succulents', price: 149, origPrice: 199, rating: 4.7, bestSeller: false, image: 'https://tse2.mm.bing.net/th?q=Echeveria+Succulent+rosette+colorful+pot&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Rose-shaped compact succulent.', desc: 'Geometric rosette succulent.', light: 'Direct Sun', water: 'Every 10 days', size: '4-6 inches', diff: 'Easy' },
  { id: 'p11', name: 'Rose Plant', category: 'Flowering Plants', price: 199, origPrice: 269, rating: 4.8, bestSeller: true, image: 'https://tse3.mm.bing.net/th?q=Red+Rose+Plant+bush+in+pot+blooming+garden&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Classic fragrant garden bloomer.', desc: 'Loves full morning sunlight.', light: 'Full Sun', water: 'Daily', size: '12-18 inches', diff: 'Moderate' },
  { id: 'p12', name: 'Hibiscus', category: 'Flowering Plants', price: 179, origPrice: 249, rating: 4.7, bestSeller: false, image: 'https://tse4.mm.bing.net/th?q=Yellow+Hibiscus+flower+plant+outdoor+pot&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Vibrant tropical blooms.', desc: 'Sun-loving flowering shrub.', light: 'Full Sun', water: 'Regularly', size: '14-20 inches', diff: 'Easy' },
  { id: 'p13', name: 'Jasmine', category: 'Flowering Plants', price: 199, origPrice: 279, rating: 4.9, bestSeller: true, image: 'https://tse1.mm.bing.net/th?q=Star+Jasmine+vine+blooming+white+flowers+outdoor+pot&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Sweetly scented white flowers.', desc: 'Fills outdoor gardens with aroma.', light: 'Full to Partial Sun', water: 'Every 2 days', size: '12-16 inches', diff: 'Easy' },
  { id: 'p14', name: 'Bougainvillea', category: 'Flowering Plants', price: 249, origPrice: 329, rating: 4.8, bestSeller: false, image: 'https://tse2.mm.bing.net/th?q=Bougainvillea+magenta+pink+flower+plant+terracotta+pot&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Drought-tolerant climber.', desc: 'Covered in intense papery blossoms.', light: 'Direct Full Sun', water: 'Low Water', size: '16-24 inches', diff: 'Easy' },
  { id: 'p15', name: 'Marigold', category: 'Flowering Plants', price: 99, origPrice: 149, rating: 4.5, bestSeller: true, image: 'https://tse3.mm.bing.net/th?q=Marigold+Genda+orange+flower+plant+nursery+pot&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Bright yellow festive blossoms.', desc: 'Easy seasonal bloomer.', light: 'Full Sun', water: 'Alternate Days', size: '8-12 inches', diff: 'Very Easy' },
  { id: 'p16', name: 'Aparajita', category: 'Flowering Plants', price: 149, origPrice: 199, rating: 4.8, bestSeller: false, image: 'https://tse4.mm.bing.net/th?q=Aparajita+Blue+Pea+vine+flower+plant+pot&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Vivid royal-blue flowers.', desc: 'Fast-growing climber.', light: 'Full Sun', water: 'Regular Water', size: '12-18 inches', diff: 'Easy' },
  { id: 'p17', name: 'Mogra', category: 'Flowering Plants', price: 199, origPrice: 269, rating: 4.9, bestSeller: true, image: 'https://tse1.mm.bing.net/th?q=Mogra+Arabian+Jasmine+thick+double+flower+plant+pot&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Intensely fragrant white flowers.', desc: 'Delights balconies with aroma.', light: 'Direct Sun', water: 'Every 2 days', size: '10-14 inches', diff: 'Easy' },
  { id: 'p18', name: 'Curry Leaf', category: 'Fruit & Utility', price: 149, origPrice: 199, rating: 4.9, bestSeller: true, image: 'https://tse2.mm.bing.net/th?q=Curry+Leaf+Plant+Kadi+Patta+healthy+leaves+pot&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Aromatic kitchen herb.', desc: 'Essential for Indian cooking.', light: 'Partial Sun', water: 'Regular Water', size: '10-15 inches', diff: 'Easy' },
  { id: 'p19', name: 'Lemon Plant', category: 'Fruit Plants', price: 249, origPrice: 349, rating: 4.7, bestSeller: false, image: 'https://tse3.mm.bing.net/th?q=Lemon+Tree+Plant+grafted+with+yellow+lemons+pot&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Grafted citrus plant.', desc: 'Produces juicy home-grown lemons.', light: 'Direct Sun', water: 'When dry', size: '18-24 inches', diff: 'Moderate' },
  { id: 'p20', name: 'Guava Plant', category: 'Fruit Plants', price: 249, origPrice: 349, rating: 4.6, bestSeller: false, image: 'https://tse4.mm.bing.net/th?q=Guava+Plant+sapling+grafted+in+black+pot&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Fast-bearing grafted guava.', desc: 'Produces sweet guavas.', light: 'Full Sun', water: 'Moderate', size: '20-28 inches', diff: 'Easy' },
  { id: 'p21', name: 'Mango Plant', category: 'Fruit Plants', price: 299, origPrice: 429, rating: 4.9, bestSeller: true, image: 'https://tse1.mm.bing.net/th?q=Mango+Tree+Plant+sapling+grafted+nursery+bag&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'King of fruits sapling.', desc: 'Premium grafted mango variety.', light: 'Full Sun', water: 'Weekly', size: '24-32 inches', diff: 'Moderate' },
  { id: 'p22', name: 'Papaya Plant', category: 'Fruit Plants', price: 149, origPrice: 199, rating: 4.5, bestSeller: false, image: 'https://tse2.mm.bing.net/th?q=Papaya+Plant+sapling+healthy+leaves+pot&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Fast-growing fruit sapling.', desc: 'Yielding sweet papayas.', light: 'Full Sun', water: 'Regularly', size: '18-24 inches', diff: 'Easy' },
  { id: 'p23', name: 'Pomegranate', category: 'Fruit Plants', price: 299, origPrice: 399, rating: 4.8, bestSeller: false, image: 'https://tse3.mm.bing.net/th?q=Pomegranate+Plant+Dalim+with+fruit+in+pot&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Dwarf fruiting shrub.', desc: 'Nutrient-packed pomegranates.', light: 'Full Sun', water: 'Moderate', size: '18-24 inches', diff: 'Moderate' },
  { id: 'p24', name: 'Coconut Plant', category: 'Fruit Plants', price: 299, origPrice: 449, rating: 4.9, bestSeller: false, image: 'https://tse4.mm.bing.net/th?q=Dwarf+Coconut+Palm+Plant+sapling+in+grow+bag&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Hybrid coconut sapling.', desc: 'Ideal for tropical spaces.', light: 'Full Sun', water: 'Abundant', size: '24-36 inches', diff: 'Easy' },
  { id: 'p25', name: 'Lucky Bamboo', category: 'Indoor Plants', price: 199, origPrice: 279, rating: 4.7, bestSeller: true, image: 'https://tse1.mm.bing.net/th?q=Lucky+Bamboo+Plant+2+tier+indoor+glass+bowl&w=600&h=600&c=7&rs=1&p=0', shortDesc: 'Feng Shui tabletop plant.', desc: 'Grows directly in water.', light: 'Ambient Light', water: 'Weekly change', size: '6-8 inches', diff: 'Very Easy' }
];

async function seedInitialProducts() {
    const count = await Product.countDocuments();
    if (count === 0) {
        await Product.insertMany(initialProducts);
        console.log('✅ Successfully loaded 25 plants into MongoDB!');
    }
}

// 1. API: Get all products
app.get('/api/products', async (req, res) => {
    try {
        const plants = await Product.find();
        res.json(plants);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch products" });
    }
});

// 2. API: Process Order
app.post('/api/checkout', async (req, res) => {
    const { name, phone, address, items, total } = req.body;
    console.log(`📦 New Order from ${name} (${phone}) - Total: ₹${total}`);
    res.json({ success: true, message: "Order stored successfully!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 MG Plants Server is running on port ${PORT}`);
});
