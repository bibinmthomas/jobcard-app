import { useState, useMemo } from 'react';
import { useJobCards } from '../hooks/useJobCards';
import { useAccounts } from '../hooks/useAccounts';
import JobCardForm from '../components/JobCardForm';
import JobCardList from '../components/JobCardList';
import { Plus, FileText, X } from 'lucide-react';

// ─── Date range helpers ───────────────────────────────────────────────────────

function startOfDay(d) {
  const r = new Date(d); r.setHours(0, 0, 0, 0); return r;
}
function endOfDay(d) {
  const r = new Date(d); r.setHours(23, 59, 59, 999); return r;
}
function startOfWeek(d) {
  const r = new Date(d);
  const day = r.getDay(); // 0 Sun
  r.setDate(r.getDate() - ((day + 6) % 7)); // Mon
  return startOfDay(r);
}
function startOfMonth(d) {
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), 1));
}
function startOfLastMonth(d) {
  return startOfDay(new Date(d.getFullYear(), d.getMonth() - 1, 1));
}
function endOfLastMonth(d) {
  return endOfDay(new Date(d.getFullYear(), d.getMonth(), 0));
}

const PRESETS = [
  { id: 'all',      label: 'All Time' },
  { id: 'today',    label: 'Today' },
  { id: 'week',     label: 'This Week' },
  { id: 'month',    label: 'This Month' },
  { id: 'lastMonth',label: 'Last Month' },
  { id: 'last3',    label: 'Last 3 Months' },
  { id: 'custom',   label: 'Custom' },
];

function resolvePreset(id) {
  const now = new Date();
  switch (id) {
    case 'today':     return { from: startOfDay(now),          to: endOfDay(now) };
    case 'week':      return { from: startOfWeek(now),         to: endOfDay(now) };
    case 'month':     return { from: startOfMonth(now),        to: endOfDay(now) };
    case 'lastMonth': return { from: startOfLastMonth(now),    to: endOfLastMonth(now) };
    case 'last3': {
      const f = new Date(now); f.setMonth(f.getMonth() - 3);
      return { from: startOfDay(f), to: endOfDay(now) };
    }
    default: return null; // 'all' or 'custom' — handled separately
  }
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

function FilterBar({ accounts, filters, onChange }) {
  const { accountId, preset, customFrom, customTo } = filters;

  const setField = (key) => (val) => onChange({ ...filters, [key]: val });

  const hasActiveFilter = accountId !== '' || preset !== 'all';

  const clearAll = () => onChange({ accountId: '', preset: 'all', customFrom: '', customTo: '' });

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 mb-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center gap-3">

        {/* Account filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Account</label>
          <select
            value={accountId}
            onChange={e => setField('accountId')(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All accounts</option>
            {accounts.map(a => (
              <option key={a.id} value={String(a.id)}>{a.acctName}</option>
            ))}
          </select>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-200 dark:bg-gray-600" />

        {/* Date preset pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">Date</span>
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => setField('preset')(p.id)}
              className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                preset === p.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Clear button */}
        {hasActiveFilter && (
          <button
            onClick={clearAll}
            className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Custom date range row */}
      {preset === 'custom' && (
        <div className="flex items-center gap-3 pt-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">From</span>
          <input
            type="date"
            value={customFrom}
            onChange={e => setField('customFrom')(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">To</span>
          <input
            type="date"
            value={customTo}
            onChange={e => setField('customTo')(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS = { accountId: '', preset: 'all', customFrom: '', customTo: '' };

export default function JobCards() {
  const { jobCards, isLoading, createJobCard, updateJobCard, deleteJobCard, isCreating, isUpdating } = useJobCards();
  const { accounts } = useAccounts();

  const [mode, setMode]       = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError]     = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const openCreate = () => { setEditing(null); setMode('create'); setError(''); };
  const openEdit   = (card) => { setEditing(card); setMode('edit'); setError(''); };
  const closeForm  = () => { setMode(null); setEditing(null); setError(''); };

  const handleSave = async (form) => {
    setError('');
    try {
      if (mode === 'create') await createJobCard(form);
      else await updateJobCard({ id: editing.id, data: form });
      closeForm();
    } catch (err) {
      setError(err.message || 'Failed to save job card');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job card? It will be soft-deleted.')) return;
    try { await deleteJobCard(id); }
    catch (err) { alert(err.message || 'Failed to delete job card'); }
  };

  // ── Apply filters ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = jobCards;

    // Account filter
    if (filters.accountId) {
      result = result.filter(c => String(c.accountId) === filters.accountId);
    }

    // Date filter
    if (filters.preset !== 'all') {
      let from = null;
      let to   = null;

      if (filters.preset === 'custom') {
        if (filters.customFrom) from = startOfDay(new Date(filters.customFrom));
        if (filters.customTo)   to   = endOfDay(new Date(filters.customTo));
      } else {
        const range = resolvePreset(filters.preset);
        if (range) { from = range.from; to = range.to; }
      }

      if (from || to) {
        result = result.filter(c => {
          const d = new Date(c.date);
          if (from && d < from) return false;
          if (to   && d > to)   return false;
          return true;
        });
      }
    }

    return result;
  }, [jobCards, filters]);

  const isFiltered = filters.accountId !== '' || filters.preset !== 'all';

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Job Cards</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isFiltered
                ? <>{filtered.length} <span className="text-gray-400">of</span> {jobCards.length} records</>
                : <>{jobCards.length} records</>
              }
            </p>
          </div>
        </div>
        {!mode && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
          >
            <Plus className="w-4 h-4" /> New Job Card
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      {mode && (
        <div className="mb-6">
          <JobCardForm
            initial={mode === 'edit' ? editing : null}
            onSave={handleSave}
            onCancel={closeForm}
            saving={isCreating || isUpdating}
          />
        </div>
      )}

      {/* Filters */}
      {!isLoading && (
        <FilterBar
          accounts={accounts}
          filters={filters}
          onChange={setFilters}
        />
      )}

      {/* List */}
      {isLoading ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-12">Loading…</div>
      ) : (
        <JobCardList
          jobCards={filtered}
          onEdit={openEdit}
          onDelete={handleDelete}
          emptyMessage={
            isFiltered
              ? 'No job cards match the current filters.'
              : 'No job cards yet. Create one to get started.'
          }
        />
      )}
    </div>
  );
}
