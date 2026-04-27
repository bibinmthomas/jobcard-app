import { useState, useMemo } from 'react';
import { PDFViewer, PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { useJobCards } from '../hooks/useJobCards';
import { useAccounts } from '../hooks/useAccounts';
import ReportPDFTemplate from '../components/ReportPDFTemplate';
import { BarChart2, Download, Save, RefreshCw, Clock } from 'lucide-react';
import { api } from '../utils/api';

// ─── Date helpers (local — same logic as JobCards) ────────────────────────────

function startOfDay(d) { const r = new Date(d); r.setHours(0,0,0,0); return r; }
function endOfDay(d)   { const r = new Date(d); r.setHours(23,59,59,999); return r; }
function startOfWeek(d) {
  const r = new Date(d);
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7));
  return startOfDay(r);
}
function startOfMonth(d)    { return startOfDay(new Date(d.getFullYear(), d.getMonth(), 1)); }
function startOfLastMonth(d){ return startOfDay(new Date(d.getFullYear(), d.getMonth()-1, 1)); }
function endOfLastMonth(d)  { return endOfDay(new Date(d.getFullYear(), d.getMonth(), 0)); }

const PRESETS = [
  { id: 'all',       label: 'All Time'    },
  { id: 'today',     label: 'Today'       },
  { id: 'week',      label: 'This Week'   },
  { id: 'month',     label: 'This Month'  },
  { id: 'lastMonth', label: 'Last Month'  },
  { id: 'last3',     label: 'Last 3 Months' },
  { id: 'custom',    label: 'Custom'      },
];

function resolvePreset(id) {
  const now = new Date();
  switch (id) {
    case 'today':     return { from: startOfDay(now),       to: endOfDay(now)         };
    case 'week':      return { from: startOfWeek(now),      to: endOfDay(now)         };
    case 'month':     return { from: startOfMonth(now),     to: endOfDay(now)         };
    case 'lastMonth': return { from: startOfLastMonth(now), to: endOfLastMonth(now)   };
    case 'last3': {
      const f = new Date(now); f.setMonth(f.getMonth() - 3);
      return { from: startOfDay(f), to: endOfDay(now) };
    }
    default: return null;
  }
}

function presetLabel(id, customFrom, customTo) {
  if (id === 'custom') {
    if (customFrom && customTo) return `${customFrom} → ${customTo}`;
    if (customFrom) return `From ${customFrom}`;
    if (customTo)   return `To ${customTo}`;
    return 'Custom';
  }
  return PRESETS.find(p => p.id === id)?.label || id;
}

// ─── Report types ─────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  { id: 'jobCardList', label: 'Job Card List by Date', available: true  },
  { id: 'byOperator',  label: 'By Operator',           available: false },
  { id: 'byAccount',   label: 'By Account',            available: false },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

const INIT = {
  reportType: 'jobCardList',
  accountId:  '',
  operator:   '',
  preset:     'month',
  customFrom: '',
  customTo:   '',
};

