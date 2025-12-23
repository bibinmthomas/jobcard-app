import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

export function useAccounts() {
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.accounts.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.accounts.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['jobcards'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.accounts.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['jobcards'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.accounts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['jobcards'] });
    },
  });

  return {
    accounts,
    isLoading,
    error,
    createAccount: createMutation.mutate,
    updateAccount: updateMutation.mutate,
    deleteAccount: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
