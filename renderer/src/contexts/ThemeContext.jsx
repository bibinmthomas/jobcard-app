/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const ThemeContext = createContext();

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('system'); // 'light', 'dark', or 'system'
  const [resolvedTheme, setResolvedTheme] = useState('light'); // actual theme being applied
  const [isLoading, setIsLoading] = useState(true);

  // Detect system theme preference
  const getSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };

  // Apply theme to document
  const applyTheme = (themeToApply) => {
    const root = window.document.documentElement;

    if (themeToApply === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  // Resolve theme (convert 'system' to actual theme)
  const resolveTheme = (themeValue) => {
    if (themeValue === 'system') {
      return getSystemTheme();
    }
    return themeValue;
  };

  // Load theme from settings on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const themeSetting = await api.settings.get('theme');
        if (themeSetting && themeSetting.value) {
          const themeValue = themeSetting.value;
          setTheme(themeValue);
          const resolved = resolveTheme(themeValue);
          setResolvedTheme(resolved);
          applyTheme(resolved);
        } else {
          // Default to system theme
          const systemTheme = getSystemTheme();
          setResolvedTheme(systemTheme);
          applyTheme(systemTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        // Fallback to light theme
        const systemTheme = getSystemTheme();
        setResolvedTheme(systemTheme);
        applyTheme(systemTheme);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newTheme);
      applyTheme(newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  // Change theme
  const changeTheme = async (newTheme) => {
    try {
      // Save to database
      await api.settings.set('theme', newTheme);

      // Update state
      setTheme(newTheme);
      const resolved = resolveTheme(newTheme);
      setResolvedTheme(resolved);
      applyTheme(resolved);

      return { success: true };
    } catch (error) {
      console.error('Error changing theme:', error);
      return { success: false, error };
    }
  };

  const value = {
    theme, // User's theme preference: 'light', 'dark', 'system'
    resolvedTheme, // Actual theme being applied: 'light' or 'dark'
    changeTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
