import { Response } from 'express';
import {
    GetContactsParams,
    GetContactParams,
    CreateContactParams,
    UpdateContactParams,
    SearchContactsParams,
    GetContactGroupsParams,
    CreateContactGroupParams,
    UpdateContactGroupParams,
    AddContactsToGroupParams,
    RemoveContactsFromGroupParams
} from './people.types';
import { ApiErrorCode } from '../../../../types/response.types';
import { sendError, sendSuccess } from '../../../../utils/response';
import { handleGoogleApiError } from '../../middleware';
import { GoogleApiRequest } from '../../types';
import { PeopleService } from './people.service';
import { people_v1 } from 'googleapis';

/**
 * Controller for People API endpoints
 */
export class PeopleController {
    /**
     * List contacts
     */
    static async listContacts(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            // Extract query parameters
            const params: GetContactsParams = {
                maxResults: req.query.maxResults ? parseInt(req.query.maxResults as string) : 100,
                pageToken: req.query.pageToken as string | undefined,
                personFields: req.query.personFields as string | undefined,
                sortOrder: req.query.sortOrder as people_v1.Params$Resource$People$Connections$List['sortOrder'] | undefined,
                requestSyncToken: req.query.requestSyncToken === 'true',
                syncToken: req.query.syncToken as string | undefined
            };

            // Create service and get contacts
            const peopleService = new PeopleService(req.googleAuth);
            const contacts = await peopleService.listContacts(params);

            sendSuccess(res, 200, {
                contacts: contacts.items,
                nextPageToken: contacts.nextPageToken || undefined,
                syncToken: contacts.syncToken || undefined
            });
        } catch (error) {
            handleGoogleApiError(req, res, error);
        }
    }

    /**
     * Get a specific contact
     */
    static async getContact(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const resourceName = req.params.resourceName;

            if (!resourceName) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Contact resource name is required');
            }

            // Extract parameters
            const params: GetContactParams = {
                resourceName,
                personFields: req.query.personFields as string | undefined
            };

            // Create service and get contact
            const peopleService = new PeopleService(req.googleAuth);
            const contact = await peopleService.getContact(params);

            sendSuccess(res, 200, { contact });
        } catch (error) {
            handleGoogleApiError(req, res, error);
        }
    }

    /**
     * Create a new contact
     */
    static async createContact(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const contactData: CreateContactParams = req.body;

            // Create service and create contact
            const peopleService = new PeopleService(req.googleAuth);
            const contact = await peopleService.createContact(contactData);

            sendSuccess(res, 201, { contact });
        } catch (error) {
            handleGoogleApiError(req, res, error);
        }
    }

    /**
     * Update an existing contact
     */
    static async updateContact(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const resourceName = req.params.resourceName;

            if (!resourceName) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Contact resource name is required');
            }

            const contactData: UpdateContactParams = {
                ...req.body,
                resourceName
            };

            // Create service and update contact
            const peopleService = new PeopleService(req.googleAuth);
            const contact = await peopleService.updateContact(contactData);

            sendSuccess(res, 200, { contact });
        } catch (error) {
            handleGoogleApiError(req, res, error);
        }
    }

    /**
     * Delete a contact
     */
    static async deleteContact(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const resourceName = req.params.resourceName;

            if (!resourceName) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Contact resource name is required');
            }

            // Create service and delete contact
            const peopleService = new PeopleService(req.googleAuth);
            await peopleService.deleteContact({ resourceName });

            sendSuccess(res, 200, { message: 'Contact deleted successfully' });
        } catch (error) {
            handleGoogleApiError(req, res, error);
        }
    }

    /**
     * Search for contacts
     */
    static async searchContacts(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const query = req.query.q as string;

            if (!query) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Search query is required');
            }

            // Extract parameters
            const params: SearchContactsParams = {
                query,
                readMask: req.query.readMask as string || '',
                pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 100,
                pageToken: req.query.pageToken as string | undefined,
                sources: req.query.sources
                    ? (req.query.sources as string).split(',') as people_v1.Params$Resource$People$Searchcontacts['sources']
                    : undefined
            };

            // Create service and search contacts
            const peopleService = new PeopleService(req.googleAuth);
            const results = await peopleService.searchContacts(params);

            sendSuccess(res, 200, {
                contacts: results.items,
                nextPageToken: results.nextPageToken || undefined
            });
        } catch (error) {
            handleGoogleApiError(req, res, error);
        }
    }

    /**
     * List contact groups
     */
    static async listContactGroups(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            // Extract query parameters
            const params: GetContactGroupsParams = {
                maxResults: req.query.maxResults ? parseInt(req.query.maxResults as string) : 100,
                pageToken: req.query.pageToken as string | undefined,
                syncToken: req.query.syncToken as string | undefined
            };

            // Create service and get contact groups
            const peopleService = new PeopleService(req.googleAuth);
            const groups = await peopleService.listContactGroups(params);

            sendSuccess(res, 200, {
                groups: groups.items,
                nextPageToken: groups.nextPageToken || undefined,
                syncToken: groups.syncToken || undefined
            });
        } catch (error) {
            handleGoogleApiError(req, res, error);
        }
    }

    /**
     * Get a specific contact group
     */
    static async getContactGroup(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const resourceName = req.params.resourceName;

            if (!resourceName) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Group resource name is required');
            }

            // Create service and get contact group
            const peopleService = new PeopleService(req.googleAuth);
            const group = await peopleService.getContactGroup(resourceName);

            sendSuccess(res, 200, { group });
        } catch (error) {
            handleGoogleApiError(req, res, error);
           
        }
    }

    /**
     * Create a new contact group
     */
    static async createContactGroup(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const { name } = req.body;

            if (!name) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Group name is required');
            }

            // Create group payload
            const params: CreateContactGroupParams = { name };

            // Create service and create contact group
            const peopleService = new PeopleService(req.googleAuth);
            const group = await peopleService.createContactGroup(params);

            sendSuccess(res, 201, { group });
        } catch (error) {
            handleGoogleApiError(req, res, error);
        }
    }

    /**
     * Update an existing contact group
     */
    static async updateContactGroup(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const resourceName = req.params.resourceName;

            if (!resourceName) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Group resource name is required');
            }

            const { name, etag } = req.body;

            if (!name) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Group name is required');
            }

            // Create update payload
            const params: UpdateContactGroupParams = {
                resourceName,
                name,
                etag
            };

            // Create service and update contact group
            const peopleService = new PeopleService(req.googleAuth);
            const group = await peopleService.updateContactGroup(params);

            sendSuccess(res, 200, { group });
        } catch (error) {
            handleGoogleApiError(req, res, error);
        }
    }

    /**
     * Delete a contact group
     */
    static async deleteContactGroup(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const resourceName = req.params.resourceName;

            if (!resourceName) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Group resource name is required');
            }

            const deleteContacts = req.query.deleteContacts === 'true';

            // Create service and delete contact group
            const peopleService = new PeopleService(req.googleAuth);
            await peopleService.deleteContactGroup({ resourceName, deleteContacts });

            sendSuccess(res, 200, { message: 'Contact group deleted successfully' });
        } catch (error) {
            handleGoogleApiError(req, res, error);
        }
    }

    /**
     * Add contacts to a group
     */
    static async addContactsToGroup(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const resourceName = req.params.resourceName;

            if (!resourceName) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Group resource name is required');
            }

            const { resourceNames } = req.body;

            if (!resourceNames || !Array.isArray(resourceNames) || resourceNames.length === 0) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Contact resource names are required');
            }

            // Create payload
            const params: AddContactsToGroupParams = {
                resourceName,
                resourceNames
            };

            // Create service and add contacts to group
            const peopleService = new PeopleService(req.googleAuth);
            const result = await peopleService.addContactsToGroup(params);

            sendSuccess(res, 200, { group: result });
        } catch (error) {
            handleGoogleApiError(req, res, error);
        }
    }

    /**
     * Remove contacts from a group
     */
    static async removeContactsFromGroup(req: GoogleApiRequest, res: Response): Promise<void> {
        if (!req.googleAuth) {
            return sendError(res, 401, ApiErrorCode.AUTH_FAILED, 'Google authentication required');
        }

        try {
            const resourceName = req.params.resourceName;

            if (!resourceName) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Group resource name is required');
            }

            const { resourceNames } = req.body;

            if (!resourceNames || !Array.isArray(resourceNames) || resourceNames.length === 0) {
                return sendError(res, 400, ApiErrorCode.MISSING_DATA, 'Contact resource names are required');
            }

            // Create payload
            const params: RemoveContactsFromGroupParams = {
                resourceName,
                resourceNames
            };

            // Create service and remove contacts from group
            const peopleService = new PeopleService(req.googleAuth);
            const result = await peopleService.removeContactsFromGroup(params);

            sendSuccess(res, 200, { group: result });
        } catch (error) {
            handleGoogleApiError(req, res, error);
        }
    }
}