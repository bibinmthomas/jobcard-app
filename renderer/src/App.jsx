import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import Dashboard from './pages/Dashboard';
import JobCards from './pages/JobCards';
import Layouts from './pages/Layouts';
import Admin from './pages/Admin';
import { FileText, Layout, Settings, Home } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/jobcards', label: 'Job Cards', icon: FileText },
    { path: '/layouts', label: 'Layouts', icon: Layout },
    { path: '/admin', label: 'Admin', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            {/* eslint-disable-next-line no-unused-vars */}
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive(path)
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center">
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              JobCard Manager
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navigation />
            {/* Main Content */}
            <main>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/jobcards" element={<JobCards />} />
                <Route path="/layouts" element={<Layouts />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </main>
          </div>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
