import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

export function useFieldCategories() {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['fieldCategories'],
    queryFn: () => api.fieldCategories.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.fieldCategories.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fieldCategories'] });
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.fieldCategories.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fieldCategories'] });
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.fieldCategories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fieldCategories'] });
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
    },
  });

  return {
    categories,
    isLoading,
    error,
    createCategory: createMutation.mutate,
    updateCategory: updateMutation.mutate,
    deleteCategory: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useFieldCategory(id) {
  const { data: category, isLoading, error } = useQuery({
    queryKey: ['fieldCategories', id],
    queryFn: () => api.fieldCategories.get(id),
    enabled: !!id,
  });

  return {
    category,
    isLoading,
    error,
  };
}
