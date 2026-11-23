import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
const port = process.env.PORT || 3001;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nuvora';

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

const productSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  color: String,
  image: String,
  tag: String
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  items: [{
    id: Number,
    name: String,
    price: Number,
    qty: { type: Number, min: 1 }
  }],
  subtotal: { type: Number, required: true },
  status: { type: String, default: 'confirmed' }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

const seedProducts = [
  { id: 1, name: 'Textured Knit Polo', category: 'Apparel', price: 89, color: '#c9a889', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85', tag: 'Bestseller' },
  { id: 2, name: 'Studio Leather Tote', category: 'Accessories', price: 148, color: '#9f8064', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85', tag: 'New' },
  { id: 3, name: 'Relaxed Cotton Shirt', category: 'Apparel', price: 72, color: '#b8bdc2', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=85' },
  { id: 4, name: 'Arc Table Lamp', category: 'Living', price: 124, color: '#d2bfa3', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85', tag: 'Limited' },
  { id: 5, name: 'Everyday Sunglasses', category: 'Accessories', price: 96, color: '#6d624f', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=85' },
  { id: 6, name: 'Essential Linen Trouser', category: 'Apparel', price: 110, color: '#c7bca9', image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=900&q=85' },
  { id: 7, name: 'Stoneware Mug Set', category: 'Living', price: 58, color: '#afa99d', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85' },
  { id: 8, name: 'Suede Court Sneaker', category: 'Footwear', price: 135, color: '#b6a389', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85', tag: 'New' }
];

async function seedDatabase() {
  if (await Product.countDocuments() === 0) {
    await Product.insertMany(seedProducts);
    console.log('Seeded 8 demo products');
  }
}

app.get('/api/health', async (_req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.get('/api/products', async (req, res, next) => {
  try {
    const { category, search, sort } = req.query;
    const query = {};
    if (category && category !== 'All') query.category = category;
    if (search) query.name = { $regex: String(search), $options: 'i' };

    let mongoSort = {};
    if (sort === 'Price: Low') mongoSort = { price: 1 };
    if (sort === 'Price: High') mongoSort = { price: -1 };
    if (sort === 'Newest') mongoSort = { tag: -1 };

    const products = await Product.find(query).sort(mongoSort);
    res.json(products);
  } catch (error) { next(error); }
});

app.get('/api/products/:id', async (req, res, next) => {
  try {
    const product = await Product.findOne({ id: Number(req.params.id) });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) { next(error); }
});

app.post('/api/orders', async (req, res, next) => {
  try {
    const { email, address, city, postalCode, items } = req.body;
    if (!email || !address || !city || !postalCode || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Complete shipping details and cart items are required' });
    }

    const normalizedItems = [];
    for (const item of items) {
      const product = await Product.findOne({ id: Number(item.id) });
      if (!product) return res.status(400).json({ error: `Invalid product: ${item.id}` });
      normalizedItems.push({ id: product.id, name: product.name, price: product.price, qty: Math.max(1, Number(item.qty) || 1) });
    }

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const order = await Order.create({
      orderId: `NV-${Date.now()}`, email, address, city, postalCode,
      items: normalizedItems, subtotal, status: 'confirmed'
    });
    res.status(201).json(order);
  } catch (error) { next(error); }
});

app.get('/api/orders', async (_req, res, next) => {
  try { res.json(await Order.find().sort({ createdAt: -1 })); } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Database or server error' });
});

async function start() {
  try {
    await mongoose.connect(mongoUri);
    await seedDatabase();
    app.listen(port, () => console.log(`Nuvora API running at http://localhost:${port}`));
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.error('Set MONGODB_URI or start MongoDB locally on mongodb://127.0.0.1:27017');
    process.exit(1);
  }
}

start();
