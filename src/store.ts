import { Product, Sale, Shipment, User, Category, Location, UserRole } from './types';
import supabase from './lib/supabase';

// In-memory caches — primary runtime source. Persistent storage is Supabase (remote).
let productsCache: Product[] = [];
let salesCache: Sale[] = [];
let shipmentsCache: Shipment[] = [];
let usersCache: User[] = [];
let currentUserCache: User | null = null;

// In-memory tokens/counters (no localStorage usage per integration requirement)
let backendTokenCache: string | null = null;
let codeCounter = 0;

const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || (import.meta.env.VITE_APP_BACKEND_URL as string) || '';

async function backendPost(path: string, body: any, requireAuth = true) {
  if (!BACKEND) throw new Error('Backend not configured');
  const url = `${BACKEND.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (requireAuth) {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated (missing backend token)');
    headers.Authorization = `Bearer ${token}`;
  }
  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(json?.error || `backend request failed: ${resp.status}`);
  return json;
}


function hashPassword(password: string, salt = 'pos_salt_v1'): string {
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

// Initialize caches. If remote persistence is configured, start a background fetch.
export function initializeStore(): void {
  const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || (import.meta.env.VITE_SUPABASE_ANON as string);
  const BACKEND = (import.meta.env.VITE_BACKEND_URL as string) || (import.meta.env.VITE_APP_BACKEND_URL as string);

  if (anon || BACKEND) {
    // Remote is available — populate caches asynchronously.
    // Do not block application startup.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchRemoteAll();
    return;
  }

  // Local fallback: seed in-memory users and minimal defaults (keeps behavior for dev/offline).
  const rawUsers = [
    { id: 'u_admin', username: 'admin', password: 'RBC123@2468', role: 'admin', name: 'Admin', location: 'Main' },
    { id: 'u_sales', username: 'sales', password: 'sales123', role: 'salesperson', name: 'Sales', location: 'Main' },
  ];

  usersCache = rawUsers.map(u => ({ id: u.id, username: u.username, password: hashPassword(u.password), role: u.role as UserRole, name: u.name, location: u.location }));
  productsCache = [];
  salesCache = [];
  shipmentsCache = [];

  // initialize in-memory counter
  codeCounter = 0;
}

// Fetch all tables from Supabase and populate caches. Safe to call repeatedly.
export async function fetchRemoteAll(): Promise<void> {
  const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || (import.meta.env.VITE_SUPABASE_ANON as string);
  if (!anon) return;

  try {
    const { data: prods, error: prodErr } = await supabase.from('products').select('*');
    if (!prodErr && prods) {
      console.log('fetchRemoteAll - Raw products from Supabase:', prods);
      productsCache = (prods as any[]).map(p => {
        const processed = {
          id: p.id,
          code: p.code,
          name: p.name,
          category: p.category,
          price: Number(p.price) || 0,
          cost_price: Number(p.cost_price) || 0,
          image_url: p.image_url || '',
          stock: Number(p.stock) || 0,
          status: p.status || (Number(p.stock) > 0 ? 'Active' : 'Sold Out'),
          location: p.location || 'Main',
          created_at: p.created_at || new Date().toISOString(),
        };
        console.log('fetchRemoteAll - Processed product image_url:', processed.image_url, 'Type:', typeof processed.image_url);
        return processed;
      });
      console.log('fetchRemoteAll - Final productsCache:', productsCache);
    } else if (prodErr) {
      // eslint-disable-next-line no-console
      console.warn('fetchRemoteAll products error', prodErr);
    }

    const { data: sData, error: sErr } = await supabase.from('sales').select('*');
    if (!sErr && sData) {
      salesCache = (sData as any[]).map(s => ({
        id: s.id,
        product_id: s.product_id,
        product_name: s.product_name,
        product_code: s.product_code,
        quantity: Number(s.quantity) || 0,
        price_at_sale: Number(s.price_at_sale) || 0,
        discount: Number(s.discount) || 0,
        sold_at: s.sold_at,
        location: s.location,
        sold_by: s.sold_by,
      }));
    } else if (sErr) {
      // eslint-disable-next-line no-console
      console.warn('fetchRemoteAll sales error', sErr);
    }

    const { data: shData, error: shErr } = await supabase.from('shipments').select('*');
    if (!shErr && shData) {
      shipmentsCache = (shData as any[]).map(sh => ({
        id: sh.id,
        product_id: sh.product_id,
        product_name: sh.product_name,
        product_code: sh.product_code,
        quantity: Number(sh.quantity) || 0,
        from_location: sh.from_location,
        to_location: sh.to_location,
        status: sh.status,
        created_at: sh.created_at,
        received_at: sh.received_at || null,
      }));
    } else if (shErr) {
      // eslint-disable-next-line no-console
      console.warn('fetchRemoteAll shipments error', shErr);
    }

    // Attempt to fetch local_users (may be blocked by RLS for anon)
    try {
      const { data: uData, error: uErr } = await supabase.from('local_users').select('*');
      if (!uErr && uData) {
        usersCache = (uData as any[]).map(u => ({ id: u.id, username: u.username, password: '', role: u.role, name: u.name, location: u.location }));
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('fetchRemoteAll users error', err);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('fetchRemoteAll failed', err);
  }
}

// Auth
export async function login(username: string, password: string): Promise<User | null> {
  // Prefer backend login (returns JWT) when backend is configured
  if (BACKEND) {
    try {
      const json = await backendPost('/api/login', { username, password }, false);
      if (json && json.token) {
        backendTokenCache = json.token;
        const u = json.user as any;
        const user: User = { id: u.id, username: u.username, password: '', role: u.role, name: u.name, location: u.location };
        setCurrentUser(user);
        // populate caches after auth
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        fetchRemoteAll();
        return user;
      }
      return null;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('backend login failed, falling back to remote/local login', err);
    }
  }

  // Fallback: authenticate against Supabase local_users table (plain text)
  try {
    const { data, error } = await supabase.from('local_users').select('*').eq('username', username).limit(1).maybeSingle();
    if (!error && data) {
      const u: any = data;
      if (password === (u.password_hash || u.password)) {
        const user: User = { id: u.id, username: u.username, password: '', role: u.role, name: u.name, location: u.location };
        setCurrentUser(user);
        return user;
      }
    }
    return null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('supabase local_users login failed', err);
    return null;
  }
}

export async function verifyPasswordForRole(role: string, password: string): Promise<User | null> {
  // Prefer backend verification when available
  if (BACKEND) {
    try {
      const json = await backendPost('/api/verify-role', { role, password }, false);
      if (json && json.ok && json.user) {
        const u = json.user as any;
        return { id: u.id, username: u.username, password: '', role: u.role, name: u.name, location: u.location } as User;
      }
      return null;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('verify-role via backend failed', err);
    }
  }

  try {
    const { data, error } = await supabase.from('local_users').select('*').eq('role', role);
    if (error) return null;
    const hashed = hashPassword(password);
    for (const u of (data || []) as any[]) {
      if ((u.password_hash && u.password_hash === hashed) || (u.password && (u.password === password || u.password === hashed))) {
        return { id: u.id, username: u.username, password: '', role: u.role, name: u.name, location: u.location } as User;
      }
    }
    return null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('verifyPasswordForRole failed', err);
    return null;
  }
}

export function getAuthToken(): string | null {
  return backendTokenCache;
}

export function clearAuthToken(): void {
  backendTokenCache = null;
}

export function setCurrentUser(user: User | null): void {
  currentUserCache = user;
  // ephemeral only (no localStorage)
}

export function getCurrentUser(): User | null {
  return currentUserCache;
}

// Users
export function getUsers(): User[] {
  return usersCache.slice();
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const idx = usersCache.findIndex(u => u.id === userId);
  if (idx !== -1) {
    usersCache[idx].password = hashPassword(newPassword);
  }
}

// Products
export function getProducts(): Product[] {
  return productsCache.slice();
}

export function getProductById(id: string): Product | undefined {
  return productsCache.find(p => p.id === id);
}

export function searchProductByCode(code: string): Product | undefined {
  return productsCache.find(p => p.code === code);
}

async function getNextCode(): Promise<string> {
  const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || (import.meta.env.VITE_SUPABASE_ANON as string);
  if (anon) {
    try {
      const { data } = await supabase.from('products').select('code');
      const nums = (data || []).map((p: any) => parseInt(p.code, 10)).filter((n: number) => !Number.isNaN(n));
      let next = nums.length ? Math.max(...nums) + 1 : 1;
      for (let i = 0; i < 10000; i++) {
        const candidate = next.toString().padStart(4, '0');
        try {
          const { data: existing } = await supabase.from('products').select('id').eq('code', candidate).limit(1);
          if (!existing || (existing as any[]).length === 0) return candidate;
        } catch (err) {
          // if remote check fails, break and fallback to local counter
          // eslint-disable-next-line no-console
          console.warn('supabase check for generated code failed', err);
          break;
        }
        next++;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('getNextCode remote failed', err);
    }
  }

  // Fallback to in-memory counter (no localStorage)
  codeCounter = codeCounter + 1;
  return codeCounter.toString().padStart(4, '0');
}

export async function addProduct(data: { name: string; category: Category; price: number; image_url: string; stock: number; location: Location; cost_price?: number; code?: string }): Promise<Product> {
  const provided = data.code && data.code.trim() ? data.code.trim() : undefined;
  const productCode = provided || await getNextCode();

  // Debug logging for image_url
  console.log('addProduct - Raw image_url:', data.image_url);
  console.log('addProduct - Type of image_url:', typeof data.image_url);
  console.log('addProduct - image_url after trim:', data.image_url?.trim());

  if (!BACKEND) throw new Error('Backend not configured — cannot create product');

  // ensure admin auth/token
  if (!getAuthToken() || getCurrentUser()?.role !== 'admin') {
    const adminPwd = typeof window !== 'undefined' ? window.prompt('Enter admin password to add product') : null;
    if (!adminPwd) throw new Error('admin authentication required');
    const adminUser = await verifyPasswordForRole('admin', adminPwd);
    if (!adminUser) throw new Error('invalid admin password');
    const logged = await login(adminUser.username, adminPwd);
    if (!logged) throw new Error('admin login failed');
  }

  const toInsert = {
    code: productCode,
    name: data.name,
    category: data.category,
    price: data.price,
    cost_price: data.cost_price || 0,
    image_url: String(data.image_url || '').trim() || null,
    stock: data.stock,
    status: data.stock > 0 ? 'Active' : 'Sold Out',
    location: data.location,
    created_at: new Date().toISOString(),
  } as any;
  
  console.log('addProduct - toInsert object:', toInsert);
  console.log('addProduct - toInsert.image_url type:', typeof toInsert.image_url);

  const created = await backendPost('/api/create-product', toInsert, true);
  console.log('addProduct - Backend response:', created);
  console.log('addProduct - Backend response image_url:', created.image_url, 'Type:', typeof created.image_url);
  
  await fetchRemoteAll();
  return created as Product;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  if (!BACKEND) throw new Error('Backend not configured — cannot update product');

  const currentUser = getCurrentUser();
  const token = getAuthToken();

  // Check if this is a restock operation (only stock field is being updated)
  const isRestock = Object.keys(data).length === 1 && 'stock' in data;

  // Allow restock for both admin and salesperson, but require admin for other updates
  if (isRestock) {
    // Restock: allow admin or salesperson with valid token
    if (!token || !currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'salesperson')) {
      throw new Error('authentication required to restock');
    }
  } else {
    // Other product updates: require admin only
    if (!token || currentUser?.role !== 'admin') {
      const adminPwd = typeof window !== 'undefined' ? window.prompt('Enter admin password to update product') : null;
      if (!adminPwd) throw new Error('admin authentication required');
      const adminUser = await verifyPasswordForRole('admin', adminPwd);
      if (!adminUser) throw new Error('invalid admin password');
      const logged = await login(adminUser.username, adminPwd);
      if (!logged) throw new Error('admin login failed');
    }
  }

  await backendPost('/api/update-product', { productId: id, data }, true);

  await fetchRemoteAll();
}

export async function deleteProduct(id: string): Promise<void> {
  if (!BACKEND) throw new Error('Backend not configured — cannot delete product');
  if (!getAuthToken() || getCurrentUser()?.role !== 'admin') {
    const adminPwd = typeof window !== 'undefined' ? window.prompt('Enter admin password to delete product') : null;
    if (!adminPwd) throw new Error('admin authentication required');
    const adminUser = await verifyPasswordForRole('admin', adminPwd);
    if (!adminUser) throw new Error('invalid admin password');
    const logged = await login(adminUser.username, adminPwd);
    if (!logged) throw new Error('admin login failed');
  }

  await backendPost('/api/delete-product', { productId: id }, true);
  await fetchRemoteAll();
}

// Sales
export function getSales(): Sale[] {
  return salesCache.slice();
}

export async function recordSale(productId: string, quantity: number, discount?: number): Promise<Sale | string> {
  if (!BACKEND) return 'Backend not configured';

  // Ensure authenticated (sales user should have logged in via UI or been prompted earlier)
  if (!getAuthToken()) return 'not authenticated';

  try {
    const payload = { productId, quantity, discount } as any;
    const json = await backendPost('/api/record-sale', payload, true);
    // refresh caches
    await fetchRemoteAll();
    return json as Sale;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('recordSale backend error', err);
    return 'record failed';
  }
}

export function getSalesByDate(dateStr: string): Sale[] {
  return salesCache.filter(s => (new Date(s.sold_at).toISOString().split('T')[0]) === dateStr);
}

// Shipments
export function getShipments(): Shipment[] {
  return shipmentsCache.slice();
}

export async function createShipment(productId: string, quantity: number, fromLocation: Location, toLocation: Location): Promise<Shipment | string> {
  if (!BACKEND) return 'Backend not configured';
  if (!getAuthToken()) return 'not authenticated';
  try {
    const payload = { productId, quantity, from_location: fromLocation, to_location: toLocation } as any;
    const json = await backendPost('/api/create-shipment', payload, true);
    await fetchRemoteAll();
    return json as Shipment;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('createShipment backend error', err);
    return 'create failed';
  }
}

export async function receiveShipment(shipmentId: string): Promise<boolean> {
  if (!BACKEND) return false;
  if (!getAuthToken()) return false;
  try {
    await backendPost('/api/receive-shipment', { shipmentId }, true);
    await fetchRemoteAll();
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('receiveShipment backend error', err);
    return false;
  }
}

export function getPendingShipmentsForLocation(location: Location): Shipment[] {
  return shipmentsCache.filter(s => s.to_location === location && s.status === 'IN_TRANSIT');
}

// Revenue tracking
export async function getRevenueData(date?: string) {
  if (!BACKEND) return { todayRevenue: 0, totalRevenue: 0, todayItemsSold: 0 };
  
  try {
    const url = `${BACKEND.replace(/\/$/, '')}${date ? `/api/revenue/${date}` : '/api/revenue'}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`revenue request failed: ${resp.status}`);
    const json = await resp.json().catch(() => ({}));
    return json;
  } catch (err) {
    console.warn('getRevenueData failed', err);
    return { todayRevenue: 0, totalRevenue: 0, todayItemsSold: 0 };
  }
}

