import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

export default function ThemeSettings() {
  const { theme, resolvedTheme, changeTheme } = useTheme();
  const [isChanging, setIsChanging] = useState(false);

  const themeOptions = [
    {
      value: 'light',
      label: 'Light',
      description: 'Always use light theme',
      icon: Sun,
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Always use dark theme',
      icon: Moon,
    },
    {
      value: 'system',
      label: 'System',
      description: 'Follow system preference',
      icon: Monitor,
    },
  ];

  const handleThemeChange = async (newTheme) => {
    setIsChanging(true);
    await changeTheme(newTheme);
    setIsChanging(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Theme Preference</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose your preferred theme or follow your system preference
          </p>

          <div className="space-y-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  disabled={isChanging}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all
                    ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                    }
                    ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div
                    className={`
                      flex items-center justify-center w-12 h-12 rounded-lg
                      ${
                        isSelected
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }
                    `}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {option.description}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center justify-center w-6 h-6">
                      <Check className="w-5 h-5 text-blue-500" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current theme indicator */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="font-medium">Currently active:</div>
            <div className="flex items-center gap-1">
              {resolvedTheme === 'dark' ? (
                <>
                  <Moon className="w-4 h-4" />
                  <span>Dark theme</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4" />
                  <span>Light theme</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
