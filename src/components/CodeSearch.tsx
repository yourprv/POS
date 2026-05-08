import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { Search, Package, X } from 'lucide-react';
import ProductImage from './ProductImage';

export default function CodeSearch() {
  const { searchByCode } = useApp();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<Product | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback((searchCode: string) => {
    if (!searchCode.trim()) {
      setResult(undefined);
      return;
    }
    setLoading(true);
    // Simulate AJAX delay
    setTimeout(() => {
      const padded = searchCode.padStart(4, '0');
      const found = searchByCode(padded);
      setResult(found || null);
      setLoading(false);
    }, 300);
  }, [searchByCode]);

  const handleInputChange = (val: string) => {
    setCode(val);
    if (val.length >= 1) {
      handleSearch(val);
    } else {
      setResult(undefined);
    }
  };

  // use shared getImageUrl util

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Product Search</h2>
        <p className="text-gray-500 text-sm">Enter a product code to look up details instantly</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={code}
            onChange={e => handleInputChange(e.target.value)}
            placeholder="Enter product code (e.g., 0001)"
            className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent focus:bg-white transition"
            autoFocus
          />
          {code && (
            <button
              onClick={() => { setCode(''); setResult(undefined); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Result */}
      {!loading && result && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden max-w-lg mx-auto">
          {result.image_url && (
            <ProductImage
              imageUrl={result.image_url}
              alt={result.name}
              size="full"
              className="w-full"
            />
          )}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-lg">{result.code}</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                result.status === 'Active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>{result.status}</span>
              <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">{result.location}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">{result.name}</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Category" value={result.category} />
              <InfoItem label="Price" value={`₹${result.price.toLocaleString()}`} />
              <InfoItem label="Stock" value={result.stock.toString()} highlight={result.stock <= 0 ? 'red' : result.stock < 5 ? 'amber' : 'green'} />
              <InfoItem label="Location" value={result.location} />
            </div>
          </div>
        </div>
      )}

      {/* Not found */}
      {!loading && result === null && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100 max-w-lg mx-auto">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-lg font-medium">Product not found</p>
          <p className="text-gray-400 text-sm mt-1">No product matches code "{code.padStart(4, '0')}"</p>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  const colors: Record<string, string> = {
    red: 'text-red-600',
    amber: 'text-amber-600',
    green: 'text-green-600',
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`font-semibold ${highlight ? colors[highlight] : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
