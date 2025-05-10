import { PersonType, CreateContactParams, UpdateContactParams, ContactGroupType } from "./types.data";

// Define return types for each hook
export interface UseContactsReturn {
    contacts: PersonType[];
    loading: boolean;
    error: string | null;
    nextPageToken?: string;
    syncToken?: string;
    fetchContacts: (params?: {
        pageToken?: string;
        maxResults?: number;
        personFields?: string;
        sortOrder?: string;
        syncToken?: string;
    }) => Promise<void>;
    getContact: (resourceName: string, params?: {
        personFields?: string;
    }) => Promise<PersonType | null>;
    createContact: (contactData: CreateContactParams) => Promise<PersonType | null>;
    updateContact: (resourceName: string, contactData: UpdateContactParams) => Promise<PersonType | null>;
    deleteContact: (resourceName: string) => Promise<boolean>;
    searchContacts: (query: string, params?: {
        pageToken?: string;
        pageSize?: number;
        readMask?: string;
        sources?: string;
    }) => Promise<{ contacts: PersonType[], nextPageToken?: string } | null>;
}

export interface UseContactGroupsReturn {
    groups: ContactGroupType[];
    loading: boolean;
    error: string | null;
    nextPageToken?: string;
    syncToken?: string;
    fetchGroups: (params?: {
        pageToken?: string;
        maxResults?: number;
        syncToken?: string;
    }) => Promise<void>;
    getGroup: (resourceName: string) => Promise<ContactGroupType | null>;
    createGroup: (name: string) => Promise<ContactGroupType | null>;
    updateGroup: (resourceName: string, name: string, etag?: string) => Promise<ContactGroupType | null>;
    deleteGroup: (resourceName: string, deleteContacts?: boolean) => Promise<boolean>;
    addContactsToGroup: (resourceName: string, contactResourceNames: string[]) => Promise<ContactGroupType | null>;
    removeContactsFromGroup: (resourceName: string, contactResourceNames: string[]) => Promise<ContactGroupType | null>;
}