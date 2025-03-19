// src/utils/format-person.ts
import { PersonType } from '../../../backend/src/feature/google/services/people/people.types';

/**
 * Format a Person object's name in a readable format
 */
export const formatPersonName = (person: PersonType): string => {
  if (!person.names || person.names.length === 0) {
    return 'No Name';
  }

  const name = person.names[0];
  
  if (name.displayName) {
    return name.displayName;
  }

  const parts = [];
  if (name.honorificPrefix) parts.push(name.honorificPrefix);
  if (name.givenName) parts.push(name.givenName);
  if (name.middleName) parts.push(name.middleName);
  if (name.familyName) parts.push(name.familyName);
  if (name.honorificSuffix) parts.push(name.honorificSuffix);

  return parts.join(' ') || 'No Name';
};

/**
 * Get primary email address from a Person object
 */
export const getPrimaryEmail = (person: PersonType): string => {
  if (!person.emailAddresses || person.emailAddresses.length === 0) {
    return '';
  }

  return person.emailAddresses[0].value || '';
};

/**
 * Get photo URL from a Person object
 */
export const getPersonPhoto = (person: PersonType): string => {
  if (!person.photos || person.photos.length === 0) {
    return '';
  }

  // Filter out default photos if possible
  const nonDefaultPhoto = person.photos.find(photo => !photo.default);
  if (nonDefaultPhoto && nonDefaultPhoto.url) {
    return nonDefaultPhoto.url;
  }

  return person.photos[0].url || '';
};

/**
 * Get primary phone number from a Person object
 */
export const getPrimaryPhone = (person: PersonType): string => {
  if (!person.phoneNumbers || person.phoneNumbers.length === 0) {
    return 'Not available';
  }

  return person.phoneNumbers[0].value || 'Not available';
};

/**
 * Get formatted address from a Person object
 */
export const getFormattedAddress = (person: PersonType): string => {
  if (!person.addresses || person.addresses.length === 0) {
    return 'Not available';
  }

  const address = person.addresses[0];
  
  if (address.formattedValue) {
    return address.formattedValue;
  }

  const parts = [];
  if (address.streetAddress) parts.push(address.streetAddress);
  if (address.city) parts.push(address.city);
  if (address.region) parts.push(address.region);
  if (address.postalCode) parts.push(address.postalCode);
  if (address.country) parts.push(address.country);

  return parts.join(', ') || 'Not available';
};

/**
 * Get organization/company information from a Person object
 */
export const getOrganizationInfo = (person: PersonType): { name: string; title: string } => {
  if (!person.organizations || person.organizations.length === 0) {
    return { name: 'Not available', title: 'Not available' };
  }

  const org = person.organizations[0];
  
  return {
    name: org.name || 'Not available',
    title: org.title || 'Not available'
  };
};

/**
 * Extract notes or biography from a Person object
 */
export const getPersonNotes = (person: PersonType): string => {
  if (!person.biographies || person.biographies.length === 0) {
    return '';
  }

  return person.biographies[0].value || '';
};