import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { Trash2, Database, AlertTriangle, RefreshCw } from 'lucide-react';

function StatRow({ label, active, deleted }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <div className="flex gap-4 text-sm">
        <span className="text-gray-900 dark:text-gray-100 font-medium">{active} active</span>
        {deleted > 0 && (
          <span className="text-red-500 font-medium">{deleted} deleted</span>
        )}
      </div>
    </div>
  );
}

export default function DatabaseManagement() {
  const queryClient = useQueryClient();
  const [confirmBin, setConfirmBin]   = useState(false);
  const [confirmAll, setConfirmAll]   = useState(false);
  const [message, setMessage]         = useState('');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['database', 'stats'],
    queryFn: () => api.database.getStats(),
    refetchInterval: 5000,
  });

  const clearDeletedMutation = useMutation({
    mutationFn: () => api.database.clearDeleted(),
    onSuccess: (res) => {
      queryClient.invalidateQueries();
      const counts = res.deleted || {};
      setMessage(`Recycle bin emptied. Removed: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}`);
      setConfirmBin(false);
    },
    onError: (err) => { setMessage(`Error: ${err.message}`); setConfirmBin(false); },
  });

  const clearAllMutation = useMutation({
    mutationFn: () => api.database.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setMessage('All data cleared. Settings and users preserved.');
      setConfirmAll(false);
    },
    onError: (err) => { setMessage(`Error: ${err.message}`); setConfirmAll(false); },
  });

  const hasDeleted = stats
    ? (stats.jobCards?.deleted || 0) + (stats.accounts?.deleted || 0) + (stats.formFields?.deleted || 0) > 0
    : false;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Database Management</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Monitor data and perform maintenance operations.</p>
      </div>

      {message && (
        <div className="px-4 py-3 text-sm rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          {message}
        </div>
      )}

      {/* Stats */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-gray-500" />
          <h3 className="font-medium text-gray-900 dark:text-gray-100">Record Counts</h3>
          {isLoading && <RefreshCw className="w-3.5 h-3.5 text-gray-400 animate-spin ml-auto" />}
        </div>
        {stats ? (
          <div>
            <StatRow label="Job Cards"    active={stats.jobCards?.active   || 0} deleted={stats.jobCards?.deleted   || 0} />
            <StatRow label="Accounts"     active={stats.accounts?.active   || 0} deleted={stats.accounts?.deleted   || 0} />
            <StatRow label="Form Fields"  active={stats.formFields?.active || 0} deleted={stats.formFields?.deleted || 0} />
            <div className="flex items-center justify-between pt-2 mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">Users</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{stats.users?.total || 0}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading stats…</p>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Empty recycle bin */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Empty Recycle Bin</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Permanently delete all soft-deleted records. This cannot be undone.
              </p>
            </div>
            {!confirmBin ? (
              <button
                onClick={() => setConfirmBin(true)}
                disabled={!hasDeleted}
                className="px-4 py-2 text-sm font-medium text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                Empty Bin
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setConfirmBin(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={() => clearDeletedMutation.mutate()}
                  disabled={clearDeletedMutation.isPending}
                  className="px-3 py-1.5 text-sm text-white bg-orange-600 hover:bg-orange-700 rounded-lg font-medium"
                >
                  {clearDeletedMutation.isPending ? 'Working…' : 'Confirm'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reset all data */}
        <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-700 dark:text-red-400">Reset All Data</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Permanently delete <strong>all</strong> job cards, accounts, and form fields.
                  User accounts and settings are preserved.
                </p>
              </div>
            </div>
            {!confirmAll ? (
              <button
                onClick={() => setConfirmAll(true)}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Reset All
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setConfirmAll(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={() => clearAllMutation.mutate()}
                  disabled={clearAllMutation.isPending}
                  className="px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium"
                >
                  {clearAllMutation.isPending ? 'Clearing…' : 'Yes, Reset'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
