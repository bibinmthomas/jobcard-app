import { useState, useMemo } from 'react';
import { useJobCards } from '../hooks/useJobCards';
import { useAccounts } from '../hooks/useAccounts';
import JobCardForm from '../components/JobCardForm';
import JobCardList from '../components/JobCardList';
import { Plus, FileText, X, Search, ArrowUpDown } from 'lucide-react';

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

const SORT_OPTIONS = [
  { value: 'date_desc',     label: 'Date (Newest)' },
  { value: 'date_asc',      label: 'Date (Oldest)' },
  { value: 'jobno_asc',     label: 'Job No (A→Z)' },
  { value: 'jobno_desc',    label: 'Job No (Z→A)' },
  { value: 'customer_asc',  label: 'Customer (A→Z)' },
  { value: 'customer_desc', label: 'Customer (Z→A)' },
  { value: 'amount_desc',   label: 'Amount (High→Low)' },
  { value: 'amount_asc',    label: 'Amount (Low→High)' },
];

function FilterBar({ accounts, filters, onChange, sort, onSort }) {
  const { accountId, preset, customFrom, customTo, search } = filters;

  const setField = (key) => (val) => onChange({ ...filters, [key]: val });

  const hasActiveFilter = accountId !== '' || preset !== 'all' || search !== '';

  const clearAll = () => onChange({ accountId: '', preset: 'all', customFrom: '', customTo: '', search: '' });

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 mb-4 shadow-sm space-y-3">

      {/* Row 1: account + date filters + clear */}
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

        {hasActiveFilter && (
          <button
            onClick={clearAll}
            className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Row 2: full-width search + sort on the right */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by job no, customer, part name, bill no…"
            value={search}
            onChange={e => setField('search')(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={sort}
            onChange={e => onSort(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3 (conditional): custom date range */}
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

const DEFAULT_FILTERS = { accountId: '', preset: 'week', customFrom: '', customTo: '', search: '' };

export default function JobCards() {
  const { jobCards, isLoading, createJobCard, updateJobCard, deleteJobCard, isCreating, isUpdating } = useJobCards();
  const { accounts } = useAccounts();

  const [mode, setMode]       = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError]     = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort]       = useState('date_desc');

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

    // Search filter
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(c =>
        [c.jobNo, c.customer, c.partName, c.billNo, c.poNo, c.contNo, c.ogcNo, c.operator, c.progNo]
          .some(v => v && String(v).toLowerCase().includes(q))
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'date_asc':
        case 'date_desc': {
          const ta = a.date ? new Date(a.date).getTime() : 0;
          const tb = b.date ? new Date(b.date).getTime() : 0;
          return sort === 'date_asc' ? ta - tb : tb - ta;
        }
        case 'jobno_asc':     return (a.jobNo || '').localeCompare(b.jobNo || '');
        case 'jobno_desc':    return (b.jobNo || '').localeCompare(a.jobNo || '');
        case 'customer_asc':  return (a.customer || '').localeCompare(b.customer || '');
        case 'customer_desc': return (b.customer || '').localeCompare(a.customer || '');
        case 'amount_asc':    return parseFloat(a.amount || 0) - parseFloat(b.amount || 0);
        case 'amount_desc':   return parseFloat(b.amount || 0) - parseFloat(a.amount || 0);
        default:              return 0;
      }
    });

    return result;
  }, [jobCards, filters, sort]);

  const isFiltered = filters.accountId !== '' || filters.preset !== 'all' || filters.search !== '';

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
          sort={sort}
          onSort={setSort}
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