export default function Reports() {
  const { jobCards } = useJobCards();
  const { accounts } = useAccounts();

  const [filters, setFilters]     = useState(INIT);
  const [generated, setGenerated] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState('');

  const setField = (k) => (v) => {
    setFilters(prev => ({ ...prev, [k]: v }));
    setGenerated(false); // reset preview when filters change
  };

  // ── Compute filtered cards ─────────────────────────────────────────────────
  const filteredCards = useMemo(() => {
    let result = jobCards;

    if (filters.accountId) {
      result = result.filter(c => String(c.accountId) === filters.accountId);
    }
    if (filters.operator.trim()) {
      const op = filters.operator.trim().toLowerCase();
      result = result.filter(c => (c.operator || '').toLowerCase().includes(op));
    }

    let from = null, to = null;
    if (filters.preset === 'custom') {
      if (filters.customFrom) from = startOfDay(new Date(filters.customFrom));
      if (filters.customTo)   to   = endOfDay(new Date(filters.customTo));
    } else if (filters.preset !== 'all') {
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

    return result;
  }, [jobCards, filters]);

  // ── Build report metadata for the PDF ─────────────────────────────────────
  const reportMeta = useMemo(() => {
    const acct = filters.accountId
      ? accounts.find(a => String(a.id) === filters.accountId)?.acctName
      : null;
    return {
      title:         'Job Card List Report',
      dateLabel:     presetLabel(filters.preset, filters.customFrom, filters.customTo),
      accountLabel:  acct  || null,
      operatorLabel: filters.operator.trim() || null,
      generatedAt:   new Date().toLocaleString(),
    };
  }, [filters, accounts]);

  const filename = `report-${Date.now()}.pdf`;

  const handleSaveToDisk = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const blob = await pdf(
        <ReportPDFTemplate cards={filteredCards} reportMeta={reportMeta} />
      ).toBlob();
      const bytes = Array.from(new Uint8Array(await blob.arrayBuffer()));
      const result = await api.pdf.saveToDisk({ filename, bytes });
      setSaveMsg(`Saved: ${result.path}`);
    } catch (err) {
      setSaveMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <BarChart2 className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Generate and export job card reports</p>
        </div>
      </div>

      {/* Config panel */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm mb-6">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Report Configuration</h2>
        </div>
        <div className="p-5 space-y-5">

          {/* Report type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Report Type
            </label>
            <div className="flex gap-3 flex-wrap">
              {REPORT_TYPES.map(rt => (
                <button
                  key={rt.id}
                  disabled={!rt.available}
                  onClick={() => rt.available && setField('reportType')(rt.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    filters.reportType === rt.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : rt.available
                        ? 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {rt.label}
                  {!rt.available && (
                    <span className="flex items-center gap-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded font-normal">
                      <Clock className="w-3 h-3" /> Soon
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Filters grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Account */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Account
              </label>
              <select
                value={filters.accountId}
                onChange={e => setField('accountId')(e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All accounts</option>
                {accounts.map(a => (
                  <option key={a.id} value={String(a.id)}>{a.acctName}</option>
                ))}
              </select>
            </div>

            {/* Operator */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Operator
              </label>
              <input
                value={filters.operator}
                onChange={e => setField('operator')(e.target.value)}
                placeholder="All operators"
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Date Range
            </label>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setField('preset')(p.id)}
                  className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                    filters.preset === p.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {filters.preset === 'custom' && (
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">From</span>
                <input
                  type="date"
                  value={filters.customFrom}
                  onChange={e => setField('customFrom')(e.target.value)}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">To</span>
                <input
                  type="date"
                  value={filters.customTo}
                  onChange={e => setField('customTo')(e.target.value)}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Generate */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setGenerated(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Generate Report
            </button>
            {generated && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {filteredCards.length} record{filteredCards.length !== 1 ? 's' : ''} found
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Preview panel */}
      {generated && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Report Preview</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {reportMeta.dateLabel} · {filteredCards.length} records
              </p>
            </div>
            <div className="flex items-center gap-2">
              <PDFDownloadLink
                document={<ReportPDFTemplate cards={filteredCards} reportMeta={reportMeta} />}
                fileName={filename}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                {({ loading }) => (
                  <><Download className="w-3.5 h-3.5" />{loading ? 'Building…' : 'Download PDF'}</>
                )}
              </PDFDownloadLink>

              <button
                onClick={handleSaveToDisk}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving…' : 'Save to Disk'}
              </button>
            </div>
          </div>

          {saveMsg && (
            <div className={`px-5 py-2 text-xs border-b ${
              saveMsg.startsWith('Error')
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-green-50 text-green-700 border-green-200'
            }`}>
              {saveMsg}
            </div>
          )}

          {/* Inline PDF viewer */}
          <div style={{ height: '680px' }}>
            <PDFViewer width="100%" height="100%" showToolbar={false}>
              <ReportPDFTemplate cards={filteredCards} reportMeta={reportMeta} />
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
}
