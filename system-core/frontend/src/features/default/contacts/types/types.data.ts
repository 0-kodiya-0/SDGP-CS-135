// types.ts
// These types mirror the backend types but are adapted for frontend use

// Basic types from Google People API
export interface Name {
    displayName?: string;
    familyName?: string;
    givenName?: string;
    middleName?: string;
    honorificPrefix?: string;
    honorificSuffix?: string;
    metadata?: Metadata;
}

export interface EmailAddress {
    value?: string;
    type?: string;
    formattedType?: string;
    metadata?: Metadata;
}

export interface PhoneNumber {
    value?: string;
    type?: string;
    formattedType?: string;
    metadata?: Metadata;
}

export interface Address {
    type?: string;
    formattedType?: string;
    formattedValue?: string;
    streetAddress?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    countryCode?: string;
    metadata?: Metadata;
}

export interface Organization {
    name?: string;
    title?: string;
    department?: string;
    type?: string;
    metadata?: Metadata;
}

export interface Biography {
    value?: string;
    contentType?: string; // 'TEXT_PLAIN' or 'TEXT_HTML'
    metadata?: Metadata;
}

export interface Url {
    value?: string;
    type?: string;
    formattedType?: string;
    metadata?: Metadata;
}

export interface Birthday {
    date?: {
        year?: number;
        month?: number;
        day?: number;
    };
    metadata?: Metadata;
}

export interface Photo {
    url?: string;
    metadata?: Metadata;
}

export interface Metadata {
    primary?: boolean;
    source?: {
        type?: string;
        id?: string;
    };
}

// Main types for the API
export interface PersonType {
    resourceName?: string;
    etag?: string;
    names?: Name[];
    emailAddresses?: EmailAddress[];
    phoneNumbers?: PhoneNumber[];
    addresses?: Address[];
    organizations?: Organization[];
    biographies?: Biography[];
    urls?: Url[];
    birthdays?: Birthday[];
    photos?: Photo[];
}

export interface ContactGroupType {
    resourceName?: string;
    etag?: string;
    metadata?: {
        updateTime?: string;
    };
    name?: string;
    formattedName?: string;
    memberCount?: number;
    memberResourceNames?: string[];
    groupType?: string;
}

// Request params
export interface CreateContactParams {
    names?: Name[];
    emailAddresses?: EmailAddress[];
    phoneNumbers?: PhoneNumber[];
    addresses?: Address[];
    organizations?: Organization[];
    biographies?: Biography[];
    urls?: Url[];
    birthdays?: Birthday[];
    photos?: Photo[];
}

export interface UpdateContactParams extends CreateContactParams {
    resourceName?: string;
    etag?: string;
}

export interface CreateContactGroupParams {
    name: string;
}

export interface UpdateContactGroupParams {
    resourceName: string;
    name: string;
    etag?: string;
}

// Helper types for contact creation
export interface SimpleContactInput {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    address?: string;
    notes?: string;
}

// Helper function to convert simple input to API format
export function simpleContactToApi(input: SimpleContactInput): CreateContactParams {
    const contact: CreateContactParams = {};

    if (input.firstName || input.lastName) {
        contact.names = [{
            givenName: input.firstName,
            familyName: input.lastName,
            displayName: [input.firstName, input.lastName].filter(Boolean).join(' ')
        }];
    }

    if (input.email) {
        contact.emailAddresses = [{
            value: input.email,
            type: 'home'
        }];
    }

    if (input.phone) {
        contact.phoneNumbers = [{
            value: input.phone,
            type: 'mobile'
        }];
    }

    if (input.company || input.jobTitle) {
        contact.organizations = [{
            name: input.company,
            title: input.jobTitle
        }];
    }

    if (input.address) {
        contact.addresses = [{
            formattedValue: input.address,
            type: 'home'
        }];
    }

    if (input.notes) {
        contact.biographies = [{
            value: input.notes,
            contentType: 'TEXT_PLAIN'
        }];
    }

    return contact;
}