import { Environment } from "../../features/default/environment/types/types.data";
import { TabView, Tab } from "../../features/required/tab_view/types/types.data";
import { OsType, DeviceType, LocalAccount, AccountType, AccountStatus, OAuthAccount, OAuthProviders } from "../../features/default/user_account/types/types.data";

// Helper to create a device object
const createMockDevice = (id: string, osType: OsType, deviceType: DeviceType) => {
    return {
        id,
        os: osType,
        deviceType
    };
};

// Sample Local Account
export const mockLocalAccount: LocalAccount = {
    id: 1,
    created: '2024-12-15T08:30:45.123Z',
    updated: '2025-01-22T14:15:22.456Z',
    accountType: AccountType.Local,
    status: AccountStatus.Active,
    userDetails: {
        name: 'Alex Johnson',
        email: 'alex.johnson@example.com',
        imageUrl: 'https://i.pravatar.cc/150?img=11'
    },
    device: createMockDevice('device-1', OsType.Windows, DeviceType.Desktop),
    security: {
        password: 'hashed-password-string',
        sessionTimeout: 1000,
        autoLock: false
    }
};

// Sample OAuth Accounts
export const mockOAuthAccounts: OAuthAccount[] = [
    // Google Account
    {
        id: 2,
        created: '2024-10-05T09:45:12.789Z',
        updated: '2025-02-10T11:22:33.444Z',
        accountType: AccountType.OAuth,
        status: AccountStatus.Active,
        provider: OAuthProviders.Google,
        userDetails: {
            name: 'Sarah Miller',
            email: 'sarah.miller@gmail.com',
            imageUrl: 'https://i.pravatar.cc/150?img=5'
        },
        device: createMockDevice('device-2', OsType.MacOS, DeviceType.Desktop),
        security: {
            twoFactorEnabled: true,
            sessionTimeout: 60,
            autoLock: true
        },
        tokenDetails: {
            accessToken: 'google-access-token-xyz-123',
            refreshToken: 'google-refresh-token-abc-789'
        }
    },

    // Microsoft Account
    {
        id: 3,
        created: '2024-11-20T15:30:45.123Z',
        updated: '2025-01-05T10:15:20.456Z',
        accountType: AccountType.OAuth,
        status: AccountStatus.Active,
        provider: OAuthProviders.Microsoft,
        userDetails: {
            name: 'James Wilson',
            email: 'james.wilson@outlook.com',
            imageUrl: 'https://i.pravatar.cc/150?img=7'
        },
        device: createMockDevice('device-3', OsType.Windows, DeviceType.Desktop),
        security: {
            twoFactorEnabled: false,
            sessionTimeout: 30,
            autoLock: true
        },
        tokenDetails: {
            accessToken: 'ms-access-token-def-456',
            refreshToken: 'ms-refresh-token-ghi-123'
        }
    },

    // Facebook Account
    {
        id: 4,
        created: '2024-09-12T12:10:33.789Z',
        updated: '2025-02-01T09:45:11.222Z',
        accountType: AccountType.OAuth,
        status: AccountStatus.Inactive,
        provider: OAuthProviders.Facebook,
        userDetails: {
            name: 'Emily Chen',
            email: 'emily.chen@example.com',
            imageUrl: 'https://i.pravatar.cc/150?img=9'
        },
        device: createMockDevice('device-4', OsType.Android, DeviceType.Mobile),
        security: {
            twoFactorEnabled: true,
            sessionTimeout: 15,
            autoLock: true
        },
        tokenDetails: {
            accessToken: 'fb-access-token-jkl-789',
            refreshToken: 'fb-refresh-token-mno-456'
        }
    },

    // Another Google Account
    {
        id: 5,
        created: '2025-01-10T08:20:15.123Z',
        updated: '2025-02-15T16:30:45.789Z',
        accountType: AccountType.OAuth,
        status: AccountStatus.Active,
        provider: OAuthProviders.Google,
        userDetails: {
            name: 'David Thompson',
            email: 'david.thompson@gmail.com'
            // No image URL - will use initial
        },
        device: createMockDevice('device-5', OsType.iOS, DeviceType.Mobile),
        security: {
            twoFactorEnabled: false,
            sessionTimeout: 45,
            autoLock: false
        },
        tokenDetails: {
            accessToken: 'google-access-token-pqr-321',
            refreshToken: 'google-refresh-token-stu-654'
        }
    }
];

