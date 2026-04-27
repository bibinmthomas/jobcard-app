import { useState } from 'react';
import AdminSettings from '../components/AdminSettings';
import DatabaseManagement from '../components/DatabaseManagement';
import FormFieldsManager from '../components/FormFieldsManager';
import { Sliders, Settings, Database } from 'lucide-react';

const TABS = [
  { id: 'formFields', label: 'Form Fields', icon: Sliders    },
  { id: 'settings',   label: 'Settings',    icon: Settings   },
  { id: 'database',   label: 'Database',    icon: Database   },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('formFields');

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Administration</h1>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'formFields' && <FormFieldsManager />}
      {activeTab === 'settings'   && <AdminSettings />}
      {activeTab === 'database'   && <DatabaseManagement />}
    </div>
  );
}
