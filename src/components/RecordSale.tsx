import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingCart, Package, Check, Search, Minus, Plus } from 'lucide-react';

export default function RecordSale() {
  const { products, recordSale, user } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user?.role === 'salesperson') {
      // focus search for faster scanning on salesman devices
      searchRef.current?.focus();
    }
  }, [user?.role]);

  // Allow all active products to be sold by any salesperson
  const availableProducts = products.filter(p => p.status === 'Active');

  const filteredProducts = availableProducts.filter(p =>
    !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleSale = async () => {
    if (!selectedProductId) {
      setMessage({ text: 'Please select a product', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return;
    }
    // Read discount from the inline input (default to 0 if empty/invalid)
    let discountAmt = 0;
    if (user?.role === 'salesperson') {
      const parsed = Number(discount);
      discountAmt = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }

    // Check if user is logged in
    if (!user) {
      setMessage({ text: 'Please login first', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return;
    }

    const result = await recordSale(selectedProductId, quantity, discountAmt);
    if (typeof result === 'string') {
      setMessage({ text: result, type: 'error' });
    } else {
      const total = (Number(result.price_at_sale || 0) * Number(result.quantity || 0)).toLocaleString();
      setMessage({ text: `Sale recorded! ${result.product_name} x${result.quantity} — ₹${total}`, type: 'success' });
      setSelectedProductId('');
      setQuantity(1);
      setDiscount('');
      setSearchTerm('');
    }
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Record Sale</h2>
        <p className="text-gray-500 text-sm">Select a product and quantity to record a sale</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : null}
          {message.text}
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            ref={searchRef}
            placeholder="Search by name or code"
            className={`w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg ${user?.role === 'salesperson' ? 'text-base' : 'text-sm'} focus:outline-none focus:ring-2 focus:ring-blue-400/50`}
            autoFocus={user?.role === 'salesperson'}
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${user?.role === 'salesperson' ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-3`}>
        {filteredProducts.map(p => (
          <button
            key={p.id}
            onClick={() => { setSelectedProductId(p.id); setQuantity(1); }}
            className={`text-left ${user?.role === 'salesperson' ? 'p-6' : 'p-4'} rounded-xl border-2 transition-all ${
              selectedProductId === p.id
                ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                selectedProductId === p.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                <Package className={user?.role === 'salesperson' ? 'w-6 h-6' : 'w-5 h-5'} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{p.code}</span>
                  <span className="text-xs text-green-600 font-medium">Stock: {p.stock}</span>
                </div>
                <h4 className={`font-semibold text-gray-900 ${user?.role === 'salesperson' ? 'text-base' : 'text-sm'} truncate`}>{p.name}</h4>
                <p className={`text-sm text-gray-500 mt-0.5 ${user?.role === 'salesperson' ? 'text-base' : ''}`}>₹{p.price.toLocaleString()} • {p.category}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No products available</p>
        </div>
      )}

      {/* Sale confirmation */}
      {selectedProduct && (
        <div
          className="bg-white rounded-xl border border-blue-200 p-6 shadow-lg fixed left-4 right-4 bottom-20 z-50 md:sticky md:bottom-4 md:left-auto md:right-auto"
          style={{ maxWidth: 'calc(100% - 2rem)' }}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-0.5">Selling</p>
              <h4 className="font-bold text-gray-900 text-lg">{selectedProduct.name}</h4>
              <p className="text-sm text-gray-500">₹{selectedProduct.price.toLocaleString()} per unit • Stock: {selectedProduct.stock}</p>
            </div>

            <div className="flex-1 flex flex-col md:flex-row items-center md:items-center gap-4 w-full">
              <div className="flex flex-col items-center md:items-start gap-3 w-full md:w-auto">
                {user?.role === 'salesperson' && (
                  <div className="flex items-center gap-2">
                    {[1,2,5,10].map(n => (
                      <button
                        key={n}
                        onClick={() => setQuantity(Math.min(selectedProduct.stock, n))}
                        className={`px-3 py-2 rounded-lg border ${quantity === n ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 justify-center">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, Math.min(selectedProduct.stock, parseInt(e.target.value) || 1)))}
                    className={`w-20 text-center py-2 border border-gray-200 rounded-lg ${user?.role === 'salesperson' ? 'text-lg font-semibold' : 'text-sm font-semibold'} focus:outline-none focus:ring-2 focus:ring-blue-400/50`}
                    min="1"
                    max={selectedProduct.stock}
                  />
                  <button
                    onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                    className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {user?.role === 'salesperson' && (
                <div className="flex items-center justify-center md:justify-start w-full md:w-auto">
                  <div className="flex flex-col items-center md:items-start w-full">
                    <label className="text-xs text-gray-500 mb-1">Discount (₹)</label>
                    <input
                      type="number"
                      value={discount}
                      onChange={e => setDiscount(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-32 md:w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-center"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center md:items-end w-full md:w-auto">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-2xl font-bold text-green-600">₹{(Math.max(0, selectedProduct.price - (Number(user?.role === 'salesperson' ? Number(discount) || 0 : 0)) ) * quantity).toLocaleString()}</p>
              </div>
            </div>

            <div className="w-full md:w-auto">
              <button
                onClick={handleSale}
                className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/25 transition active:scale-95 text-xl md:text-lg"
              >
                <ShoppingCart className="w-5 h-5" /> Sell
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
