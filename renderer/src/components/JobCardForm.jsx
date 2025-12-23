/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useLayouts } from '../hooks/useLayouts';
import { useAccounts } from '../hooks/useAccounts';
import { AlertCircle } from 'lucide-react';

export default function JobCardForm({ jobCard, onSubmit, onCancel }) {
  const { layouts, isLoading: layoutsLoading } = useLayouts();
  const { accounts, isLoading: accountsLoading } = useAccounts();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    customData: {},
    accountId: null,
    layoutId: null,
  });
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountSearch, setAccountSearch] = useState('');

  useEffect(() => {
    if (!jobCard) return;

    const nextState = {
      title: jobCard.title || '',
      description: jobCard.description || '',
      customData: jobCard.customData || {},
      accountId: jobCard.accountId || null,
      layoutId: jobCard.layoutId || null,
    };

    setFormData((prev) => (
      JSON.stringify(prev) === JSON.stringify(nextState) ? prev : nextState
    ));

    if (jobCard.layoutId && layouts.length > 0) {
      const layout = layouts.find(l => l.id === jobCard.layoutId) || null;
      setSelectedLayout(layout);
    }

    if (jobCard.accountId && accounts.length > 0) {
      const account = accounts.find(a => a.id === jobCard.accountId) || null;
      setSelectedAccount(account);
    }
  }, [jobCard, layouts, accounts]);

  const handleLayoutChange = (layoutId) => {
    const layout = layouts.find(l => l.id === parseInt(layoutId));
    setSelectedLayout(layout);
    setFormData(prev => ({
      ...prev,
      layoutId: layout ? layout.id : null,
      customData: {}, // Reset custom data when layout changes
    }));
  };

  const handleAccountChange = (accountId) => {
    const account = accounts.find(a => a.id === parseInt(accountId));
    setSelectedAccount(account || null);
    setFormData(prev => ({
      ...prev,
      accountId: account ? account.id : null,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleCustomFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      customData: {
        ...prev.customData,
        [fieldName]: value,
      },
    }));
  };

  // Get all custom fields from selected layout's categories
  const getLayoutFields = () => {
    if (!selectedLayout || !selectedLayout.categories) return [];

    const fields = [];
    selectedLayout.categories.forEach(layoutCategory => {
      if (layoutCategory.category && layoutCategory.category.customFields) {
        fields.push(...layoutCategory.category.customFields);
      }
    });

    // Sort by order
    return fields.sort((a, b) => a.order - b.order);
  };

  const customFields = getLayoutFields();

  const filteredAccounts = accounts.filter((account) => {
    const term = accountSearch.trim().toLowerCase();
    if (!term) return true;
    return (
      account.name.toLowerCase().includes(term) ||
      account.city.toLowerCase().includes(term) ||
      account.address.toLowerCase().includes(term)
    );
  });

  const renderCustomField = (field) => {
    const value = formData.customData[field.name] || '';

    switch (field.type) {
      case 'text':
      case 'number':
      case 'date':
        return (
          <Input
            type={field.type}
            value={value}
            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
            required={field.required}
          />
        );
      case 'select':
        {
          const options = field.options || [];
          return (
            <select
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              value={value}
              onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
              required={field.required}
            >
              <option value="">Select...</option>
              {options.map((opt, idx) => (
                <option key={idx} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          );
        }
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
            required={field.required}
          />
        );
    }
  };

  if (layoutsLoading || accountsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-600 dark:text-gray-400">Loading layouts and accounts...</p>
        </CardContent>
      </Card>
    );
  }

  if (!jobCard && accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cannot Create Job Card</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900 dark:text-yellow-200">No Accounts Available</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                You must create at least one account before creating job cards.
                Please go to the Accounts section in Admin to add an account first.
              </p>
            </div>
          </div>
          {onCancel && (
            <div className="mt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Go Back
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Block creation if no layouts exist
  if (!jobCard && layouts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cannot Create Job Card</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900 dark:text-yellow-200">No Layouts Available</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                You must create at least one layout before creating job cards.
                Please go to the Layouts page to create a layout first.
              </p>
            </div>
          </div>
          {onCancel && (
            <div className="mt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Go Back
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{jobCard ? 'Edit Job Card' : 'Create Job Card'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Account *
            </label>
            <div className="space-y-2">
              <Input
                type="text"
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                placeholder="Search by name, city, or address"
              />
              <select
                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                value={formData.accountId || ''}
                onChange={(e) => handleAccountChange(e.target.value)}
                required
              >
                <option value="">Select an account...</option>
                {filteredAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {account.city}
                  </option>
                ))}
              </select>
              {selectedAccount && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedAccount.address}, {selectedAccount.city} | Tel: {selectedAccount.telephone}
                </p>
              )}
            </div>
          </div>

          {/* Layout Selection - Required for new job cards */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Layout * {!jobCard && <span className="text-xs text-gray-500 dark:text-gray-400">(Choose first)</span>}
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              value={formData.layoutId || ''}
              onChange={(e) => handleLayoutChange(e.target.value)}
              required
            >
              <option value="">Select a layout...</option>
              {layouts.map((layout) => (
                <option key={layout.id} value={layout.id}>
                  {layout.name}
                  {layout.categories && layout.categories.length > 0 &&
                    ` (${layout.categories.length} ${layout.categories.length === 1 ? 'category' : 'categories'})`
                  }
                </option>
              ))}
            </select>
            {selectedLayout && selectedLayout.categories && selectedLayout.categories.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This layout uses fields from: {selectedLayout.categories.map(lc => lc.category.name).join(', ')}
              </p>
            )}
          </div>

          {/* Only show rest of form if layout is selected */}
          {selectedLayout && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Enter job card title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>

              {customFields.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Custom Fields</h3>
                  <div className="space-y-4">
                    {customFields.map((field) => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {field.name}
                          {field.required && ' *'}
                        </label>
                        {renderCustomField(field)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="submit">
                  {jobCard ? 'Update' : 'Create'}
                </Button>
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </>
          )}

          {!selectedLayout && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Please select a layout to continue
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
