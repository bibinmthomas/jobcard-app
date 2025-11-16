import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

export function useLayouts() {
  const queryClient = useQueryClient();

  const { data: layouts = [], isLoading, error } = useQuery({
    queryKey: ['layouts'],
    queryFn: () => api.layouts.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.layouts.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.layouts.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.layouts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
    },
  });

  return {
    layouts,
    isLoading,
    error,
    createLayout: createMutation.mutate,
    updateLayout: updateMutation.mutate,
    deleteLayout: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useLayout(id) {
  return useQuery({
    queryKey: ['layouts', id],
    queryFn: () => api.layouts.get(id),
    enabled: !!id,
  });
}
