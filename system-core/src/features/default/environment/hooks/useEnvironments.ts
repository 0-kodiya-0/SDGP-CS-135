// useEnvironments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEnvironment, updateEnvironment, createEnvironment, getEnvironmentByAccountId } from '../api';
import { Environment } from '../types/data.ts';

export const useEnvironment = (id: number | undefined) => {
    return useQuery({
        queryKey: ['environments', id],
        queryFn: () => {
            if (!id) throw new Error('Environment ID is required');
            return getEnvironment(id);
        },
        enabled: !!id
    });
};

export const useEnvironmentByAccountId = (accountId: number) => {
    return useQuery({
        queryKey: ['environments', 'byAccount', accountId],
        queryFn: () => {
            if (!accountId) throw new Error('Account ID is required');
            return getEnvironmentByAccountId(accountId);
        },
        enabled: !!accountId
    });
};

export const useUpdateEnvironment = (accountId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Environment> }) =>
            updateEnvironment(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['environments', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['environments', 'byAccount', accountId] });
        }
    });
};

export const useCreateEnvironment = (accountId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createEnvironment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['environments'] });
            queryClient.invalidateQueries({ queryKey: ['environments', 'byAccount', accountId] });
        }
    });
};