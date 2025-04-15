import express from 'express';
import { googleApiAuth } from '../../middleware';
import { addContactsToGroup, createContact, createContactGroup, deleteContact, deleteContactGroup, getContact, getContactGroup, listContactGroups, listContacts, removeContactsFromGroup, searchContacts, updateContact, updateContactGroup } from './people.controller';

const router = express.Router({ mergeParams: true });

// Contacts endpoints
router.get(
  '/contacts',
  googleApiAuth('people', 'readonly'),
  listContacts
);

router.get(
  '/contacts/search',
  googleApiAuth('people', 'readonly'),
  searchContacts
);

router.get(
  '/contacts/:resourceName',
  googleApiAuth('people', 'readonly'),
  getContact
);

router.post(
  '/contacts',
  googleApiAuth('people', 'full'),
  createContact
);

router.put(
  '/contacts/:resourceName',
  googleApiAuth('people', 'full'),
  updateContact
);

router.delete(
  '/contacts/:resourceName',
  googleApiAuth('people', 'full'),
  deleteContact
);

// Contact groups endpoints
router.get(
  '/contactGroups',
  googleApiAuth('people', 'readonly'),
  listContactGroups
);

router.get(
  '/contactGroups/:resourceName',
  googleApiAuth('people', 'readonly'),
  getContactGroup
);

router.post(
  '/contactGroups',
  googleApiAuth('people', 'full'),
  createContactGroup
);

router.put(
  '/contactGroups/:resourceName',
  googleApiAuth('people', 'full'),
  updateContactGroup
);

router.delete(
  '/contactGroups/:resourceName',
  googleApiAuth('people', 'full'),
  deleteContactGroup
);

router.post(
  '/contactGroups/:resourceName/members/add',
  googleApiAuth('people', 'full'),
  addContactsToGroup
);

router.post(
  '/contactGroups/:resourceName/members/remove',
  googleApiAuth('people', 'full'),
  removeContactsFromGroup
);

export default router;