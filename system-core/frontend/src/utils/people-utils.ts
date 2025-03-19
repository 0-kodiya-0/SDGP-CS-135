// src/utils/people-utils.ts
import { PersonType } from '../../../backend/src/feature/google/services/people/people.types';

// Frontend Contact interface
export interface Contact {
  id: string;
  name: string;
  email: string; // Keep as string, we'll provide empty string as fallback
  hasAvatar: boolean;
  resourceName: string;
  phoneNumbers?: string[];
  addresses?: string[];
  companies?: { name?: string | null; title?: string | null }[];
  photos?: string[];
  joinDate?: string;
  notes?: string;
  isFavorite?: boolean;
}

/**
 * Transform Google People API person object to frontend Contact format
 */
export const transformPersonToContact = (person: PersonType): Contact => {
  // Extract primary name or use fallback
  const primaryName = person.names && person.names.length > 0
    ? person.names[0].displayName || `${person.names[0].givenName || ''} ${person.names[0].familyName || ''}`.trim()
    : 'No Name';

  // Extract primary email with safe type handling
  const primaryEmail = person.emailAddresses && person.emailAddresses.length > 0
    ? person.emailAddresses[0].value || ''
    : '';

  // Extract photo URL safely
  const photoUrl = person.photos && person.photos.length > 0 
    ? person.photos[0].url || ''
    : '';

  // Extract phone numbers with null/undefined checks
  const phoneNumbers = person.phoneNumbers
    ? person.phoneNumbers.map(phone => phone.value || '')
        .filter(Boolean) // Remove any empty strings
    : [];

  // Extract addresses with null/undefined checks
  const addresses = person.addresses
    ? person.addresses.map(address => address.formattedValue || '')
        .filter(Boolean) // Remove any empty strings
    : [];

  // Extract organization details with null/undefined checks
  const companies = person.organizations
    ? person.organizations.map(org => ({
        name: org.name || null,
        title: org.title || null
      }))
    : [];

  // Create a unique ID from the resourceName
  const resourceName = person.resourceName || '';
  // Ensure we get a string type for id
  const id = resourceName.split('/').pop() || '';

  // Check if there is a photo
  const hasAvatar = Boolean(photoUrl);

  return {
    id,
    resourceName,
    name: primaryName,
    email: primaryEmail,
    hasAvatar,
    phoneNumbers,
    addresses,
    companies,
    photos: photoUrl ? [photoUrl] : [],
    // These fields aren't directly available from Google People API
    // You would need to store these in your own database if needed
    isFavorite: false,
    notes: '',
    joinDate: ''
  };
};

/**
 * Get primary value from a field array or return a default
 * This is a type-safe utility function that handles undefined/null values
 */
export const getPrimaryValue = <T extends { value?: string | null | undefined }>(
  items: T[] | undefined | null,
  defaultValue: string = 'Not available'
): string => {
  if (!items || items.length === 0) {
    return defaultValue;
  }
  return items[0].value || defaultValue;
};

/**
 * Safely extract a specific field from a Google People API person object
 * This is a more general utility for extracting fields with proper type checking
 */
export const getPersonField = <T>(
  person: PersonType | null | undefined,
  fieldName: keyof PersonType,
  defaultValue: T
): T => {
  if (!person || !person[fieldName]) {
    return defaultValue;
  }
  return person[fieldName] as unknown as T;
};