import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import ProductManager from './ProductManager';
import ShipmentManager from './ShipmentManager';
import SalesLedger from './SalesLedger';
import UserManager from './UserManager';
import SoldOutList from './SoldOutList';
import { LayoutDashboard, Package, Truck, BookOpen, Users, AlertTriangle, TrendingUp, DollarSign, ShoppingBag, Archive } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { analytics, products } = useApp();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
    { id: 'shipments', label: 'Shipments', icon: <Truck className="w-4 h-4" /> },
    { id: 'ledger', label: 'Ledger', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'soldout', label: 'Sold Out', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
  ];

  const mainProducts = products; // consolidated single location view

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Admin Dashboard</h2>
              <p className="text-gray-500 text-sm">Overview of your shop operations</p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Package className="w-5 h-5" />}
                label="Total Products"
                value={analytics.totalProducts}
                color="blue"
              />
              <StatCard
                icon={<ShoppingBag className="w-5 h-5" />}
                label="Items Sold"
                value={analytics.totalItemsSold}
                color="green"
              />
              <StatCard
                icon={<DollarSign className="w-5 h-5" />}
                label="Total Revenue"
                value={`₹${analytics.totalRevenue.toLocaleString()}`}
                color="purple"
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Today Revenue"
                value={`₹${analytics.todayRevenue.toLocaleString()}`}
                color="amber"
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Archive className="w-5 h-5" />}
                label="Stock Value"
                value={`₹${analytics.totalStockValue.toLocaleString()}`}
                color="teal"
              />
              <StatCard
                icon={<Package className="w-5 h-5" />}
                label="Active Items"
                value={analytics.activeProducts}
                color="emerald"
              />
              <StatCard
                icon={<AlertTriangle className="w-5 h-5" />}
                label="Sold Out"
                value={analytics.soldOutProducts}
                color="red"
              />
              <StatCard
                icon={<ShoppingBag className="w-5 h-5" />}
                label="Today Sales"
                value={analytics.todaySales}
                color="indigo"
              />
            </div>

            {/* Consolidated location overview */}
            <div className="grid md:grid-cols-1 gap-6">
              <LocationCard
                location="Main"
                total={mainProducts.length}
                active={mainProducts.filter(p => p.status === 'Active').length}
                soldOut={mainProducts.filter(p => p.status === 'Sold Out').length}
                stockValue={mainProducts.reduce((s, p) => s + p.price * p.stock, 0)}
              />
            </div>
          </div>
        )}

        {activeTab === 'products' && <ProductManager />}
        {activeTab === 'shipments' && <ShipmentManager isAdmin />}
        {activeTab === 'ledger' && <SalesLedger />}
        {activeTab === 'soldout' && <SoldOutList />}
        {activeTab === 'users' && <UserManager />}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-200',
    green: 'from-green-500 to-green-600 shadow-green-200',
    purple: 'from-purple-500 to-purple-600 shadow-purple-200',
    amber: 'from-amber-500 to-amber-600 shadow-amber-200',
    red: 'from-red-500 to-red-600 shadow-red-200',
    teal: 'from-teal-500 to-teal-600 shadow-teal-200',
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-200',
    indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-200',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${colors[color]} shadow-lg text-white mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function LocationCard({ location, total, active, soldOut, stockValue }: { location: string; total: number; active: number; soldOut: number; stockValue: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">📍 {location}</h3>
        <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">{total} products</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xl font-bold text-green-600">{active}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div>
          <p className="text-xl font-bold text-red-500">{soldOut}</p>
          <p className="text-xs text-gray-500">Sold Out</p>
        </div>
        <div>
          <p className="text-xl font-bold text-purple-600">₹{stockValue.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Stock Value</p>
        </div>
      </div>
    </div>
  );
}
