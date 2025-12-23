/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import { api } from '../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Folder, Check, AlertCircle } from 'lucide-react';
import ThemeSettings from './ThemeSettings';

export default function AdminSettings() {
  const { settings, setSetting, isUpdating } = useSettings();
  const [exportPath, setExportPath] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Load export path from settings
    const value = settings?.exportPath?.value;
    if (value !== undefined && value !== null) {
      setExportPath((prev) => (prev === value ? prev : value));
    }
  }, [settings?.exportPath?.value]);

  const handleSelectFolder = async () => {
    try {
      const result = await api.fileSystem.selectFolder({
        title: 'Select PDF Export Folder',
        defaultPath: exportPath,
      });

      if (!result.canceled) {
        setExportPath(result.folderPath);
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const handleSave = () => {
    if (!exportPath.trim()) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    setSetting(
      { key: 'exportPath', value: exportPath },
      {
        onSuccess: () => {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        },
        onError: () => {
          setShowError(true);
          setTimeout(() => setShowError(false), 3000);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Application Settings</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure export paths and other application preferences
        </p>
      </div>

      {/* Export Path Setting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">PDF Export Path</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Export Folder Location
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Choose where generated PDF files will be saved by default
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                value={exportPath}
                onChange={(e) => setExportPath(e.target.value)}
                placeholder="Select a folder path..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSelectFolder}
                className="flex items-center gap-2"
              >
                <Folder className="w-4 h-4" />
                Browse
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={isUpdating || !exportPath.trim()}
              className="flex items-center gap-2"
            >
              {isUpdating ? 'Saving...' : 'Save Settings'}
            </Button>

            {showSuccess && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <Check className="w-4 h-4" />
                <span>Settings saved successfully!</span>
              </div>
            )}

            {showError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Failed to save settings. Please try again.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <ThemeSettings />
    </div>
  );
}
