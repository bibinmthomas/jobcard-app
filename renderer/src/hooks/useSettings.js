import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

export function useSettings() {
  const queryClient = useQueryClient();

  const { data: settings = {}, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.settings.getAll(),
  });

  const setMutation = useMutation({
    mutationFn: ({ key, value }) => api.settings.set(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  return {
    settings,
    isLoading,
    error,
    setSetting: setMutation.mutate,
    isUpdating: setMutation.isPending,
  };
}

export function useSetting(key) {
  const { data: setting, isLoading, error } = useQuery({
    queryKey: ['settings', key],
    queryFn: () => api.settings.get(key),
    enabled: !!key,
  });

  return {
    setting,
    isLoading,
    error,
  };
}

export function useExportPath() {
  const { data: exportPath, isLoading, error } = useQuery({
    queryKey: ['settings', 'exportPath'],
    queryFn: () => api.settings.getExportPath(),
  });

  return {
    exportPath,
    isLoading,
    error,
  };
}
