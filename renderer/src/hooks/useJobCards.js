import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

export function useJobCards() {
  const queryClient = useQueryClient();

  const { data: jobCards = [], isLoading, error } = useQuery({
    queryKey: ['jobcards'],
    queryFn: () => api.jobcards.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.jobcards.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobcards'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.jobcards.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobcards'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.jobcards.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobcards'] });
    },
  });

  return {
    jobCards,
    isLoading,
    error,
    createJobCard: createMutation.mutate,
    updateJobCard: updateMutation.mutate,
    deleteJobCard: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useJobCard(id) {
  return useQuery({
    queryKey: ['jobcards', id],
    queryFn: () => api.jobcards.get(id),
    enabled: !!id,
  });
}
