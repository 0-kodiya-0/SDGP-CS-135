const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsapp.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/send', authMiddleware, whatsappController.sendMessage);
router.post('/template', authMiddleware, whatsappController.sendTemplate);
router.post('/media', authMiddleware, whatsappController.sendMedia);