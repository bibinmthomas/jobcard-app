import { useState } from 'react';
import AdminFieldCategories from '../components/AdminFieldCategories';
import CategoryFieldManager from '../components/CategoryFieldManager';
import AdminSettings from '../components/AdminSettings';
import DatabaseManagement from '../components/DatabaseManagement';
import AdminAccounts from '../components/AdminAccounts';
import { FolderTree, FileText, Database } from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('accounts');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const tabs = [
    { id: 'accounts', label: 'Accounts', icon: FileText },
    { id: 'categories', label: 'Field Categories', icon: FolderTree },
    { id: 'settings', label: 'Settings', icon: FileText },
    { id: 'database', label: 'Database', icon: Database },
  ];

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Admin Panel</h1>

        {/* Tabs - Only show when not viewing category details */}
        {!selectedCategory && (
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {selectedCategory ? (
            <CategoryFieldManager
              category={selectedCategory}
              onBack={handleBackToCategories}
            />
          ) : activeTab === 'accounts' ? (
            <AdminAccounts />
          ) : activeTab === 'categories' ? (
            <AdminFieldCategories onSelectCategory={handleSelectCategory} />
          ) : activeTab === 'settings' ? (
            <AdminSettings />
          ) : activeTab === 'database' ? (
            <DatabaseManagement />
          ) : null}
        </div>
      </div>
    </div>
  );
}
