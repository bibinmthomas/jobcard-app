import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

export function useJobCards() {
  const queryClient = useQueryClient();

  const { data: jobCards = [], isLoading, error } = useQuery({
    queryKey: ['jobcards'],
    queryFn: () => api.jobcards.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.jobcards.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobcards'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.jobcards.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobcards'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.jobcards.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobcards'] }),
  });

  return {
    jobCards,
    isLoading,
    error,
    createJobCard: createMutation.mutateAsync,
    updateJobCard: updateMutation.mutateAsync,
    deleteJobCard: deleteMutation.mutateAsync,
    isCreating:    createMutation.isPending,
    isUpdating:    updateMutation.isPending,
    isDeleting:    deleteMutation.isPending,
  };
}
