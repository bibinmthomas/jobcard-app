import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

export function useFormFields() {
  const queryClient = useQueryClient();

  const { data: formFields = [], isLoading, error } = useQuery({
    queryKey: ['formFields'],
    queryFn: () => api.formFields.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.formFields.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['formFields'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.formFields.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['formFields'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.formFields.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['formFields'] }),
  });

  return {
    formFields,
    isLoading,
    error,
    createFormField: createMutation.mutateAsync,
    updateFormField: updateMutation.mutateAsync,
    deleteFormField: deleteMutation.mutateAsync,
    isCreating:      createMutation.isPending,
    isUpdating:      updateMutation.isPending,
    isDeleting:      deleteMutation.isPending,
  };
}
