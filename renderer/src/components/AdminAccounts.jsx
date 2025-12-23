import { useState } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function AdminAccounts() {
  const { accounts, isLoading, createAccount, updateAccount, deleteAccount, isCreating, isUpdating, isDeleting } = useAccounts();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    pin: '',
    telephone: '',
    fax: '',
    telex: '',
    contactPerson: '',
  });

  const filteredAccounts = accounts.filter((account) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      account.name.toLowerCase().includes(term) ||
      account.city.toLowerCase().includes(term) ||
      account.address.toLowerCase().includes(term)
    );
  });

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      pin: '',
      telephone: '',
      fax: '',
      telex: '',
      contactPerson: '',
    });
    setEditingAccount(null);
    setIsFormOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      pin: parseInt(formData.pin, 10) || 0,
      telephone: formData.telephone.trim(),
      fax: formData.fax.trim() || null,
      telex: formData.telex.trim() || null,
      contactPerson: formData.contactPerson.trim() || null,
    };

    if (editingAccount) {
      updateAccount({ id: editingAccount.id, data: payload }, { onSuccess: resetForm });
    } else {
      createAccount(payload, { onSuccess: resetForm });
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      address: account.address,
      city: account.city,
      pin: account.pin,
      telephone: account.telephone,
      fax: account.fax || '',
      telex: account.telex || '',
      contactPerson: account.contactPerson || '',
    });
    setIsFormOpen(true);
  };

  const handleDelete = (account) => {
    if (window.confirm(`Delete account "${account.name}"? This is only allowed if no active job cards use it.`)) {
      deleteAccount(account.id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading accounts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Accounts</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage customer accounts used by job cards.</p>
        </div>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Account
          </Button>
        )}
      </div>

      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingAccount ? 'Edit Account' : 'Create Account'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City *</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address *</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pin *</label>
                  <Input
                    type="number"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telephone *</label>
                  <Input
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Person</label>
                  <Input
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fax</label>
                  <Input
                    value={formData.fax}
                    onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telex</label>
                  <Input
                    value={formData.telex}
                    onChange={(e) => setFormData({ ...formData, telex: e.target.value })}
                  />
                </div>
                <div />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {editingAccount ? (isUpdating ? 'Updating...' : 'Update') : isCreating ? 'Creating...' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Accounts List</span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search accounts..."
              className="w-64"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAccounts.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-6">No accounts found.</p>
          ) : (
            <div className="space-y-2">
              {filteredAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex justify-between items-start p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{account.name}</p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{account.city}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{account.address}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Pin: {account.pin} | Tel: {account.telephone}
                      {account.fax ? ` | Fax: ${account.fax}` : ''}
                      {account.telex ? ` | Telex: ${account.telex}` : ''}
                    </p>
                    {account.contactPerson && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Contact: {account.contactPerson}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(account)}>
                      <Edit2 className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(account)} disabled={isDeleting}>
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
