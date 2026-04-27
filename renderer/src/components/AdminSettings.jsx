import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Folder, Check, AlertCircle } from 'lucide-react';
import ThemeSettings from './ThemeSettings';

export default function AdminSettings() {
  const [exportPath, setExportPath] = useState('');
  const [status, setStatus]         = useState(null); // 'success' | 'error' | null
  const [saving, setSaving]         = useState(false);

  // Load current export path on mount
  useEffect(() => {
    api.settings.getExportPath()
      .then(p => setExportPath(p || ''))
      .catch(() => {});
  }, []);

  const handleSelectFolder = async () => {
    try {
      const result = await api.fileSystem.selectFolder({ title: 'Select PDF Export Folder' });
      if (!result.canceled && result.folderPath) {
        setExportPath(result.folderPath);
      }
    } catch (err) {
      console.error('[AdminSettings] selectFolder error:', err);
    }
  };

  const handleSave = async () => {
    if (!exportPath.trim()) return;
    setSaving(true);
    setStatus(null);
    try {
      await api.settings.set('exportPath', exportPath.trim());
      setStatus('success');
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Configure export path and appearance.</p>
      </div>

      {/* Export Path */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">PDF Export Directory</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Where generated PDFs are saved when using "Save to Disk".
        </p>
        <div className="flex gap-2 mb-3">
          <input
            value={exportPath}
            onChange={e => setExportPath(e.target.value)}
            placeholder="e.g. C:\Users\You\Documents\JobCards"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSelectFolder}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Folder className="w-4 h-4" />
            Browse
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !exportPath.trim()}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {status === 'success' && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check className="w-4 h-4" /> Saved
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" /> Failed to save
            </span>
          )}
        </div>
      </div>

      {/* Theme */}
      <ThemeSettings />
    </div>
  );
}
