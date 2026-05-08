import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Location } from '../types';
import { Truck, Package, Check, Clock, Plus, X, ArrowRight } from 'lucide-react';

const LOCATIONS: Location[] = ['Main', 'shop'];

export default function ShipmentManager({ isAdmin }: { isAdmin?: boolean }) {
  const { products, shipments, createShipment, receiveShipment, user, pendingShipments } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [fromLocation, setFromLocation] = useState<Location>('shop');
  const [toLocation, setToLocation] = useState<Location>('shop');
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createShipment(selectedProduct, parseInt(quantity), fromLocation, toLocation);
    if (typeof result === 'string') {
      setMessage({ text: result, type: 'error' });
    } else {
      setMessage({ text: 'Shipment created successfully!', type: 'success' });
      setSelectedProduct('');
      setQuantity('');
      setShowForm(false);
    }
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleReceive = async (id: string) => {
    const success = await receiveShipment(id);
    if (success) {
      setMessage({ text: 'Shipment received! Stock updated.', type: 'success' });
    } else {
      setMessage({ text: 'Failed to receive shipment.', type: 'error' });
    }
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const visibleShipments = isAdmin
    ? shipments
    : shipments.filter(s => s.to_location === user?.location);

  const inTransit = visibleShipments.filter(s => s.status === 'IN_TRANSIT');
  const received = visibleShipments.filter(s => s.status === 'RECEIVED');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shipments</h2>
          <p className="text-gray-500 text-sm">The Handshake — Track inventory transfers</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition"
          >
            <Plus className="w-4 h-4" /> New Shipment
          </button>
        )}
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Pending notification for salesperson */}
      {!isAdmin && pendingShipments.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="font-semibold text-amber-800">
              {pendingShipments.length} shipment{pendingShipments.length > 1 ? 's' : ''} awaiting your confirmation
            </h3>
          </div>
          <p className="text-sm text-amber-700">Click "Receive" to confirm receipt and update stock.</p>
        </div>
      )}

      {/* In Transit */}
      {inTransit.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            In Transit ({inTransit.length})
          </h3>
          <div className="grid gap-3">
            {inTransit.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s.product_code}</span>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">IN TRANSIT</span>
                      </div>
                      <h4 className="font-semibold text-gray-900">{s.product_name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                        <span>{s.from_location}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>{s.to_location}</span>
                        <span>• Qty: {s.quantity}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{new Date(s.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {(!isAdmin || user?.location === s.to_location) && (
                    <button
                      onClick={() => handleReceive(s.id)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition shrink-0"
                    >
                      <Check className="w-4 h-4" /> Receive
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Received */}
      {received.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Received ({received.length})
          </h3>
          <div className="grid gap-3">
            {received.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm opacity-75">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s.product_code}</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">RECEIVED</span>
                    </div>
                    <h4 className="font-semibold text-gray-900">{s.product_name}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                      <span>{s.from_location}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span>{s.to_location}</span>
                      <span>• Qty: {s.quantity}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Received: {s.received_at ? new Date(s.received_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {visibleShipments.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No shipments yet</p>
        </div>
      )}

      {/* Create Shipment Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Create New Shipment</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreateShipment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  required
                >
                  <option value="">Select a product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>[{p.code}] {p.name} — {p.location} (Stock: {p.stock})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  required
                  min="1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <select
                    value={fromLocation}
                    onChange={e => setFromLocation(e.target.value as Location)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  >
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <select
                    value={toLocation}
                    onChange={e => setToLocation(e.target.value as Location)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  >
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition"
                >
                  Create Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
