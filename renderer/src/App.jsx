import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Dashboard            from './pages/Dashboard';
import JobCards             from './pages/JobCards';
import Accounts             from './pages/Accounts';
import Admin                from './pages/Admin';
import Reports              from './pages/Reports';
import Login                from './pages/Login';
import ResetPassword        from './pages/ResetPassword';
import ChangeExpiredPassword from './pages/ChangeExpiredPassword';

import { FileText, Home, Building2, Settings, LogOut, BarChart2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

// ─── Auth Gate ────────────────────────────────────────────────────────────────

function AuthGate() {
  const { user, loading, passwordStatus } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      </div>
    );
  }

  if (!user)                        return <Login />;
  if (passwordStatus?.needsReset)   return <ResetPassword />;
  if (passwordStatus?.isExpired)    return <ChangeExpiredPassword />;
  return <MainApp />;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function Navigation() {
  const location  = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { path: '/',         label: 'Dashboard', icon: Home      },
    { path: '/jobcards', label: 'Job Cards', icon: FileText  },
    { path: '/accounts', label: 'Accounts',  icon: Building2 },
    { path: '/reports',  label: 'Reports',   icon: BarChart2 },
    { path: '/admin',    label: 'Admin',     icon: Settings  },
  ];

  const isActive = (p) => location.pathname === p;

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-14">
          {/* Left — links */}
          <div className="flex space-x-6">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`inline-flex items-center px-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive(path)
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="w-4 h-4 mr-1.5" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right — brand + logout */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">
              Beeees
            </span>
            <button
              onClick={logout}
              title="Sign out"
              className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ─── Main App (authenticated) ─────────────────────────────────────────────────

function MainApp() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main>
          <Routes>
            <Route path="/"         element={<Dashboard />} />
            <Route path="/jobcards" element={<JobCards />}  />
            <Route path="/accounts" element={<Accounts />}  />
            <Route path="/reports"  element={<Reports />}   />
            <Route path="/admin"    element={<Admin />}     />
            <Route path="*"         element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
