import { api } from '../../../../api/client.ts';
import { TabView, Tab, TabViewCreateDTO, TabCreateDTO } from '../types/data.ts';

// TabView API Functions
export const createTabView = async (data: TabViewCreateDTO): Promise<TabView> => {
    const response = await api.post<TabView>('/api/tab-views', data);
    return response.data;
};

export const getTabViewsByEnvironment = async (environmentId: number): Promise<TabView[]> => {
    const response = await api.get<TabView[]>(`/api/tab-views?environmentId=${environmentId}`);
    return response.data;
};

export const deleteTabView = async (id: number): Promise<void> => {
    await api.delete(`/tab-views/${id}`);
};

// Tab API Functions
export const createTab = async (data: TabCreateDTO): Promise<Tab> => {
    const response = await api.post<Tab>('/api/tabs', data);
    return response.data;
};

export const getTabsByTabView = async (tabViewId: number): Promise<Tab[]> => {
    const response = await api.get<Tab[]>(`/api/tabs?tabViewId=${tabViewId}`);
    return response.data;
};

export const deleteTab = async (id: number): Promise<void> => {
    await api.delete(`/api/tabs/${id}`);
};