const express = require('express');
const router = express.Router();

// Cargamos los controladores
const pnlController = require('../controllers/pnl');

router.post('/message', pnlController.message);
router.post('/raw', pnlController.raw);
router.post('/get-index', pnlController.getIndex);

module.exports = router;
