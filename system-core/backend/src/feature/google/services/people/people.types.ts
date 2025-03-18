import { people_v1 } from 'googleapis';
import { GoogleListResponse, PaginationParams } from '../../types';

// Request types
export interface GetContactsParams extends PaginationParams {
    personFields?: string;
    sortOrder?: 'LAST_MODIFIED_ASCENDING' | 'LAST_MODIFIED_DESCENDING' | 'FIRST_NAME_ASCENDING' | 'LAST_NAME_ASCENDING';
    requestSyncToken?: boolean;
    syncToken?: string;
}

export interface GetContactParams {
    resourceName: string;
    personFields?: string;
}

export interface CreateContactParams {
    names?: {
        givenName?: string;
        familyName?: string;
        displayName?: string;
        middleName?: string;
        honorificPrefix?: string;
        honorificSuffix?: string;
    }[];
    emailAddresses?: {
        value: string;
        type?: string;
        formattedType?: string;
    }[];
    phoneNumbers?: {
        value: string;
        type?: string;
        formattedType?: string;
    }[];
    addresses?: {
        streetAddress?: string;
        city?: string;
        region?: string;
        postalCode?: string;
        country?: string;
        type?: string;
        formattedType?: string;
        formattedValue?: string;
    }[];
    organizations?: {
        name?: string;
        title?: string;
        department?: string;
        type?: string;
    }[];
    biographies?: {
        value: string;
        contentType?: 'TEXT_PLAIN' | 'TEXT_HTML';
    }[];
    urls?: {
        value: string;
        type?: string;
        formattedType?: string;
    }[];
    birthdays?: {
        date?: {
            year?: number;
            month?: number;
            day?: number;
        };
    }[];
    photos?: {
        url: string;
    }[];
}

export interface UpdateContactParams extends CreateContactParams {
    resourceName: string;
    etag?: string;
}

export interface DeleteContactParams {
    resourceName: string;
}

export interface SearchContactsParams {
    query: string;
    readMask: string;
    pageSize?: number;
    pageToken?: string;
    sources?: ('READ_SOURCE_TYPE_CONTACT' | 'READ_SOURCE_TYPE_PROFILE')[];
}

// Response types
export type PersonType = people_v1.Schema$Person;
export type ContactsList = GoogleListResponse<PersonType> & { syncToken?: string };
export type ContactGroupType = people_v1.Schema$ContactGroup;
export type ContactGroupsList = GoogleListResponse<ContactGroupType> & { syncToken?: string };

// Contact Groups types
export interface GetContactGroupsParams extends PaginationParams {
    syncToken?: string;
}

export interface CreateContactGroupParams {
    name: string;
}

export interface UpdateContactGroupParams {
    resourceName: string;
    name: string;
    etag?: string;
}

export interface DeleteContactGroupParams {
    resourceName: string;
    deleteContacts?: boolean;
}

export interface AddContactsToGroupParams {
    resourceName: string;
    resourceNames: string[];
}

export interface RemoveContactsFromGroupParams {
    resourceName: string;
    resourceNames: string[];
}