#!/usr/bin/env node
/*
Local migration script to push local store JSON into Supabase using the SERVICE ROLE key.
Usage:
  SUPABASE_URL=https://your.supabase.co SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/migrate-local-to-supabase.js /path/to/export.json

The export JSON should be an object with keys: pos_products (or products), pos_sales (or sales), pos_shipments (or shipments), pos_users (or users).
*/

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node migrate-local-to-supabase.js /path/to/export.json');
    process.exit(1);
  }
  const file = path.resolve(process.cwd(), args[0]);
  if (!fs.existsSync(file)) {
    console.error('File not found:', file);
    process.exit(1);
  }

  const raw = fs.readFileSync(file, 'utf8');
  let payload;
  try { payload = JSON.parse(raw); } catch (err) { console.error('Invalid JSON', err); process.exit(1); }

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment');
    process.exit(1);
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const productsInput = payload.products || payload.pos_products || [];
  const salesInput = payload.sales || payload.pos_sales || [];
  const shipmentsInput = payload.shipments || payload.pos_shipments || [];
  const usersInput = payload.users || payload.pos_users || [];

  try {
    // products
    const codes = Array.from(new Set(productsInput.map(p => p.code).filter(Boolean)));
    const codeToId = new Map();
    if (codes.length > 0) {
      const { data: existing, error: exErr } = await supabaseAdmin.from('products').select('id,code').in('code', codes);
      if (exErr) throw exErr;
      (existing || []).forEach(r => codeToId.set(r.code, r.id));
    }
    const toInsertProducts = (productsInput || []).filter(p => !codeToId.has(p.code)).map(p => ({
      code: p.code,
      name: p.name,
      category: p.category || 'Others',
      price: Number(p.price) || 0,
      cost_price: Number(p.cost_price || p.cost) || 0,
      image_url: p.image_url || null,
      stock: Number(p.stock) || 0,
      status: p.status || (Number(p.stock) > 0 ? 'Active' : 'Sold Out'),
      location: p.location || 'Main',
      created_at: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
    }));
    let insertedProducts = [];
    if (toInsertProducts.length > 0) {
      const { data: ins, error: insErr } = await supabaseAdmin.from('products').insert(toInsertProducts).select();
      if (insErr) throw insErr;
      insertedProducts = ins || [];
      insertedProducts.forEach(r => codeToId.set(r.code, r.id));
    }

    // users
    const usernames = Array.from(new Set((usersInput || []).map(u => u.username).filter(Boolean)));
    const existingUsers = usernames.length > 0 ? (await supabaseAdmin.from('local_users').select('username').in('username', usernames)).data || [] : [];
    const existingUsernames = new Set(existingUsers.map(u => u.username));
    const toInsertUsers = (usersInput || []).filter(u => !existingUsernames.has(u.username)).map(u => ({
      username: u.username,
      password_hash: u.password_hash || hashPassword(u.password || ''),
      role: u.role || 'salesperson',
      name: u.name || u.username,
      location: u.location || 'Main',
    }));
    let insertedUsers = [];
    if (toInsertUsers.length > 0) {
      const { data: uIns, error: uErr } = await supabaseAdmin.from('local_users').insert(toInsertUsers).select();
      if (uErr) throw uErr;
      insertedUsers = uIns || [];
    }

    // sales
    const salesToInsert = (salesInput || []).map(s => {
      const code = s.product_code || '';
      const pid = codeToId.get(code) || null;
      return pid ? {
        product_id: pid,
        product_name: s.product_name,
        product_code: code,
        quantity: Number(s.quantity) || 0,
        price_at_sale: Number(s.price_at_sale) || Number(s.price) || 0,
        discount: Number(s.discount) || 0,
        sold_at: s.sold_at ? new Date(s.sold_at).toISOString() : new Date().toISOString(),
        location: s.location || 'Main',
        sold_by: s.sold_by || 'Unknown',
      } : null;
    }).filter(Boolean);
    let insertedSales = [];
    if (salesToInsert.length > 0) {
      const { data: sIns, error: sErr } = await supabaseAdmin.from('sales').insert(salesToInsert).select();
      if (sErr) throw sErr;
      insertedSales = sIns || [];
    }

    // shipments
    const shipmentsToInsert = (shipmentsInput || []).map(sh => {
      const code = sh.product_code || '';
      const pid = codeToId.get(code) || null;
      return pid ? {
        product_id: pid,
        product_name: sh.product_name,
        product_code: code,
        quantity: Number(sh.quantity) || 0,
        from_location: sh.from_location || sh.from || 'Main',
        to_location: sh.to_location || sh.to || 'Main',
        status: sh.status || 'IN_TRANSIT',
        created_at: sh.created_at ? new Date(sh.created_at).toISOString() : new Date().toISOString(),
        received_at: sh.received_at ? new Date(sh.received_at).toISOString() : null,
      } : null;
    }).filter(Boolean);
    let insertedShipments = [];
    if (shipmentsToInsert.length > 0) {
      const { data: shIns, error: shErr } = await supabaseAdmin.from('shipments').insert(shipmentsToInsert).select();
      if (shErr) throw shErr;
      insertedShipments = shIns || [];
    }

    console.log('Migration complete:', { insertedProducts: insertedProducts.length, insertedUsers: insertedUsers.length, insertedSales: insertedSales.length, insertedShipments: insertedShipments.length });
  } catch (err) {
    console.error('Migration failed', err);
    process.exitCode = 2;
  }
}

main();
