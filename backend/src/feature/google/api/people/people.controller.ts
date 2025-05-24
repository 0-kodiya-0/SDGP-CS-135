import { NextFunction, Response } from 'express';
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
import { ApiErrorCode, BadRequestError, JsonSuccess, ValidationError } from '../../../../types/response.types';
import { asyncHandler } from '../../../../utils/response';
import { GoogleApiRequest } from '../../types';
import { PeopleService } from './people.service';
import { Auth, people_v1 } from 'googleapis';
import { ValidationUtils } from '../../../../utils/validation';


/**
 * List contacts
 */
export const listContacts = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
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
    const peopleService = new PeopleService(req.googleAuth as Auth.OAuth2Client);
    const contacts = await peopleService.listContacts(params);

    next(new JsonSuccess({
        contacts: contacts.items,
        nextPageToken: contacts.nextPageToken || undefined,
        syncToken: contacts.syncToken || undefined
    }));
});

/**
 * Get a specific contact
 */
export const getContact = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const resourceName = req.params.resourceName;

    if (!resourceName) {
        throw new BadRequestError('Contact resource name is required');
    }

    // Extract parameters
    const params: GetContactParams = {
        resourceName,
        personFields: req.query.personFields as string | undefined
    };

    // Create service and get contact
    const peopleService = new PeopleService(req.googleAuth as Auth.OAuth2Client);
    const contact = await peopleService.getContact(params);

    next(new JsonSuccess({ contact }));
});

/**
 * Create a new contact
 */
export const createContact = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const contactData: CreateContactParams = req.body;

    // Create service and create contact
    const peopleService = new PeopleService(req.googleAuth as Auth.OAuth2Client);
    const contact = await peopleService.createContact(contactData);

    next(new JsonSuccess({ contact }, 201));
});

/**
 * Update an existing contact
 */
export const updateContact = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const resourceName = req.params.resourceName;

    if (!resourceName) {
        throw new BadRequestError('Contact resource name is required');
    }

    const contactData: UpdateContactParams = {
        ...req.body,
        resourceName
    };

    // Create service and update contact
    const peopleService = new PeopleService(req.googleAuth as Auth.OAuth2Client);
    const contact = await peopleService.updateContact(contactData);

    next(new JsonSuccess({ contact }));
});

/**
 * Delete a contact
 */
export const deleteContact = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const resourceName = req.params.resourceName;

    if (!resourceName) {
        throw new BadRequestError('Contact resource name is required');
    }

    // Create service and delete contact
    const peopleService = new PeopleService(req.googleAuth as Auth.OAuth2Client);
    await peopleService.deleteContact({ resourceName });

    next(new JsonSuccess({ message: 'Contact deleted successfully' }));
});

/**
 * Search for contacts
 */
export const searchContacts = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const query = req.query.q as string;

    ValidationUtils.validateRequiredFields(req.query, ['q']);
    const sanitizedQuery = ValidationUtils.validateSearchQuery(query);

    // Extract parameters
    const params: SearchContactsParams = {
        query: sanitizedQuery,
        readMask: req.query.readMask as string || '',
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 100,
        pageToken: req.query.pageToken as string | undefined,
        sources: req.query.sources
            ? (req.query.sources as string).split(',') as people_v1.Params$Resource$People$Searchcontacts['sources']
            : undefined
    };

    // Validate page size
    if (params.pageSize && (params.pageSize < 1 || params.pageSize > 1000)) {
        throw new ValidationError('Page size must be between 1 and 1000', 400, ApiErrorCode.VALIDATION_ERROR);
    }

    const peopleService = new PeopleService(req.googleAuth as Auth.OAuth2Client);
    const results = await peopleService.searchContacts(params);

    next(new JsonSuccess({
        contacts: results.items,
        nextPageToken: results.nextPageToken || undefined
    }));
});

/**
 * List contact groups
 */
