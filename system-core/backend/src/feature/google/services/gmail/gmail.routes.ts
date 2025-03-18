import express from 'express';
import { attachGoogleClient, googleApiAuth } from '../../middleware';
import { GmailController } from './gmail.controller';

const router = express.Router();

// Attach Google client to all Gmail routes
router.use(attachGoogleClient);

// Messages endpoints
router.get(
    '/messages',
    googleApiAuth('gmail', 'readonly'),
    GmailController.listMessages
);

router.get(
    '/messages/:messageId',
    googleApiAuth('gmail', 'readonly'),
    GmailController.getMessage
);

router.post(
    '/messages',
    googleApiAuth('gmail', 'send'),
    GmailController.sendMessage
);

// Labels endpoints
router.get(
    '/labels',
    googleApiAuth('gmail', 'readonly'),
    GmailController.listLabels
);

router.post(
    '/labels',
    googleApiAuth('gmail', 'full'),
    GmailController.createLabel
);

router.put(
    '/labels/:labelId',
    googleApiAuth('gmail', 'full'),
    GmailController.updateLabel
);

router.delete(
    '/labels/:labelId',
    googleApiAuth('gmail', 'full'),
    GmailController.deleteLabel
);

export default router;