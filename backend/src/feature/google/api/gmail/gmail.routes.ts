import express from 'express';
import { googleApiAuth } from '../../middleware';
import { createLabel, deleteLabel, getMessage, listLabels, listMessages, sendMessage, updateLabel } from './gmail.controller';

const router = express.Router({ mergeParams: true });

// Messages endpoints
router.get(
    '/messages',
    googleApiAuth('gmail', 'readonly'),
    listMessages
);

router.get(
    '/messages/:messageId',
    googleApiAuth('gmail', 'readonly'),
    getMessage
);

router.post(
    '/messages',
    googleApiAuth('gmail', 'send'),
    sendMessage
);

// Labels endpoints
router.get(
    '/labels',
    googleApiAuth('gmail', 'readonly'),
    listLabels
);

router.post(
    '/labels',
    googleApiAuth('gmail', 'full'),
    createLabel
);

router.put(
    '/labels/:labelId',
    googleApiAuth('gmail', 'full'),
    updateLabel
);

router.delete(
    '/labels/:labelId',
    googleApiAuth('gmail', 'full'),
    deleteLabel
);

export default router;