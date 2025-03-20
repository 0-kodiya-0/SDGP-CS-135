import { people_v1 } from 'googleapis';
import { GoogleListResponse, PaginationParams } from '../../types';

// Request types
export interface GetContactsParams extends PaginationParams {
    personFields?: string;
    sortOrder?: people_v1.Params$Resource$People$Connections$List['sortOrder'];
    requestSyncToken?: boolean;
    syncToken?: string;
}

export interface GetContactParams {
    resourceName: string;
    personFields?: string;
}

export interface CreateContactParams {
    names?: people_v1.Schema$Name[];
    emailAddresses?: people_v1.Schema$EmailAddress[];
    phoneNumbers?: people_v1.Schema$PhoneNumber[];
    addresses?: people_v1.Schema$Address[];
    organizations?: people_v1.Schema$Organization[];
    biographies?: people_v1.Schema$Biography[];
    urls?: people_v1.Schema$Url[];
    birthdays?: people_v1.Schema$Birthday[];
    photos?: people_v1.Schema$Photo[];
    // Add any other fields that may be needed for creating contacts
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
    sources?: people_v1.Params$Resource$People$Searchcontacts['sources'];
}

// Response types
export type PersonType = people_v1.Schema$Person;
export type ContactsList = GoogleListResponse<PersonType> & { syncToken?: string | null };
export type ContactGroupType = people_v1.Schema$ContactGroup | people_v1.Schema$ModifyContactGroupMembersResponse;
export type ContactGroupsList = GoogleListResponse<ContactGroupType> & { syncToken?: string | null };

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