// To use this data in your store during development, you can initialize
// your store with this data like:
/*
  const useAccountStore = create<AccountState>()(
    persist(
      (set, get) => ({
        localAccount: mockLocalAccount,
        oauthAccounts: mockOAuthAccounts,
        activeAccountId: mockLocalAccount.id,
        
        // ... rest of your store methods
      }),
      {
        name: 'account-storage',
        // ...
      }
    )
  )
*/

export const mockEnvironments: Environment[] = [
    // {
    //     id: 1,
    //     accountId: 'acc-1',
    //     name: 'Development Environment',
    //     created: new Date('2024-01-01').toISOString(),
    //     lastModified: new Date('2024-01-01').toISOString(),
    //     status: EnvironmentStatus.Active
    // },
    // {
    //     id: 2,
    //     accountId: 'acc-1',
    //     name: 'Staging Environment',
    //     created: new Date('2024-01-02').toISOString(),
    //     lastModified: new Date('2024-01-02').toISOString(),
    //     status: EnvironmentStatus.Active
    // }
];

// export const mockWorkspaces: Workspace[] = [
//     {
//         id: 1,
//         environmentId: 1,
//         name: "Development Workspace",
//         description: "Main development workspace",
//         created: new Date("2024-01-01").toISOString(),
//         lastModified: new Date("2024-01-01").toISOString(),
//         status: WorkspaceStatus.Active,
//         type: WorkspaceType.Organization,
//         category: WorkspaceCategory.Work,
//         subcategory: "Engineering",
//         visibility: WorkspaceVisibility.Private
//     },
//     {
//         id: 2,
//         environmentId: 1,
//         name: "Research Workspace",
//         description: "Data research and analysis",
//         created: new Date("2024-01-02").toISOString(),
//         lastModified: new Date("2024-01-02").toISOString(),
//         status: WorkspaceStatus.Active,
//         type: WorkspaceType.Personal,
//         category: WorkspaceCategory.Research,
//         subcategory: "Data Analysis",
//         visibility: WorkspaceVisibility.Shared
//     }
// ];

export const mockTabViews: TabView[] = [
];

export const mockTabs: Tab[] = [
];

// export const mockChats: (DirectChat | GroupChat)[] = [
//     {
//         id: 1,
//         environmentId: 1,
//         type: ChatType.Direct,
//         created: new Date('2024-01-01').toISOString(),
//         lastActive: new Date('2024-01-01').toISOString(),
//         status: ChatStatus.Active,
//         name: 'Direct Chat 1',
//         description: 'One-on-one chat with Alice',
//         participants: ['user-1', 'user-2']
//     },
//     {
//         id: 2,
//         environmentId: 1,
//         type: ChatType.Group,
//         created: new Date('2024-01-02').toISOString(),
//         lastActive: new Date('2024-01-02').toISOString(),
//         status: ChatStatus.Active,
//         name: 'Team Alpha',
//         description: 'Team discussion group',
//         participants: ['user-1', 'user-2', 'user-3']
//     },
//     {
//         id: 3,
//         environmentId: 1,
//         type: ChatType.Direct,
//         created: new Date('2024-01-03').toISOString(),
//         lastActive: new Date('2024-01-03').toISOString(),
//         status: ChatStatus.Active,
//         name: 'Direct Chat 2',
//         description: 'One-on-one chat with Bob',
//         participants: ['user-1', 'user-4']
//     },
//     {
//         id: 4,
//         environmentId: 1,
//         type: ChatType.Group,
//         created: new Date('2024-01-04').toISOString(),
//         lastActive: new Date('2024-01-04').toISOString(),
//         status: ChatStatus.Archived,
//         name: 'Project Beta',
//         description: 'Archived project discussion',
//         participants: ['user-1', 'user-2', 'user-4', 'user-5']
//     }
// ];

// export const mockFeatureIntegrations: FeatureIntegration[] = [
//     {
//         id: 1,
//         integrationId: 3,
//         integrationType: FeatureType.Chat,
//         integrationIntoToId: 2,
//         integrationIntoToType: IntegrableFeatures.Workspace,
//         status: IntegrationStatus.Active
//     },
//     {
//         id: 2,
//         integrationId: 1,
//         integrationType: FeatureType.Chat,
//         integrationIntoToId: 1,
//         integrationIntoToType: IntegrableFeatures.Workspace,
//         status: IntegrationStatus.Disabled
//     },
//     {
//         id: 3,
//         integrationId: 2,
//         integrationType: FeatureType.Chat,
//         integrationIntoToId: 1,
//         integrationIntoToType: IntegrableFeatures.Workspace,
//         status: IntegrationStatus.Active
//     },
// ];