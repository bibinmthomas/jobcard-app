import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Trash2, Database, HardDrive, AlertTriangle } from 'lucide-react';

export default function DatabaseManagement() {
  const queryClient = useQueryClient();
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [showClearDeletedConfirm, setShowClearDeletedConfirm] = useState(false);

  // Fetch database statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['database', 'stats'],
    queryFn: () => api.database.getStats(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Mutation for clearing deleted records
  const clearDeletedMutation = useMutation({
    mutationFn: () => api.database.clearDeleted(),
    onSuccess: (result) => {
      queryClient.invalidateQueries(['database', 'stats']);
      queryClient.invalidateQueries(['jobcards']);
      queryClient.invalidateQueries(['layouts']);
      queryClient.invalidateQueries(['fieldCategories']);
      queryClient.invalidateQueries(['accounts']);
      alert(`Successfully cleared deleted records:\n- ${result.deleted.jobCards} job cards\n- ${result.deleted.layouts} layouts\n- ${result.deleted.categories} categories\n- ${result.deleted.customFields} custom fields\n- ${result.deleted.accounts} accounts`);
      setShowClearDeletedConfirm(false);
    },
    onError: (error) => {
      alert('Error clearing deleted records: ' + error.message);
    },
  });

  // Mutation for clearing all database data
  const clearAllMutation = useMutation({
    mutationFn: () => api.database.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries(['database', 'stats']);
      queryClient.invalidateQueries(['jobcards']);
      queryClient.invalidateQueries(['layouts']);
      queryClient.invalidateQueries(['fieldCategories']);
      queryClient.invalidateQueries(['accounts']);
      alert('All database data has been cleared successfully.');
      setShowClearAllConfirm(false);
    },
    onError: (error) => {
      alert('Error clearing database: ' + error.message);
    },
  });

  const handleClearDeleted = () => {
    if (showClearDeletedConfirm) {
      clearDeletedMutation.mutate();
    } else {
      setShowClearDeletedConfirm(true);
    }
  };

  const handleClearAll = () => {
    if (showClearAllConfirm) {
      clearAllMutation.mutate();
    } else {
      setShowClearAllConfirm(true);
    }
  };

  const formatBytes = (total) => {
    // Rough estimate: assume 1KB per record on average
    const bytes = total * 1024;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        Loading database statistics...
      </div>
    );
  }

  const totalRecords =
    stats.jobCards.total +
    stats.layouts.total +
    stats.categories.total +
    stats.customFields.total +
    stats.accounts.total;
  const deletedRecords =
    stats.jobCards.deleted +
    stats.layouts.deleted +
    stats.categories.deleted +
    stats.customFields.deleted +
    stats.accounts.deleted;
  const estimatedSize = formatBytes(totalRecords);
  const deletedSize = formatBytes(deletedRecords);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Database Management</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Monitor database usage and manage storage
        </p>
      </div>

      {/* Database Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Statistics
          </CardTitle>
          <CardDescription>Current database storage and record counts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Overall Stats */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Overall</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Records</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{totalRecords}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Estimated Size</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{estimatedSize}</span>
                </div>
              </div>
            </div>

            {/* Deleted Stats */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Recycle Bin</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Deleted Records</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">{deletedRecords}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Recoverable Space</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">{deletedSize}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Record Breakdown</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Job Cards</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{stats.jobCards.total} total</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Active: {stats.jobCards.active}</span>
                  <span className="text-red-600 dark:text-red-400">Deleted: {stats.jobCards.deleted}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Layouts</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{stats.layouts.total} total</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Active: {stats.layouts.active}</span>
                  <span className="text-red-600 dark:text-red-400">Deleted: {stats.layouts.deleted}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Field Categories</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{stats.categories.total} total</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Active: {stats.categories.active}</span>
                  <span className="text-red-600 dark:text-red-400">Deleted: {stats.categories.deleted}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Custom Fields</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{stats.customFields.total} total</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Active: {stats.customFields.active}</span>
                  <span className="text-red-600 dark:text-red-400">Deleted: {stats.customFields.deleted}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Accounts</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{stats.accounts.total} total</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Active: {stats.accounts.active}</span>
                  <span className="text-red-600 dark:text-red-400">Deleted: {stats.accounts.deleted}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Storage Management
          </CardTitle>
          <CardDescription>Clear deleted records or reset the entire database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Empty Recycle Bin */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Empty Recycle Bin</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Permanently delete all soft-deleted records. This will free up {deletedSize} of space.
                </p>
                {showClearDeletedConfirm && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded mb-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      This will permanently delete {deletedRecords} records. Are you sure?
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                {showClearDeletedConfirm && (
                  <Button
                    variant="outline"
                    onClick={() => setShowClearDeletedConfirm(false)}
                    disabled={clearDeletedMutation.isPending}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  variant={showClearDeletedConfirm ? 'destructive' : 'outline'}
                  onClick={handleClearDeleted}
                  disabled={clearDeletedMutation.isPending || deletedRecords === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {clearDeletedMutation.isPending
                    ? 'Clearing...'
                    : showClearDeletedConfirm
                    ? 'Confirm Delete'
                    : 'Empty Recycle Bin'}
                </Button>
              </div>
            </div>
          </div>

          {/* Reset Database */}
          <div className="p-4 border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">Reset Database</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  Permanently delete ALL data including job cards, layouts, categories, and custom fields. This action cannot be undone!
                </p>
                {showClearAllConfirm && (
                  <div className="flex items-center gap-2 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-900 dark:text-red-200 font-semibold">
                      WARNING: This will delete ALL {totalRecords} records permanently. Are you absolutely sure?
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                {showClearAllConfirm && (
                  <Button
                    variant="outline"
                    onClick={() => setShowClearAllConfirm(false)}
                    disabled={clearAllMutation.isPending}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={handleClearAll}
                  disabled={clearAllMutation.isPending}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {clearAllMutation.isPending
                    ? 'Resetting...'
                    : showClearAllConfirm
                    ? 'Yes, Delete Everything'
                    : 'Reset Database'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