// Analytics
export async function getAnalytics() {
  // Always refresh from Supabase to get real-time data
  await fetchRemoteAll();

  const products = productsCache;
  const sales = salesCache;

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'Active').length;
  const soldOutProducts = products.filter(p => p.status === 'Sold Out').length;
  const totalRevenue = sales.reduce((sum, s) => sum + s.price_at_sale * s.quantity, 0);
  const totalItemsSold = sales.reduce((sum, s) => sum + s.quantity, 0);

  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => new Date(s.sold_at).toISOString().split('T')[0] === today);
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.price_at_sale * s.quantity, 0);

  const totalStockValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  // Get accurate revenue data from backend (single source of truth)
  let backendTodayRevenue = todayRevenue;
  let backendTotalRevenue = totalRevenue;
  let backendTodayItemsSold = todaySales.reduce((sum, s) => sum + s.quantity, 0);

  if (BACKEND) {
    try {
      const revenueData = await getRevenueData();
      backendTodayRevenue = revenueData.todayRevenue || 0;
      backendTotalRevenue = revenueData.totalRevenue || 0;
      backendTodayItemsSold = revenueData.todayItemsSold || 0;
    } catch (err) {
      // fallback to calculated values
    }
  }

  return {
    totalProducts,
    activeProducts,
    soldOutProducts,
    totalRevenue: backendTotalRevenue,
    totalItemsSold,
    todayRevenue: backendTodayRevenue,
    todaySales: backendTodayItemsSold,
    totalStockValue,
  };
}
