import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, Package, CornerUpLeft, X, Check } from 'lucide-react';

export default function SoldOutList() {
  const { products, updateProduct } = useApp();
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState('');

  const soldOut = products.filter(p => p.status === 'Sold Out');

  const handleRestock = async (id: string) => {
    const qty = parseInt(restockQty);
    if (isNaN(qty) || qty <= 0) return;
    try {
      await updateProduct(id, { stock: qty });
      setRestockId(null);
      setRestockQty('');
    } catch (err) {
      alert('Failed to restock: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sold Out Products</h2>
        <p className="text-gray-500 text-sm">{soldOut.length} products need restocking</p>
      </div>

      {soldOut.length > 0 ? (
        <div className="grid gap-3">
          {soldOut.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{p.code}</span>
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">SOLD OUT</span>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{p.location}</span>
                    </div>
                    <h4 className="font-semibold text-gray-900">{p.name}</h4>
                    <p className="text-sm text-gray-500">{p.category} • ₹{p.price.toLocaleString()}</p>
                  </div>
                </div>

                {restockId === p.id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      value={restockQty}
                      onChange={e => setRestockQty(e.target.value)}
                        placeholder="Qty"
                      className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                      autoFocus
                      min="1"
                    />
                    <button
                      onClick={() => handleRestock(p.id)}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setRestockId(null); setRestockQty(''); }}
                      className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                    <button
                      onClick={() => setRestockId(p.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition text-sm shrink-0"
                    >
                      <CornerUpLeft className="w-4 h-4" /> Return
                    </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Package className="w-12 h-12 mx-auto mb-3 text-green-300" />
          <p className="text-gray-500 text-lg font-medium">All products are in stock!</p>
          <p className="text-gray-400 text-sm mt-1">No items need restocking right now</p>
        </div>
      )}
    </div>
  );
}
