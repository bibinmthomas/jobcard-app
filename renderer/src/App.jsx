import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Dashboard  from './pages/Dashboard';
import JobCards   from './pages/JobCards';
import Accounts   from './pages/Accounts';
import Admin      from './pages/Admin';
import Reports    from './pages/Reports';
import Login      from './pages/Login';
import Signup     from './pages/Signup';

import { FileText, Home, Building2, Settings, LogOut, BarChart2 } from 'lucide-react';
import { api } from './utils/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

// ─── Auth Gate ────────────────────────────────────────────────────────────────

function AuthGate() {
  const { user, loading } = useAuth();
  const [hasUsers, setHasUsers]     = useState(null);
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      api.auth.hasUsers()
        .then(result => setHasUsers(result))
        .catch(() => setHasUsers(false));
    }
  }, [user, loading]);

  if (loading || (hasUsers === null && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      </div>
    );
  }

  // Logged in — show main app
  if (user) return <MainApp />;

  // No users at all → show signup (first launch)
  if (!hasUsers) {
    return <Signup onHaveAccount={() => setShowSignup(false)} />;
  }

  // Has users but not logged in
  if (showSignup) {
    return <Signup onHaveAccount={() => setShowSignup(false)} />;
  }

  return <Login onNeedSignup={() => setShowSignup(true)} />;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function Navigation() {
  const location = useLocation();
  const { user, logout } = useAuth();

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

          {/* Right — user + logout */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">
              Job Card Manager
            </span>
            {user && (
              <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-3">
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {user.username}
                  {user.role === 'admin' && (
                    <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1 rounded">
                      admin
                    </span>
                  )}
                </span>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-1 text-gray-400 hover:text-red-500 rounded"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
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
