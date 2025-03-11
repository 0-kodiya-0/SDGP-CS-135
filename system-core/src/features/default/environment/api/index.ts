import { api } from '../../../../api/client.ts';
import { Environment } from '../types/data.ts';

export interface UpdateEnvironmentDTO {
    name?: string;
    status?: 'active' | 'archived' | 'deleted';
}

export const getEnvironment = async (id: number) => {
    const response = await api.get<Environment>(`/api/environments/${id}`);
    return response.data;
};

export const getEnvironmentByAccountId = async (accountId: number) => {
    const response = await api.get<Environment[]>(`/api/environments/account/${accountId}`);
    return response.data;
};

export const updateEnvironment = async (id: number, data: UpdateEnvironmentDTO) => {
    const response = await api.patch<Environment>(`/api/environments/${id}`, data);
    return response.data;
};

export const createEnvironment = async (data: Omit<Environment, 'id' | 'created' | 'lastModified'>) => {
    const response = await api.post<Environment>('/api/environments', data);
    return response.data;
};