import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import supabase from '../lib/supabase';
import { User, Product, Sale, Shipment, Location, Category } from '../types';
import * as store from '../store';

interface AppContextType {
  user: User | null;
  products: Product[];
  sales: Sale[];
  shipments: Shipment[];
  users: User[];
  pendingShipments: Shipment[];
  analytics: {
    totalProducts: number;
    activeProducts: number;
    soldOutProducts: number;
    totalRevenue: number;
    totalItemsSold: number;
    todayRevenue: number;
    todaySales: number;
    totalStockValue: number;
  };
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  refresh: () => Promise<void>;
  addProduct: (data: { name: string; category: Category; price: number; image_url: string; stock: number; location: Location; cost_price?: number; code?: string }) => Promise<Product>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  searchByCode: (code: string) => Product | undefined;
  recordSale: (productId: string, quantity: number, discount?: number) => Promise<Sale | string>;
  getSalesByDate: (date: string) => Sale[];
  createShipment: (productId: string, quantity: number, from: Location, to: Location) => Promise<Shipment | string>;
  receiveShipment: (id: string) => Promise<boolean>;
  updateUserPassword: (userId: string, password: string) => Promise<void>;
  realtimeConnected: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // ensure store defaults are initialized before reading initial state
  store.initializeStore();

  const [user, setUser] = useState<User | null>(store.getCurrentUser());
  const [products, setProducts] = useState<Product[]>(store.getProducts());
  const [sales, setSales] = useState<Sale[]>(store.getSales());
  const [shipments, setShipments] = useState<Shipment[]>(store.getShipments());
  const [users, setUsers] = useState<User[]>(store.getUsers());
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const refresh = useCallback(async () => {
    // Fetch fresh data from Supabase
    await store.fetchRemoteAll();
    setProducts(store.getProducts());
    setSales(store.getSales());
    setShipments(store.getShipments());
    setUsers(store.getUsers());
  }, []);

  useEffect(() => {
    // keep local state in sync with storage when App mounts
    refresh();
  }, [refresh]);

  // Realtime sync: subscribe to products, sales and shipments changes when Supabase is configured
  useEffect(() => {
    const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON;
    if (!anon) return;

    // initial fetch: populate in-memory caches and app state from Supabase
    (async () => {
      try {
        await refresh();
      } catch (err) {
        console.warn('initial remote fetch failed', err);
      }
    })();

    const channel = supabase.channel('pos-realtime');

    try {
      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => { await refresh(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, async () => { await refresh(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, async () => { await refresh(); });

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeConnected(true);
        } else {
          setRealtimeConnected(false);
          console.error('Realtime subscription failed with status:', status);
        }
      });
      // eslint-disable-next-line no-console
      console.log('Supabase realtime channel subscribed');
    } catch (err) {
      // ignore realtime setup errors — app will still work via polling
      console.warn('supabase realtime subscription failed', err);
      setRealtimeConnected(false);
    }

    return () => {
      try { supabase.removeChannel(channel); } catch (_) {}
    };
  }, [refresh]);

  const pendingShipments = user
    ? store.getPendingShipmentsForLocation(user.location)
    : [];

  const defaultAnalytics = {
    totalProducts: 0,
    activeProducts: 0,
    soldOutProducts: 0,
    totalRevenue: 0,
    totalItemsSold: 0,
    todayRevenue: 0,
    todaySales: 0,
    totalStockValue: 0,
  };
  const [analytics, setAnalytics] = useState(defaultAnalytics);

  // Update analytics periodically and after sales
  useEffect(() => {
    const updateAnalytics = async () => {
      const newAnalytics = await store.getAnalytics();
      setAnalytics(newAnalytics);
    };

    updateAnalytics();

    // Update every 5 seconds for near real-time dashboard
    const interval = setInterval(updateAnalytics, 5000);
    return () => clearInterval(interval);
  }, [sales]);

  const loginFn = async (username: string, password: string) => {
    const u = await store.login(username, password);
    if (u) {
      store.setCurrentUser(u);
      setUser(u);
      await refresh();
    }
    return u;
  };

  const logout = () => {
    store.setCurrentUser(null);
    setUser(null);
  };

  const addProductFn = async (data: { name: string; category: Category; price: number; image_url: string; stock: number; location: Location; cost_price?: number; code?: string }) => {
    const p = await store.addProduct(data as any);
    await refresh();
    return p;
  };

  const updateProductFn = async (id: string, data: Partial<Product>) => {
    await store.updateProduct(id, data);
    await refresh();
  };

  const deleteProductFn = async (id: string) => {
    await store.deleteProduct(id);
    await refresh();
  };

  const searchByCode = (code: string) => store.searchProductByCode(code);

  const recordSaleFn = async (productId: string, quantity: number, discount?: number) => {
    const result = await store.recordSale(productId, quantity, discount);
    await refresh();
    // Force analytics refresh after sale
    const newAnalytics = await store.getAnalytics();
    setAnalytics(newAnalytics);
    return result;
  };

  const getSalesByDateFn = (date: string) => store.getSalesByDate(date);

  const createShipmentFn = async (productId: string, quantity: number, from: Location, to: Location) => {
    const result = await store.createShipment(productId, quantity, from, to);
    await refresh();
    return result;
  };

  const receiveShipmentFn = async (id: string) => {
    const result = await store.receiveShipment(id);
    await refresh();
    return result;
  };

  const updateUserPasswordFn = async (userId: string, password: string) => {
    await store.updateUserPassword(userId, password);
    await refresh();
  };

  return (
    <AppContext.Provider value={{
      user, products, sales, shipments, users, pendingShipments, analytics,
      login: loginFn, logout, refresh,
      addProduct: addProductFn, updateProduct: updateProductFn, deleteProduct: deleteProductFn,
      searchByCode, recordSale: recordSaleFn, getSalesByDate: getSalesByDateFn,
      createShipment: createShipmentFn, receiveShipment: receiveShipmentFn,
      updateUserPassword: updateUserPasswordFn,
      realtimeConnected,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
