import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

export function useAccounts() {
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.accounts.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.accounts.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.accounts.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
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
    createAccount: createMutation.mutateAsync,
    updateAccount: updateMutation.mutateAsync,
    deleteAccount: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
