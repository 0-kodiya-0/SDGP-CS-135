import { google, people_v1 } from 'googleapis';
import { Auth } from 'googleapis';
import {
    PersonType,
    ContactsList,
    GetContactsParams,
    GetContactParams,
    CreateContactParams,
    UpdateContactParams,
    DeleteContactParams,
    SearchContactsParams,
    ContactGroupType,
    ContactGroupsList,
    GetContactGroupsParams,
    CreateContactGroupParams,
    UpdateContactGroupParams,
    DeleteContactGroupParams,
    AddContactsToGroupParams,
    RemoveContactsFromGroupParams
} from './people.types';

/**
 * People API Service
 * Contains methods to interact with Google People API
 */
export class PeopleService {
    private people: people_v1.People;
    private readonly DEFAULT_PERSON_FIELDS = 'names,emailAddresses,phoneNumbers,addresses,organizations,photos';

    constructor(auth: Auth.OAuth2Client) {
        this.people = google.people({ version: 'v1', auth });
    }

    /**
     * List contacts
     */
    async listContacts(params: GetContactsParams = {}): Promise<ContactsList> {
        try {
            const response = await this.people.people.connections.list({
                resourceName: 'people/me',
                pageSize: params.maxResults || 100,
                pageToken: params.pageToken,
                personFields: params.personFields || this.DEFAULT_PERSON_FIELDS,
                sortOrder: params.sortOrder,
                requestSyncToken: params.requestSyncToken,
                syncToken: params.syncToken
            });

            return {
                items: response.data.connections || [],
                nextPageToken: response.data.nextPageToken || undefined,
                syncToken: response.data.nextSyncToken || undefined
            };
        } catch (error) {
            console.error('Error listing contacts:', error);
            throw error;
        }
    }

    /**
     * Get a specific contact by resource name
     */
    async getContact(params: GetContactParams): Promise<PersonType> {
        try {
            const response = await this.people.people.get({
                resourceName: params.resourceName,
                personFields: params.personFields || this.DEFAULT_PERSON_FIELDS
            });

            return response.data;
        } catch (error) {
            console.error(`Error getting contact ${params.resourceName}:`, error);
            throw error;
        }
    }

    /**
     * Create a new contact
     */
    async createContact(params: CreateContactParams): Promise<PersonType> {
        try {
            const response = await this.people.people.createContact({
                requestBody: params
            });

            return response.data;
        } catch (error) {
            console.error('Error creating contact:', error);
            throw error;
        }
    }

    /**
     * Update an existing contact
     */
    async updateContact(params: UpdateContactParams): Promise<PersonType> {
        try {
            const { resourceName, etag, ...contactData } = params;

            // Prepare the request body with proper type
            const requestBody: people_v1.Schema$Person = {
                ...contactData,
                etag: etag
            };

            // Get the update mask (which fields are being updated)
            const updatePersonFields = Object.keys(contactData).join(',');

            const response = await this.people.people.updateContact({
                resourceName,
                updatePersonFields,
                requestBody
            });

            return response.data;
        } catch (error) {
            console.error(`Error updating contact ${params.resourceName}:`, error);
            throw error;
        }
    }

    /**
     * Delete a contact
     */
    async deleteContact(params: DeleteContactParams): Promise<void> {
        try {
            await this.people.people.deleteContact({
                resourceName: params.resourceName
            });
        } catch (error) {
            console.error(`Error deleting contact ${params.resourceName}:`, error);
            throw error;
        }
    }

    /**
     * Search for contacts
     */
    async searchContacts(params: SearchContactsParams): Promise<ContactsList> {
        try {
            const response = await this.people.people.searchContacts({
                query: params.query,
                readMask: params.readMask || this.DEFAULT_PERSON_FIELDS,
                pageSize: params.pageSize || 100,
                sources: params.sources as people_v1.Params$Resource$People$Searchcontacts['sources'],
            });

            return {
                items: response.data.results?.map(result => result.person as PersonType).filter(Boolean) || []
            };
        } catch (error) {
            console.error('Error searching contacts:', error);
            throw error;
        }
    }

    /**
     * List contact groups
     */
    async listContactGroups(params: GetContactGroupsParams = {}): Promise<ContactGroupsList> {
        try {
            const response = await this.people.contactGroups.list({
                pageSize: params.maxResults || 100,
                pageToken: params.pageToken,
                syncToken: params.syncToken,
            });

            return {
                items: response.data.contactGroups ? response.data.contactGroups.map(group => {
                    return { ...group, resourceName: group.resourceName?.replace('contactGroups/', '') }
                }) : [],
                nextPageToken: response.data.nextPageToken || undefined,
                syncToken: response.data.nextSyncToken || undefined
            };
        } catch (error) {
            console.error('Error listing contact groups:', error);
            throw error;
        }
    }

    /**
     * Get a specific contact group
     */
    async getContactGroup(resourceName: string): Promise<ContactGroupType> {
        try {
            const response = await this.people.contactGroups.get({
                resourceName,
                maxMembers: 1000
            });

            return response.data;
        } catch (error) {
            console.error(`Error getting contact group ${resourceName}:`, error);
            throw error;
        }
    }

    /**
     * Create a new contact group
     */
    async createContactGroup(params: CreateContactGroupParams): Promise<ContactGroupType> {
        try {
            const response = await this.people.contactGroups.create({
                requestBody: {
                    contactGroup: {
                        name: params.name
                    }
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error creating contact group:', error);
            throw error;
        }
    }

    /**
     * Update an existing contact group
     */
    async updateContactGroup(params: UpdateContactGroupParams): Promise<ContactGroupType> {
        try {
            const response = await this.people.contactGroups.update({
                resourceName: `contactGroups/${params.resourceName}`,
                requestBody: {
                    contactGroup: {
                        name: params.name,
                        etag: params.etag
                    }
                }
            });

            return response.data;
        } catch (error) {
            console.error(`Error updating contact group ${params.resourceName}:`, error);
            throw error;
        }
    }

    /**
     * Delete a contact group
     */
    async deleteContactGroup(params: DeleteContactGroupParams): Promise<void> {
        try {
            await this.people.contactGroups.delete({
                resourceName: `contactGroups/${params.resourceName}`,
                deleteContacts: params.deleteContacts
            });
        } catch (error) {
            console.error(`Error deleting contact group ${params.resourceName}:`, error);
            throw error;
        }
    }

    /**
     * Add contacts to a group
     */
    async addContactsToGroup(params: AddContactsToGroupParams): Promise<ContactGroupType> {
        try {
            const response = await this.people.contactGroups.members.modify({
                resourceName: `contactGroups/${params.resourceName}`,
                requestBody: {
                    resourceNamesToAdd: params.resourceNames,
                    resourceNamesToRemove: []
                }
            });

            return response.data;
        } catch (error) {
            console.error(`Error adding contacts to group ${params.resourceName}:`, error);
            throw error;
        }
    }

    /**
     * Remove contacts from a group
     */
    async removeContactsFromGroup(params: RemoveContactsFromGroupParams): Promise<ContactGroupType> {
        try {
            const response = await this.people.contactGroups.members.modify({
                resourceName: `contactGroups/${params.resourceName}`,
                requestBody: {
                    resourceNamesToAdd: [],
                    resourceNamesToRemove: params.resourceNames
                }
            });

            return response.data;
        } catch (error) {
            console.error(`Error removing contacts from group ${params.resourceName}:`, error);
            throw error;
        }
    }
}