import { useState } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import { Plus, Pencil, Trash2, X, Building2, Search } from 'lucide-react';

const EMPTY = {
  acctName: '', address: '', city: '', pin: '',
  fax: '', telex: '', contactPerson: '',
};

function AccountForm({ initial = EMPTY, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);

  const set = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const field = (label, key, opts = {}) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        {label}{opts.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        value={form[key]}
        onChange={set(key)}
        required={opts.required}
        placeholder={opts.placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {field('Account Name', 'acctName', { required: true })}
        {field('Contact Person', 'contactPerson')}
      </div>
      {field('Address', 'address')}
      <div className="grid grid-cols-3 gap-3">
        {field('City', 'city')}
        {field('PIN', 'pin')}
        {field('Fax', 'fax')}
      </div>
      {field('Telex', 'telex')}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg"
        >
          {saving ? 'Saving…' : 'Save Account'}
        </button>
      </div>
    </form>
  );
}

export default function Accounts() {
  const { accounts, isLoading, createAccount, updateAccount, deleteAccount } = useAccounts();
  const [mode, setMode]       = useState(null); // null | 'create' | 'edit'
  const [editing, setEditing] = useState(null);
  const [search, setSearch]   = useState('');
  const [error, setError]     = useState('');
  const [saving, setSaving]   = useState(false);

  const filtered = accounts.filter(a =>
    a.acctName.toLowerCase().includes(search.toLowerCase()) ||
    (a.city || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.contactPerson || '').toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setMode('create'); setError(''); };
  const openEdit   = (a)  => { setEditing(a);  setMode('edit');   setError(''); };
  const closeForm  = ()   => { setMode(null);  setEditing(null);  setError(''); };

  const handleSave = async (form) => {
    setSaving(true);
    setError('');
    try {
      if (mode === 'create') {
        await createAccount(form);
      } else {
        await updateAccount({ id: editing.id, data: form });
      }
      closeForm();
    } catch (err) {
      setError(err.message || 'Failed to save account');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (account) => {
    if (!window.confirm(`Delete account "${account.acctName}"? This cannot be undone if it has no active job cards.`)) return;
    try {
      await deleteAccount(account.id);
    } catch (err) {
      alert(err.message || 'Failed to delete account');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Accounts</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{accounts.length} customers</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
        >
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {/* Inline form */}
      {mode && (
        <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              {mode === 'create' ? 'New Account' : `Edit — ${editing.acctName}`}
            </h2>
            <button onClick={closeForm}><X className="w-4 h-4 text-gray-500" /></button>
          </div>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <AccountForm
            initial={mode === 'edit' ? editing : EMPTY}
            onSave={handleSave}
            onCancel={closeForm}
            saving={saving}
          />
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, city, contact…"
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {accounts.length === 0 ? 'No accounts yet. Add one to get started.' : 'No accounts match your search.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                {['Account Name','City','PIN','Fax','Telex','Contact Person',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(a => (
                <tr key={a.id} className="group hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors duration-150">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 border-l-2 border-transparent group-hover:border-blue-400 transition-colors duration-150">
                    {a.acctName}
                    {a.address && <div className="text-xs text-gray-400 font-normal">{a.address}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.city || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.pin  || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.fax  || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.telex || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.contactPerson || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button
                        onClick={() => openEdit(a)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(a)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
