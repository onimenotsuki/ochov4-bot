const express = require('express');
const router = express.Router();

// Controladores
const facebookController = require('../controllers/facebook');

router.post('/webhook', facebookController.postWebhook);

// Webhook setup
router.get('/webhook', facebookController.getWebhook);

module.exports = router;
