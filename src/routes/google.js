const express = require('express');
const router = express.Router();

const calendarController = require('../controllers/calendar');

// Obtiene el calendario por default
router.get('/calendars/me', calendarController.getMyCalendar);

// Crea un nuevo evento en el calendario
router.post('/calendars/me/events', calendarController.createEvent);

module.exports = router;
