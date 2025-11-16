import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

export function useCustomFields() {
  const queryClient = useQueryClient();

  const { data: customFields = [], isLoading, error } = useQuery({
    queryKey: ['customFields'],
    queryFn: () => api.customFields.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.customFields.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
      queryClient.invalidateQueries({ queryKey: ['fieldCategories'] });
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.customFields.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
      queryClient.invalidateQueries({ queryKey: ['fieldCategories'] });
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.customFields.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
      queryClient.invalidateQueries({ queryKey: ['fieldCategories'] });
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
    },
  });

  return {
    customFields,
    isLoading,
    error,
    createCustomField: createMutation.mutate,
    updateCustomField: updateMutation.mutate,
    deleteCustomField: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
