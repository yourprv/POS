import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, Calendar, DollarSign, ShoppingBag } from 'lucide-react';

export default function SalesLedger() {
  const { getSalesByDate, user } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const sales = getSalesByDate(selectedDate);
  const totalRevenue = sales.reduce((s, sale) => {
    const disc = Number(sale.discount) || 0;
    const unitAfter = Number(sale.price_at_sale) || 0;
    const unitOriginal = unitAfter + disc;
    // Don't count revenue when there's a full discount
    return disc >= unitOriginal ? s : s + (unitAfter * sale.quantity);
  }, 0);
  const totalItems = sales.reduce((s, sale) => s + sale.quantity, 0);
  const showDiscount = user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">The "Lazer" Ledger</h2>
        <p className="text-gray-500 text-sm">Detailed daily sales breakdown</p>
      </div>

      {/* Date picker & summary */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Calendar className="w-4 h-4 inline mr-1" />
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            />
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-0.5">
                <ShoppingBag className="w-4 h-4" /> Items Sold
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-0.5">
                <DollarSign className="w-4 h-4" /> Revenue
              </div>
              <p className="text-2xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales table */}
      {sales.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Qty</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Price</th>
                  {showDiscount && (
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Discount</th>
                  )}
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Total</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Time</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Sold By</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Location</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, idx) => (
                  <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{sale.product_code}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{sale.product_name}</td>
                    <td className="px-4 py-3 text-gray-700">{sale.quantity}</td>
                    {(() => {
                      const disc = Number(sale.discount) || 0;
                      const unitAfter = Number(sale.price_at_sale) || 0; // price after discount per unit (stored)
                      const unitOriginal = unitAfter + disc; // original unit price
                      const totalAfter = unitAfter * sale.quantity;
                      
                      // Show "No" for total when there's a full discount (makes the total effectively zero)
                      const displayTotal = disc >= unitOriginal ? "No" : `₹${totalAfter.toLocaleString()}`;
                      
                      return (
                        <>
                          <td className="px-4 py-3 text-gray-700">₹{unitOriginal.toLocaleString()}</td>
                          {showDiscount && (
                            <td className="px-4 py-3 text-gray-700">₹{disc.toLocaleString()}</td>
                          )}
                          <td className="px-4 py-3 font-semibold text-green-600">{displayTotal}</td>
                        </>
                      );
                    })()}
                    <td className="px-4 py-3 text-gray-500">{new Date(sale.sold_at).toLocaleTimeString()}</td>
                    <td className="px-4 py-3 text-gray-500">{sale.sold_by}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{sale.location}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {showDiscount ? (
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={3} className="px-4 py-3 text-gray-700">Total</td>
                    <td className="px-4 py-3 text-gray-700">{totalItems}</td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-green-600">₹{totalRevenue.toLocaleString()}</td>
                    <td colSpan={3}></td>
                  </tr>
                ) : (
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={3} className="px-4 py-3 text-gray-700">Total</td>
                    <td className="px-4 py-3 text-gray-700">{totalItems}</td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-green-600">₹{totalRevenue.toLocaleString()}</td>
                    <td colSpan={3}></td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-lg font-medium">No sales recorded</p>
          <p className="text-gray-400 text-sm mt-1">for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      )}
    </div>
  );
}
