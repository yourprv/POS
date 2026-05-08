import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import CodeSearch from './CodeSearch';
import RecordSale from './RecordSale';
import ShipmentManager from './ShipmentManager';
import SoldOutList from './SoldOutList';
import { Search, ShoppingCart, Truck, LayoutDashboard, TrendingUp, DollarSign, Package, ShoppingBag, AlertTriangle } from 'lucide-react';

export default function SalesDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, products, sales, pendingShipments } = useApp();

  useEffect(() => {
    if (user?.role === 'salesperson') setActiveTab('sell');
  }, [user?.role]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'search', label: 'Search', icon: <Search className="w-4 h-4" /> },
    { id: 'sell', label: 'Sell', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'soldout', label: 'Sold Out', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'shipments', label: 'Shipments', icon: <Truck className="w-4 h-4" /> },
  ];

  const visibleTabs = user?.role === 'salesperson'
    ? tabs.filter(t => ['sell', 'search', 'soldout', 'shipments'].includes(t.id))
    : tabs;

  const myProducts = products.filter(p => p.location === user?.location);
  const mySales = sales.filter(s => s.location === user?.location);
  const today = new Date().toISOString().split('T')[0];
  const todaySales = mySales.filter(s => new Date(s.sold_at).toISOString().split('T')[0] === today);
  const todayRevenue = todaySales.reduce((s, sale) => s + sale.price_at_sale * sale.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} tabs={visibleTabs} />

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h2>
              <p className="text-gray-500 text-sm">Sales Dashboard — {user?.location}</p>
            </div>

            {/* Pending shipments alert */}
            {pendingShipments.length > 0 && (
              <div
                onClick={() => setActiveTab('shipments')}
                className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center animate-bounce">
                    <Truck className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-800">
                      📦 {pendingShipments.length} incoming shipment{pendingShipments.length > 1 ? 's' : ''}!
                     </h3>
                    <p className="text-sm text-amber-700">Tap to view and confirm receipt</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SalesStatCard
                icon={<Package className="w-5 h-5" />}
                label="Active Products"
                value={myProducts.filter(p => p.status === 'Active').length}
                color="blue"
              />
              <SalesStatCard
                icon={<ShoppingBag className="w-5 h-5" />}
                label="Today's Sales"
                value={todaySales.reduce((s, sale) => s + sale.quantity, 0)}
                color="green"
              />
              <SalesStatCard
                icon={<DollarSign className="w-5 h-5" />}
                label="Today's Revenue"
                value={`₹${todayRevenue.toLocaleString()}`}
                color="purple"
              />
              <SalesStatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Total Revenue"
                value={`₹${mySales.reduce((s, sale) => s + sale.price_at_sale * sale.quantity, 0).toLocaleString()}`}
                color="amber"
              />
            </div>

            {/* Quick actions */}
            {user?.role === 'salesperson' ? (
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setActiveTab('sell')}
                  className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition text-center group w-full"
                >
                  <div className="w-14 h-14 mx-auto rounded-xl bg-green-100 flex items-center justify-center mb-3 group-hover:bg-green-200 transition">
                    <ShoppingCart className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">Record Sale</h3>
                  <p className="text-sm text-gray-500 mt-1">Tap to start selling</p>
                </button>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveTab('search')}
                    className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-2 group-hover:bg-blue-200 transition">
                      <Search className="w-5 h-5 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Search</h4>
                    <p className="text-xs text-gray-500">By code</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('shipments')}
                    className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition text-left group relative"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-2 group-hover:bg-amber-200 transition">
                      <Truck className="w-5 h-5 text-amber-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Shipments</h4>
                    <p className="text-xs text-gray-500">Incoming</p>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('search')}
                  className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition">
                    <Search className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Search Product</h3>
                  <p className="text-sm text-gray-500 mt-1">Look up by code</p>
                </button>
                <button
                  onClick={() => setActiveTab('sell')}
                  className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-3 group-hover:bg-green-200 transition">
                    <ShoppingCart className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Record Sale</h3>
                  <p className="text-sm text-gray-500 mt-1">Process a new sale</p>
                </button>
                <button
                  onClick={() => setActiveTab('shipments')}
                  className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition text-left group relative"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-3 group-hover:bg-amber-200 transition">
                    <Truck className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Shipments</h3>
                  <p className="text-sm text-gray-500 mt-1">Check incoming stock</p>
                  {pendingShipments.length > 0 && (
                    <span className="absolute top-4 right-4 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                      {pendingShipments.length}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Recent sales */}
            {todaySales.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Today's Sales</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {todaySales.slice(-5).reverse().map(s => (
                    <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{s.product_code}</span>
                          <span className="font-medium text-gray-900 text-sm">{s.product_name}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">x{s.quantity} • {new Date(s.sold_at).toLocaleTimeString()}</p>
                      </div>
                      <span className="font-semibold text-green-600">₹{(s.price_at_sale * s.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && <CodeSearch />}
        {activeTab === 'sell' && <RecordSale />}
        {activeTab === 'soldout' && <SoldOutList />}
        {activeTab === 'shipments' && <ShipmentManager />}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} tabs={visibleTabs} />
    </div>
  );
}

function SalesStatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    amber: 'from-amber-500 to-amber-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${colors[color]} shadow-lg text-white mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
