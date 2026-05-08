import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Category, Location, Product } from '../types';
import { Plus, Edit2, Trash2, X, Search, Package } from 'lucide-react';
import ProductImage from './ProductImage';

const CATEGORIES: Category[] = ['1 PCS Set', '2 PCS Set', '3 PCS Set', 'Others'];
const LOCATIONS: Location[] = ['Main'];

export default function ProductManager() {
  const { products, addProduct, updateProduct, deleteProduct, searchByCode } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<Category>('1 PCS Set');
  const [formPrice, setFormPrice] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formLocation, setFormLocation] = useState<Location>('Main');
  const [formCode, setFormCode] = useState('');
  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setFormName(''); setFormCategory('1 PCS Set'); setFormPrice('');
    setFormCostPrice('');
    setFormImageUrl(''); setFormStock(''); setFormLocation('Main');
    setFormCode(''); setFormError('');
    setEditingProduct(null); setShowForm(false);
  };

  const openEditForm = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormPrice(p.price.toString());
    setFormCostPrice((p.cost_price || 0).toString());
    setFormImageUrl(p.image_url);
    setFormStock(p.stock.toString());
    setFormCode(p.code);
    setFormLocation(p.location);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const codeTrim = formCode.trim();
    if (codeTrim) {
      const existing = searchByCode(codeTrim);
      if (existing && (!editingProduct || existing.id !== editingProduct.id)) {
        setFormError('A product with this code already exists — choose a different code');
        return;
      }
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: formName,
          category: formCategory,
          price: parseFloat(formPrice) || 0,
          cost_price: parseFloat(formCostPrice) || 0,
          image_url: formImageUrl,
          stock: parseInt(formStock, 10) || 0,
          location: formLocation,
          code: codeTrim || undefined,
        });
      } else {
        await addProduct({
          name: formName,
          category: formCategory,
          price: parseFloat(formPrice) || 0,
          cost_price: parseFloat(formCostPrice) || 0,
          image_url: formImageUrl,
          stock: parseInt(formStock, 10) || 0,
          location: formLocation,
          code: codeTrim || undefined,
        });
      }
      resetForm();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to add product');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
    }
  };

  const filteredProducts = products.filter(p => {
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()) && !(p.code || '').toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterCategory && p.category !== filterCategory) return false;
    if (filterLocation && p.location !== filterLocation) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  const inStockProducts = filteredProducts.filter(p => p.status === 'Active');
  const soldOutProducts = filteredProducts.filter(p => p.status === 'Sold Out');

  // use shared getImageUrl util

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <p className="text-gray-500 text-sm">{products.length} total products</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative col-span-2 md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name or code..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent"
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterLocation}
            onChange={e => setFilterLocation(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          >
            <option value="">All Locations</option>
            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Sold Out">Sold Out</option>
          </select>
        </div>
      </div>

      {/* In Stock */}
      {inStockProducts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            In Stock ({inStockProducts.length})
          </h3>
          <div className="grid gap-3">
            {inStockProducts.map(p => (
              <ProductCard key={p.id} product={p} onEdit={() => openEditForm(p)} onDelete={() => handleDelete(p.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Sold Out */}
      {soldOutProducts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Sold Out ({soldOutProducts.length})
          </h3>
          <div className="grid gap-3">
            {soldOutProducts.map(p => (
              <ProductCard key={p.id} product={p} onEdit={() => openEditForm(p)} onDelete={() => handleDelete(p.id)} soldOut />
            ))}
          </div>
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No products found</p>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm font-medium">{formError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Code (optional)</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={e => setFormCode(e.target.value)}
                  placeholder="Leave empty for auto-generated (e.g. 0009)"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
                <p className="text-xs text-gray-400 mt-1">Enter a unique code or leave blank to auto-generate.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as Category)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value as Location)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  >
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    value={formCostPrice}
                    onChange={e => setFormCostPrice(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={e => setFormStock(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    required
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Drive Image ID</label>
                <input
                  type="text"
                  value={formImageUrl}
                  onChange={e => setFormImageUrl(e.target.value)}
                  placeholder="e.g. 1abc... or full URL"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
                <p className="text-xs text-gray-400 mt-1">Leave empty for no image</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition"
                >
                  {editingProduct ? 'Update' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onEdit, onDelete, soldOut }: { product: Product; onEdit: () => void; onDelete: () => void; soldOut?: boolean }) {
  const { user } = useApp();

  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition flex items-center gap-4 ${
      soldOut ? 'border-red-200 bg-red-50/30 opacity-75' : 'border-gray-100'
    }`}>
      <ProductImage 
        imageUrl={product.image_url} 
        alt={product.name} 
        size="sm" 
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{product.code}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            product.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>{product.status}</span>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{product.location}</span>
        </div>
        <h4 className="font-semibold text-gray-900 truncate">{product.name}</h4>
        <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
          <span>{product.category}</span>
          {user?.role !== 'salesperson' && <span>CP: ₹{(product.cost_price || 0).toLocaleString()}</span>}
          <span>SP: ₹{product.price.toLocaleString()}</span>
          <span>Stock: {product.stock}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onEdit} className="p-2 hover:bg-blue-50 rounded-lg text-blue-500 transition touch-target">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition touch-target">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
