// types/people.types.ts

// Base types for pagination
export interface PaginationParams {
    pageToken?: string;
    maxResults?: number;
  }
  
  // Google API list response
  export interface GoogleListResponse<T> {
    items: T[];
    nextPageToken?: string;
  }
  
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
  
  // Metadata for fields
  export interface FieldMetadata {
    primary?: boolean;
    source?: {
      type?: string;
      id?: string;
    };
    verified?: boolean;
  }
  
  // Person type
  export interface PersonType {
    resourceName?: string;
    etag?: string;
    metadata?: {
      sources?: {
        type?: string;
        id?: string;
        etag?: string;
      }[];
      objectType?: string;
      deleted?: boolean;
    };
    names?: {
      metadata?: FieldMetadata;
      displayName?: string;
      familyName?: string;
      givenName?: string;
      middleName?: string;
      honorificPrefix?: string;
      honorificSuffix?: string;
      phoneticFamilyName?: string;
      phoneticGivenName?: string;
      phoneticMiddleName?: string;
      displayNameLastFirst?: string;
      unstructuredName?: string;
    }[];
    nicknames?: {
      metadata?: FieldMetadata;
      value?: string;
      type?: string;
    }[];
    photos?: {
      metadata?: FieldMetadata;
      url?: string;
      default?: boolean;
    }[];
    genders?: {
      metadata?: FieldMetadata;
      value?: string;
      formattedValue?: string;
      addressMeAs?: string;
    }[];
    addresses?: {
      metadata?: FieldMetadata;
      formattedValue?: string;
      type?: string;
      formattedType?: string;
      poBox?: string;
      streetAddress?: string;
      extendedAddress?: string;
      city?: string;
      region?: string;
      postalCode?: string;
      country?: string;
      countryCode?: string;
    }[];
    emailAddresses?: {
      metadata?: FieldMetadata;
      value?: string;
      type?: string;
      formattedType?: string;
      displayName?: string;
    }[];
    phoneNumbers?: {
      metadata?: FieldMetadata;
      value?: string;
      canonicalForm?: string;
      type?: string;
      formattedType?: string;
    }[];
    biographies?: {
      metadata?: FieldMetadata;
      value?: string;
      contentType?: string;
    }[];
    birthdays?: {
      metadata?: FieldMetadata;
      date?: {
        year?: number;
        month?: number;
        day?: number;
      };
      text?: string;
    }[];
    events?: {
      metadata?: FieldMetadata;
      date?: {
        year?: number;
        month?: number;
        day?: number;
      };
      type?: string;
      formattedType?: string;
    }[];
    organizations?: {
      metadata?: FieldMetadata;
      type?: string;
      formattedType?: string;
      name?: string;
      department?: string;
      title?: string;
      jobDescription?: string;
      symbol?: string;
      domain?: string;
      location?: string;
      startDate?: {
        year?: number;
        month?: number;
        day?: number;
      };
      endDate?: {
        year?: number;
        month?: number;
        day?: number;
      };
      phoneticName?: string;
      current?: boolean;
    }[];
    locales?: {
      metadata?: FieldMetadata;
      value?: string;
    }[];
    ageRanges?: {
      metadata?: FieldMetadata;
      ageRange?: string;
    }[];
    urls?: {
      metadata?: FieldMetadata;
      value?: string;
      type?: string;
      formattedType?: string;
    }[];
    memberships?: {
      metadata?: FieldMetadata;
      contactGroupMembership?: {
        contactGroupId?: string;
        contactGroupResourceName?: string;
      };
      domainMembership?: {
        inViewerDomain?: boolean;
      };
    }[];
  }
  
  export type ContactsList = GoogleListResponse<PersonType> & { syncToken?: string };
  
  // Contact Group types
  export interface ContactGroupType {
    resourceName?: string;
    etag?: string;
    metadata?: {
      updateTime?: string;
    };
    groupType?: 'GROUP_TYPE_UNSPECIFIED' | 'USER_CONTACT_GROUP' | 'SYSTEM_CONTACT_GROUP';
    name?: string;
    formattedName?: string;
    memberCount?: number;
    memberResourceNames?: string[];
    clientData?: {
      key?: string;
      value?: string;
    }[];
  }
  
  export type ContactGroupsList = GoogleListResponse<ContactGroupType> & { syncToken?: string };
  
  // Contact Groups params
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