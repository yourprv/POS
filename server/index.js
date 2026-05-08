import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config(); 

const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'pos-secret-key-2026';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase Credentials');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Hash password helper (same algorithm as frontend)
function hashPassword(password, salt = 'pos_salt_v1') {
  const s = `${password}|${salt}`;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let h2 = 0;
  for (let i = s.length - 1; i >= 0; i--) {
    h2 = ((h2 << 5) - h2) + s.charCodeAt(i);
    h2 |= 0;
  }
  const hex1 = (h >>> 0).toString(16).padStart(8, '0');
  const hex2 = ((h2 >>> 0) >>> 0).toString(16).padStart(8, '0');
  return hex1 + hex2;
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

// Helper to find product by ID or Code
async function findProduct(productIdOrCode) {
  const { data } = await supabaseAdmin.from('products').select('*').or(`id.eq.${productIdOrCode},code.eq.${productIdOrCode}`).limit(1);
  return (data && data[0]) || null;
}

// Auth Middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing token' });
  try {
    const token = auth.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// --- LOGIN & VERIFY ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('[LOGIN] Received:', { username, password });
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('local_users')
      .select('id, username, role, name, password_hash')
      .eq('username', username)
      .maybeSingle();

    console.log('[LOGIN] DB result:', { data, error });

    if (error || !data) {
      console.log('[LOGIN] No user found or DB error');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('[LOGIN] Comparing password_hash:', data.password_hash, 'with provided:', password);
    if (data.password_hash !== password) {
      console.log('[LOGIN] Password mismatch');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = {
      id: data.id,
      username: data.username,
      role: data.role,
      name: data.name,
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '12h' });
    console.log('[LOGIN] Success for user:', username);
    return res.json({ token, user });
  } catch (err) {
    console.error('[LOGIN] Exception:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/verify-role', async (req, res) => {
  const { role, password } = req.body;
  const { data } = await supabaseAdmin
    .from('local_users')
    .select('id, username, role, name, password_hash')
    .eq('role', role);
  const match = (data || []).find(u => u.password_hash === password);
  if (match) {
    const { password_hash, ...user } = match;
    return res.json({ ok: true, user });
  }
  res.status(401).json({ error: 'Invalid' });
});

// --- SALES LOGIC (RESTORED) ---
app.post('/api/record-sale', authMiddleware, async (req, res) => {
  const { productId, quantity, discount } = req.body;
  try {
    const product = await findProduct(productId);
    if (!product || product.stock < quantity) return res.status(400).json({ error: 'Stock issue' });

    const newStock = product.stock - quantity;
    await supabaseAdmin.from('products').update({ stock: newStock, status: newStock > 0 ? 'Active' : 'Sold Out' }).eq('id', product.id);

    const { data: sale } = await supabaseAdmin.from('sales').insert([{
      product_id: product.id,
      product_name: product.name,
      product_code: product.code,
      quantity,
      price_at_sale: product.price - (discount || 0),
      discount: discount || 0,
      sold_by: req.user.name || req.user.username,
      location: product.location,
      sold_at: new Date().toISOString()
    }]).select().single();

    // Update revenue tracking
    const today = new Date().toISOString().split('T')[0];
    const saleAmount = (product.price - (discount || 0)) * quantity;
    
    // Get current daily revenue record
    const { data: currentDayRevenue } = await supabaseAdmin
      .from('daily_revenue')
      .select('*')
      .eq('date', today)
      .single();
    
    // Get previous total revenue (before today)
    const { data: previousTotal } = await supabaseAdmin
      .from('daily_revenue')
      .select('total_revenue')
      .lt('date', today)
      .order('date', { ascending: false })
      .limit(1);
    
    const previousTotalRevenue = previousTotal?.[0]?.total_revenue || 0;
    const currentTodayRevenue = currentDayRevenue?.today_revenue || 0;
    const currentItemsSold = currentDayRevenue?.items_sold || 0;
    
    // Upsert daily revenue record with accumulated values
    await supabaseAdmin.from('daily_revenue').upsert({
      date: today,
      today_revenue: currentTodayRevenue + saleAmount,
      total_revenue: previousTotalRevenue + currentTodayRevenue + saleAmount,
      items_sold: currentItemsSold + quantity,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'date',
      ignoreDuplicates: false
    });

    res.json(sale);
  } catch (err) { res.status(500).send(err.message); }
});

// --- SHIPMENT LOGIC (RESTORED) ---
app.post('/api/create-shipment', authMiddleware, async (req, res) => {
  const { productId, quantity, from_location, to_location } = req.body;
  const product = await findProduct(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const { data, error } = await supabaseAdmin.from('shipments').insert([{
    product_id: product.id, product_name: product.name, product_code: product.code,
    quantity, from_location, to_location, status: 'IN_TRANSIT', created_at: new Date().toISOString()
  }]).select().single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/receive-shipment', authMiddleware, async (req, res) => {
  const { shipmentId } = req.body;
  const { data: shipment } = await supabaseAdmin.from('shipments').select('*').eq('id', shipmentId).single();

  if (shipment && shipment.status !== 'RECEIVED') {
    // 1. Mark shipment as received
    await supabaseAdmin.from('shipments').update({ status: 'RECEIVED', received_at: new Date().toISOString() }).eq('id', shipmentId);

    // 2. Update the actual Product stock only (keep location unchanged so product stays visible)
    const product = await findProduct(shipment.product_id);
    if (product) {
      const newStock = Number(product.stock) + Number(shipment.quantity);
      await supabaseAdmin.from('products').update({
        stock: newStock,
        status: 'Active'
        // Note: location is NOT updated - product stays at original location for visibility
      }).eq('id', product.id);
    }
    return res.json({ ok: true });
  }
  res.status(400).json({ error: 'Cannot receive' });
});

// --- REVENUE TRACKING ---
app.get('/api/revenue', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data: todayData } = await supabaseAdmin
      .from('daily_revenue')
      .select('*')
      .eq('date', today)
      .single();
    
    const { data: allRevenue } = await supabaseAdmin
      .from('daily_revenue')
      .select('total_revenue')
      .order('date', { ascending: false })
      .limit(1);
    
    res.json({
      todayRevenue: todayData?.today_revenue || 0,
      totalRevenue: allRevenue?.[0]?.total_revenue || 0,
      todayItemsSold: todayData?.items_sold || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/revenue/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { data } = await supabaseAdmin
      .from('daily_revenue')
      .select('*')
      .eq('date', date)
      .single();
    
    res.json(data || { date, today_revenue: 0, total_revenue: 0, items_sold: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PRODUCT MANAGEMENT ---
app.post('/api/create-product', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Admin required');
  const { data, error } = await supabaseAdmin.from('products').insert([req.body]).select().single();
  error ? res.status(500).json(error) : res.json(data);
});

app.post('/api/delete-product', authMiddleware, async (req, res) => {
  await supabaseAdmin.from('products').delete().eq('id', req.body.productId);
  res.json({ ok: true });
});

app.post('/api/update-product', authMiddleware, async (req, res) => {
  const { productId, data } = req.body;
  if (!productId) return res.status(400).json({ error: 'Product ID required' });

  // Check if this is a restock operation (only stock field is being updated)
  const isRestock = Object.keys(data).length === 1 && 'stock' in data;

  // Allow restock for both admin and salesperson, require admin for other updates
  if (!isRestock && req.user.role !== 'admin') {
    return res.status(403).send('Admin required');
  }

  // Ensure only admin can modify sensitive fields
  if (req.user.role !== 'admin') {
    const allowedFields = ['stock'];
    const disallowedFields = Object.keys(data).filter(k => !allowedFields.includes(k));
    if (disallowedFields.length > 0) {
      return res.status(403).send('Can only update stock');
    }
  }

  // Update stock and status together
  const updateData = { ...data };
  if ('stock' in updateData) {
    updateData.status = updateData.stock > 0 ? 'Active' : 'Sold Out';
  }

  const { data: updated, error } = await supabaseAdmin.from('products').update(updateData).eq('id', productId).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(updated);
});

app.post('/api/adjust-inventory', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Admin required');
  const { productId, quantity } = req.body;
  if (!productId || typeof quantity !== 'number') return res.status(400).json({ error: 'Product ID and quantity required' });
  
  const product = await findProduct(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  
  const newStock = product.stock + quantity;
  const { data: updated, error } = await supabaseAdmin.from('products').update({
    stock: newStock,
    status: newStock > 0 ? 'Active' : 'Sold Out'
  }).eq('id', product.id).select().single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(updated);
});

app.listen(PORT, () => console.log(`Engine running on ${PORT}`));