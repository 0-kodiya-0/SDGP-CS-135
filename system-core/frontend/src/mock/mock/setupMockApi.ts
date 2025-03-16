import { AxiosInstance } from "axios";
import { mockEnvironments, mockTabs, mockTabViews } from "./data";
import AxiosMockAdapter from "axios-mock-adapter";
// import { CreateWorkspaceDTO, UpdateWorkspaceDTO } from "../../features/default/workspace/types/api";
// import { CreateDirectChatDTO, CreateGroupChatDTO, UpdateChatDTO } from "../../features/default/chat/types/api";
// import { ChatStatus, ChatType, DirectChat, GroupChat } from "../../features/default/chat/types/data";
// import { FeatureIntegration, IntegrationStatus } from "../../services/integration/types/data";
import { Environment } from "../../features/default/environment/types/types.data";
// import { Workspace, WorkspaceStatus, WorkspaceType, WorkspaceCategory, WorkspaceVisibility } from "../../features/default/workspace/types/data";
import { TabViewCreateDTO, TabView, TabCreateDTO, Tab } from "../../features/required/tab_view/types/types.data";

let tabCount = 0;

export const setupMockApi = (api: AxiosInstance) => {
    const mock = new AxiosMockAdapter(api);

    // Environment endpoints
    mock.onGet(/\/api\/environments\/\d+/).reply((config) => {
        const id = parseInt(config.url!.split('/').pop()!);
        const environment = mockEnvironments.find(env => env.id === id);
        return environment ? [200, environment] : [404, { message: 'Environment not found' }];
    });

    // New endpoint to get environment by account ID
    mock.onGet(/\/api\/environments\/account\/\d+/).reply((config) => {
        const accountId = parseInt(config.url!.split('/').pop()!);
        // Assuming there's a 1:1 relationship between account and environment
        // You might need to adjust this logic based on your actual data model
        const environment = mockEnvironments.filter(env => env.accountId === accountId);
        return environment ? [200, environment] : [404, { message: 'Environment not found for this account' }];
    });

    mock.onPatch(/\/api\/environments\/\d+/).reply((config) => {
        const id = parseInt(config.url!.split('/').pop()!);
        const data = JSON.parse(config.data);
        const envIndex = mockEnvironments.findIndex(env => env.id === id);

        if (envIndex === -1) {
            return [404, { message: 'Environment not found' }];
        }

        const updatedEnvironment = {
            ...mockEnvironments[envIndex],
            ...data,
            lastModified: new Date().toISOString()
        };
        mockEnvironments[envIndex] = updatedEnvironment;

        return [200, updatedEnvironment];
    });

    mock.onPost('/api/environments').reply((config) => {
        const data = JSON.parse(config.data);
        const newEnvironment: Environment = {
            ...data,
            id: mockEnvironments.length + 1,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        mockEnvironments.push(newEnvironment);
        return [201, newEnvironment];
    });


    // mock.onGet('/api/workspaces').reply((config) => {
    //     const environmentId = Number(config.params?.environmentId);
    //     if (!environmentId) {
    //         return [400, { message: 'Environment ID is required' }];
    //     }

    //     const workspaces = mockWorkspaces.filter(w => w.environmentId === environmentId);
    //     return [200, workspaces];
    // });

    // // Create workspace
    // mock.onPost('/api/workspaces').reply((config) => {
    //     const data = JSON.parse(config.data) as CreateWorkspaceDTO;

    //     if (!data.environmentId) {
    //         return [400, { message: 'Environment ID is required' }];
    //     }

    //     const newWorkspace: Workspace = {
    //         id: mockWorkspaces.length + 1,
    //         environmentId: data.environmentId,
    //         name: data.name,
    //         description: data.description || "",
    //         created: new Date().toISOString(),
    //         lastModified: new Date().toISOString(),
    //         status: WorkspaceStatus.Active,
    //         type: data.type as WorkspaceType,
    //         category: data.category as WorkspaceCategory,
    //         subcategory: data.subcategory || "",
    //         visibility: data.visibility as WorkspaceVisibility
    //     };

    //     mockWorkspaces.push(newWorkspace);
    //     return [201, newWorkspace];
    // });

    // // Update workspace
    // mock.onPatch(/\/api\/workspaces\/\d+/).reply((config) => {
    //     const workspaceId = parseInt(config.url!.split('/').pop()!);
    //     const data = JSON.parse(config.data) as UpdateWorkspaceDTO;
    //     const workspaceIndex = mockWorkspaces.findIndex(w => w.id === workspaceId);

    //     if (workspaceIndex === -1) {
    //         return [404, { message: 'Workspace not found' }];
    //     }

    //     const updatedWorkspace = {
    //         ...mockWorkspaces[workspaceIndex],
    //         ...data,
    //         lastModified: new Date().toISOString()
    //     };

    //     mockWorkspaces[workspaceIndex] = updatedWorkspace;
    //     return [200, updatedWorkspace];
    // });

    mock.onGet(/\/api\/tab-views/).reply((config) => {
        const environmentId = Number(new URLSearchParams(config.url?.split("?")[1]).get("environmentId"));
        const tabViews = mockTabViews.filter(tv => tv.environmentId === environmentId);
        return [200, tabViews];
    });

    mock.onPost("/api/tab-views").reply((config) => {
        const data: TabViewCreateDTO = JSON.parse(config.data);
        const newTabView: TabView = {
            id: mockTabViews.length + 1,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        mockTabViews.push(newTabView);
        return [201, newTabView];
    });

    mock.onDelete(/\/api\/tab-views\/\d+/).reply((config) => {
        const id = parseInt(config.url!.split("/").pop()!);
        const index = mockTabViews.findIndex(tv => tv.id === id);
        if (index === -1) return [404, { message: "TabView not found" }];
        mockTabViews.splice(index, 1);
        return [204];
    });

    // Tab Endpoints
    mock.onGet(/\/api\/tabs/).reply((config) => {
        const tabViewId = Number(new URLSearchParams(config.url?.split("?")[1]).get("tabViewId"));
        const tabs = mockTabs.filter(tab => tab.tabViewId === tabViewId);
        return [200, tabs];
    });

    mock.onPost("/api/tabs").reply((config) => {
        const data: TabCreateDTO = JSON.parse(config.data);
        const newTab: Tab = {
            id: tabCount++,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        mockTabs.push(newTab);
        return [201, newTab];
    });

    mock.onDelete(/\/api\/tabs\/\d+/).reply((config) => {
        const id = parseInt(config.url!.split("/").pop()!);
        const index = mockTabs.findIndex(tab => tab.id === id);
        if (index === -1) return [404, { message: "Tab not found" }];
        mockTabs.splice(index, 1);
        return [204];
    });


    // mock.onGet('/api/chats').reply((config) => {
    //     const environmentId = config.params?.environmentId;

    //     if (!environmentId) {
    //         return [400, { message: 'Environment ID is required' }];
    //     }

    //     const chats = mockChats.filter(chat => chat.environmentId === environmentId);
    //     return [200, chats];
    // });

    // mock.onGet('/api/chats/bulk').reply((config) => {
    //     const chatIdsStr = config.params?.chatIds as string;

    //     if (!chatIdsStr) {
    //         return [400, { message: 'Chat IDs are required' }];
    //     }

    //     const chatIds = chatIdsStr.split(",").map((id) => parseInt(id));

    //     // Filter only relevant chats in one pass (O(N))
    //     const chats = mockChats.filter(chat => chatIds.includes(chat.id));

    //     return [200, chats];
    // });

    // // Get single chat
    // mock.onGet(/\/api\/chats\/.*/).reply((config) => {
    //     const chatId = config.url!.split('/').pop()!;
    //     const chat = mockChats.find(c => c.id === parseInt(chatId));

    //     if (!chat) {
    //         return [404, { message: 'Chat not found' }];
    //     }

    //     return [200, chat];
    // });

    // // Create direct chat
    // mock.onPost('/api/chats/direct').reply((config) => {
    //     const data = JSON.parse(config.data) as CreateDirectChatDTO;

    //     if (!data.environmentId) {
    //         return [400, { message: 'Environment ID is required' }];
    //     }

    //     const newChat: DirectChat = {
    //         id: mockChats.length + 1,
    //         environmentId: data.environmentId,
    //         type: ChatType.Direct,
    //         created: new Date().toISOString(),
    //         lastActive: new Date().toISOString(),
    //         status: ChatStatus.Active,
    //         name: data.name || `Direct Chat`,
    //         description: data.description || '',
    //         participants: [data.participantId, 'current-user'] // Simulating current user
    //     };

    //     mockChats.push(newChat);
    //     return [201, newChat];
    // });

    // // Create group chat
    // mock.onPost('/api/chats/group').reply((config) => {
    //     const data = JSON.parse(config.data) as CreateGroupChatDTO;

    //     if (!data.environmentId) {
    //         return [400, { message: 'Environment ID is required' }];
    //     }

    //     const newChat: GroupChat = {
    //         id: mockChats.length + 1,
    //         environmentId: data.environmentId,
    //         type: ChatType.Group,
    //         created: new Date().toISOString(),
    //         lastActive: new Date().toISOString(),
    //         status: ChatStatus.Active,
    //         name: data.name,
    //         description: data.description || '',
    //         participants: [...data.participantIds, 'current-user'] // Simulating current user
    //     };

    //     mockChats.push(newChat);
    //     return [201, newChat];
    // });

    // // Update chat
    // mock.onPatch(/\/api\/chats\/.*/).reply((config) => {
    //     const chatId = config.url!.split('/').pop()!;
    //     const data = JSON.parse(config.data) as UpdateChatDTO;
    //     const chatIndex = mockChats.findIndex(c => c.id === parseInt(chatId));

    //     if (chatIndex === -1) {
    //         return [404, { message: 'Chat not found' }];
    //     }

    //     const updatedChat = {
    //         ...mockChats[chatIndex],
    //         ...data,
    //         lastActive: new Date().toISOString()
    //     };

    //     mockChats[chatIndex] = updatedChat;
    //     return [200, updatedChat];
    // });

    // // Delete chat
    // mock.onDelete(/\/api\/chats\/.*/).reply((config) => {
    //     const chatId = config.url!.split('/').pop()!;
    //     const chatIndex = mockChats.findIndex(c => c.id === parseInt(chatId));

    //     if (chatIndex === -1) {
    //         return [404, { message: 'Chat not found' }];
    //     }

    //     mockChats.splice(chatIndex, 1);
    //     return [204];
    // });

    // mock.onPost('/api/feature-integrations/create').reply((config) => {
    //     try {
    //         const newIntegration: FeatureIntegration = {
    //             id: `feature-integration-${Date.now()}`,
    //             ...JSON.parse(config.data), // Merge user-provided data
    //             status: IntegrationStatus.Active
    //         };

    //         mockFeatureIntegrations.push(newIntegration);
    //         return [201, newIntegration];
    //     } catch (error) {
    //         return [400, { message: 'Invalid request data' }];
    //     }
    // });

    // // Update feature integration status
    // mock.onPatch(/\/api\/feature-integrations\/update\/.*/).reply((config) => {
    //     const match = config.url?.match(/\/api\/feature-integrations\/update\/(.+)/);
    //     const integrationId = match ? match[1] : null;

    //     if (!integrationId) return [400, { message: 'Invalid integration ID' }];

    //     try {
    //         const { status } = JSON.parse(config.data);
    //         const integration = mockFeatureIntegrations.find(int => int.integrationId === parseInt(integrationId));

    //         if (!integration) return [404, { message: 'Integration not found' }];

    //         integration.status = status;
    //         return [200, integration];
    //     } catch (error) {
    //         return [400, { message: 'Invalid request data' }];
    //     }
    // });

    // // Get integrations by target (integrationIntoToId + integrationType)
    // mock.onGet('/api/feature-integrations/by-target').reply((config) => {
    //     const { integrationIntoToId, integrationType } = config.params;

    //     if (!integrationIntoToId || !integrationType) {
    //         return [400, { message: 'Missing parameters' }];
    //     }

    //     const results = mockFeatureIntegrations.filter(
    //         int => int.integrationIntoToId === integrationIntoToId && int.integrationType === integrationType
    //     );

    //     return [200, results];
    // });

    // // Get integrations by integration ID and type
    // mock.onGet('/api/feature-integrations/by-id').reply((config) => {
    //     const { integrationId, integrationIntoToType } = config.params;

    //     if (!integrationId || !integrationIntoToType) {
    //         return [400, { message: 'Missing parameters' }];
    //     }

    //     const results = mockFeatureIntegrations.filter(
    //         int => int.integrationId === integrationId && int.integrationIntoToType === integrationIntoToType
    //     );

    //     return [200, results];
    // });

    // Enable passing through requests that don't match any mock
    mock.onAny().passThrough();

    return mock;
};