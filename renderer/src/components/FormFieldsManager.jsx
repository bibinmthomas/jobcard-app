import { useState } from 'react';
import { useFormFields } from '../hooks/useFormFields';
import { Plus, Trash2, Pencil, X, GripVertical } from 'lucide-react';

const TYPES = [
  { value: 'string',      label: 'Text (String)' },
  { value: 'number',      label: 'Number' },
  { value: 'date',        label: 'Date' },
  { value: 'multiselect', label: 'Multi-Select' },
];

const EMPTY_FORM = {
  name: '', label: '', type: 'string', options: '', required: false, order: 0,
};

function FieldForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [error, setError] = useState('');

  const set = (k) => (e) =>
    setForm(prev => ({ ...prev, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim())  { setError('Name is required'); return; }
    if (!form.label.trim()) { setError('Label is required'); return; }
    if (form.type === 'multiselect') {
      const opts = form.options.split(',').map(o => o.trim()).filter(Boolean);
      if (opts.length === 0) { setError('Add at least one option (comma-separated)'); return; }
    }

    const payload = {
      ...form,
      options: form.type === 'multiselect'
        ? form.options.split(',').map(o => o.trim()).filter(Boolean)
        : undefined,
      order: parseInt(form.order, 10) || 0,
    };
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Field Name <span className="text-red-500">*</span>
            <span className="font-normal text-gray-400 ml-1">(used as key, no spaces)</span>
          </label>
          <input
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. machine_type"
            disabled={!!initial}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Display Label <span className="text-red-500">*</span>
          </label>
          <input
            value={form.label}
            onChange={set('label')}
            placeholder="e.g. Machine Type"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
          <select
            value={form.type}
            onChange={set('type')}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Order</label>
          <input
            type="number"
            value={form.order}
            onChange={set('order')}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.required}
              onChange={set('required')}
              className="rounded border-gray-300"
            />
            Required
          </label>
        </div>
      </div>

      {form.type === 'multiselect' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Options <span className="text-red-500">*</span>
            <span className="font-normal text-gray-400 ml-1">(comma-separated)</span>
          </label>
          <input
            value={form.options}
            onChange={set('options')}
            placeholder="Option A, Option B, Option C"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg">
          {saving ? 'Saving…' : initial ? 'Update Field' : 'Add Field'}
        </button>
      </div>
    </form>
  );
}

const TYPE_BADGE = {
  string:      'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  number:      'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  date:        'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  multiselect: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
};

export default function FormFieldsManager() {
  const { formFields, isLoading, createFormField, updateFormField, deleteFormField, isCreating, isUpdating } = useFormFields();
  const [mode, setMode]       = useState(null); // null | 'create' | 'edit'
  const [editing, setEditing] = useState(null);
  const [error, setError]     = useState('');

  const openCreate = () => { setEditing(null); setMode('create'); setError(''); };
  const openEdit   = (f)  => {
    setEditing({
      ...f,
      options: f.options ? JSON.parse(f.options).join(', ') : '',
    });
    setMode('edit');
    setError('');
  };
  const closeForm = () => { setMode(null); setEditing(null); setError(''); };

  const handleSave = async (payload) => {
    setError('');
    try {
      if (mode === 'create') {
        await createFormField(payload);
      } else {
        await updateFormField({ id: editing.id, data: payload });
      }
      closeForm();
    } catch (err) {
      setError(err.message || 'Save failed');
    }
  };

  const handleDelete = async (field) => {
    if (!window.confirm(`Delete field "${field.label}"? This will remove it from all future job cards.`)) return;
    try {
      await deleteFormField(field.id);
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Form Fields</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Extra fields that appear in every job card form in addition to the fixed fields.
          </p>
        </div>
        {!mode && (
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
            <Plus className="w-4 h-4" /> Add Field
          </button>
        )}
      </div>

      {/* Inline form */}
      {mode && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {mode === 'create' ? 'New Field' : `Edit — ${editing.label}`}
            </h3>
            <button onClick={closeForm}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <FieldForm
            initial={mode === 'edit' ? editing : null}
            onSave={handleSave}
            onCancel={closeForm}
            saving={isCreating || isUpdating}
          />
        </div>
      )}

      {/* Fields list */}
      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
      ) : formFields.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
          No extra fields defined. Add one above to extend the job card form.
        </div>
      ) : (
        <div className="space-y-2">
          {formFields.map(field => (
            <div key={field.id}
              className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 shadow-sm">
              <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{field.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TYPE_BADGE[field.type] || TYPE_BADGE.string}`}>
                    {TYPES.find(t => t.value === field.type)?.label || field.type}
                  </span>
                  {field.required && (
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">required</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 font-mono mt-0.5">key: {field.name}</div>
                {field.options && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Options: {JSON.parse(field.options).join(', ')}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => openEdit(field)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(field)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
