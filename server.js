const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PRODUCTS = require('./products.json');
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

fs.mkdirSync(DATA_DIR, { recursive: true });
const readOrders = () => { try { return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8')); } catch { return []; } };
const writeOrders = o => fs.writeFileSync(ORDERS_FILE, JSON.stringify(o, null, 2));

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '50kb' }));

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.get('/api/products', (req, res) => {
  const { q = '', category, color } = req.query;
  res.json(PRODUCTS.filter(p =>
    (!category || p.cat === category) &&
    (!color || p.colors.includes(color)) &&
    p.name.toLowerCase().includes(String(q).toLowerCase())));
});

app.get('/api/products/:id', (req, res) => {
  const p = PRODUCTS.find(x => x.id === +req.params.id);
  p ? res.json(p) : res.status(404).json({ error: 'Product not found' });
});

const str = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

app.post('/api/orders', (req, res) => {
  const { customer, items } = req.body || {};
  const errors = [];
  if (!customer || !str(customer.name, 100)) errors.push('Name is required');
  if (!customer || !str(customer.email, 150) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email)) errors.push('A valid email is required');
  if (!customer || !str(customer.address, 300)) errors.push('Address is required');
  if (!Array.isArray(items) || !items.length || items.length > 50) errors.push('Cart is empty or too large');
  if (errors.length) return res.status(400).json({ errors });

  const lines = [];
  for (const i of items) {
    const p = PRODUCTS.find(x => x.id === i.id);
    const qty = Number.isInteger(i.qty) ? i.qty : 0;
    if (!p || !p.colors.includes(i.color) || !SIZES.includes(i.size) || qty < 1 || qty > 20)
      return res.status(400).json({ errors: ['Invalid item in cart'] });
    lines.push({ id: p.id, name: p.name, color: i.color, size: i.size, qty, unitPrice: p.price });
  }
  // Prices are always computed on the server, never trusted from the client.
  const subtotal = lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);
  const shipping = subtotal >= 50 ? 0 : 5;
  const order = {
    id: 'TL-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
    createdAt: new Date().toISOString(),
    customer: { name: customer.name.trim(), email: customer.email.trim(), address: customer.address.trim() },
    items: lines, subtotal, shipping, total: subtotal + shipping, status: 'received'
  };
  const orders = readOrders(); orders.push(order); writeOrders(orders);
  res.status(201).json({ id: order.id, total: order.total, shipping, subtotal });
});

app.use('/api', (_, res) => res.status(404).json({ error: 'Not found' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use((err, _req, res, _next) => { console.error(err); res.status(err.status || 500).json({ error: 'Server error' }); });

const PORT = process.env.PORT || 3000;
if (require.main === module) app.listen(PORT, () => console.log(`Threadline running on http://localhost:${PORT}`));
module.exports = app;