export const listContactGroups = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    // Extract query parameters
    const params: GetContactGroupsParams = {
        maxResults: req.query.maxResults ? parseInt(req.query.maxResults as string) : 100,
        pageToken: req.query.pageToken as string | undefined,
        syncToken: req.query.syncToken as string | undefined
    };

    // Create service and get contact groups
    const peopleService = new PeopleService(req.googleAuth as Auth.OAuth2Client);
    const groups = await peopleService.listContactGroups(params);

    next(new JsonSuccess({
        groups: groups.items,
        nextPageToken: groups.nextPageToken || undefined,
        syncToken: groups.syncToken || undefined
    }));
});

/**
 * Get a specific contact group
 */
export const getContactGroup = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const resourceName = req.params.resourceName;

    if (!resourceName) {
        throw new BadRequestError('Group resource name is required');
    }

    // Create service and get contact group
    const peopleService = new PeopleService(req.googleAuth as Auth.OAuth2Client);
    const group = await peopleService.getContactGroup(resourceName);

    next(new JsonSuccess({ group }));
});

/**
 * Create a new contact group
 */
export const createContactGroup = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const { name } = req.body;

    if (!name) {
        throw new BadRequestError('Group name is required');
    }

    // Create group payload
    const params: CreateContactGroupParams = { name };

    // Create service and create contact group
    const peopleService = new PeopleService(req.googleAuth as Auth.OAuth2Client);
    const group = await peopleService.createContactGroup(params);

    next(new JsonSuccess({ group }, 201));
});

/**
 * Update an existing contact group
 */
export const updateContactGroup = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const resourceName = req.params.resourceName;

    if (!resourceName) {
        throw new BadRequestError('Group resource name is required');
    }

    const { name, etag } = req.body;

    if (!name) {
        throw new BadRequestError('Group name is required');
    }

    // Create update payload
    const params: UpdateContactGroupParams = {
        resourceName,
        name,
        etag
    };

    // Create service and update contact group
    const peopleService = new PeopleService(req.googleAuth as Auth.OAuth2Client);
    const group = await peopleService.updateContactGroup(params);

    next(new JsonSuccess({ group }));
});

/**
 * Delete a contact group
 */
export const deleteContactGroup = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const resourceName = req.params.resourceName;

    if (!resourceName) {
        throw new BadRequestError('Group resource name is required');
    }

    const deleteContacts = req.query.deleteContacts === 'true';

    // Create service and delete contact group
    const peopleService = new PeopleService(req.googleAuth as Auth.OAuth2Client);
    await peopleService.deleteContactGroup({ resourceName, deleteContacts });

    next(new JsonSuccess({ message: 'Contact group deleted successfully' }));
});

/**
 * Add contacts to a group
 */
export const addContactsToGroup = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const resourceName = req.params.resourceName;

    if (!resourceName) {
        throw new BadRequestError('Group resource name is required');
    }

    const { resourceNames } = req.body;

    if (!resourceNames || !Array.isArray(resourceNames) || resourceNames.length === 0) {
        throw new BadRequestError('Contact resource names are required');
    }

    // Create payload
    const params: AddContactsToGroupParams = {
        resourceName,
        resourceNames
    };

    // Create service and add contacts to group
    const peopleService = new PeopleService(req.googleAuth as Auth.OAuth2Client);
    const result = await peopleService.addContactsToGroup(params);

    next(new JsonSuccess({ group: result }));
});

/**
 * Remove contacts from a group
 */
export const removeContactsFromGroup = asyncHandler(async (req: GoogleApiRequest, res: Response, next: NextFunction) => {
    const resourceName = req.params.resourceName;

    if (!resourceName) {
        throw new BadRequestError('Group resource name is required');
    }

    const { resourceNames } = req.body;

    if (!resourceNames || !Array.isArray(resourceNames) || resourceNames.length === 0) {
        throw new BadRequestError('Contact resource names are required');
    }

    // Create payload
    const params: RemoveContactsFromGroupParams = {
        resourceName,
        resourceNames
    };

    // Create service and remove contacts from group
    const peopleService = new PeopleService(req.googleAuth as Auth.OAuth2Client);
    const result = await peopleService.removeContactsFromGroup(params);

    next(new JsonSuccess({ group: result }));
});