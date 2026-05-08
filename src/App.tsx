import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import SalesDashboard from './components/SalesDashboard';

function AppContent() {
  const { user } = useApp();

  if (!user) return <Login />;

  if (user.role === 'admin') return <AdminDashboard />;

  return <SalesDashboard />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
      <div
        style={{
          position: 'fixed',
          right: 12,
          bottom: 12,
          opacity: 0.18,
          fontSize: '10px',
          color: '#374151',
          pointerEvents: 'none',
          zIndex: 9999,
          lineHeight: 1.2,
          userSelect: 'text',
        }}
      >
        License: MIT · Original Creator: yourprv
      </div>
    </AppProvider>
  );
}
