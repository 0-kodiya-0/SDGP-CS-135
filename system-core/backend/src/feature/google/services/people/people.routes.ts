import express from 'express';
import { PeopleController } from './people.controller';
import { googleApiAuth } from '../../middleware';

const router = express.Router({ mergeParams: true });

// Contacts endpoints
router.get(
  '/contacts',
  googleApiAuth('people', 'readonly'),
  PeopleController.listContacts
);

router.get(
  '/contacts/search',
  googleApiAuth('people', 'readonly'),
  PeopleController.searchContacts
);

router.get(
  '/contacts/:resourceName',
  googleApiAuth('people', 'readonly'),
  PeopleController.getContact
);

router.post(
  '/contacts',
  googleApiAuth('people', 'full'),
  PeopleController.createContact
);

router.put(
  '/contacts/:resourceName',
  googleApiAuth('people', 'full'),
  PeopleController.updateContact
);

router.delete(
  '/contacts/:resourceName',
  googleApiAuth('people', 'full'),
  PeopleController.deleteContact
);

// Contact groups endpoints
router.get(
  '/contactGroups',
  googleApiAuth('people', 'readonly'),
  PeopleController.listContactGroups
);

router.get(
  '/contactGroups/:resourceName',
  googleApiAuth('people', 'readonly'),
  PeopleController.getContactGroup
);

router.post(
  '/contactGroups',
  googleApiAuth('people', 'full'),
  PeopleController.createContactGroup
);

router.put(
  '/contactGroups/:resourceName',
  googleApiAuth('people', 'full'),
  PeopleController.updateContactGroup
);

router.delete(
  '/contactGroups/:resourceName',
  googleApiAuth('people', 'full'),
  PeopleController.deleteContactGroup
);

router.post(
  '/contactGroups/:resourceName/members/add',
  googleApiAuth('people', 'full'),
  PeopleController.addContactsToGroup
);

router.post(
  '/contactGroups/:resourceName/members/remove',
  googleApiAuth('people', 'full'),
  PeopleController.removeContactsFromGroup
);

export default router;