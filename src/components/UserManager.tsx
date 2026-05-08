import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, Key, Check, MapPin, Shield } from 'lucide-react';

export default function UserManager() {
  const { users, updateUserPassword } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleUpdatePassword = (userId: string) => {
    if (!newPassword.trim()) return;
    updateUserPassword(userId, newPassword);
    setEditingId(null);
    setNewPassword('');
    setSuccessMsg('Password updated successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const salespersons = users.filter(u => u.role === 'salesperson');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="text-gray-500 text-sm">Manage salesperson accounts and passwords</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium flex items-center gap-2">
          <Check className="w-4 h-4" /> {successMsg}
        </div>
      )}

      <div className="grid gap-4">
        {salespersons.map(user => (
          <div key={user.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{user.name}</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> {user.username}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {user.location}</span>
                  </div>
                </div>
              </div>

              {editingId === user.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 w-40"
                    autoFocus
                  />
                  <button
                    onClick={() => handleUpdatePassword(user.id)}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setEditingId(null); setNewPassword(''); }}
                    className="px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingId(user.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-sm font-medium"
                >
                  <Key className="w-4 h-4" /> Change Password
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {salespersons.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No salesperson accounts found</p>
        </div>
      )}
    </div>
  );
}
