const express = require('express');
const router = express.Router();
const {
  getReminders,
  getReminder,
  createReminder,
  updateReminder,
  deleteReminder,
  getUpcoming,
  toggleActive,
  mockSend,
} = require('../controllers/reminderController');
const { protect } = require('../middleware/auth');
const { reminderValidation } = require('../middleware/validate');

// All routes are protected
router.use(protect);

// GET /api/reminders/upcoming  (must be before /:id to avoid route conflict)
router.get('/upcoming', getUpcoming);

// GET /api/reminders
router.get('/', getReminders);

// GET /api/reminders/:id
router.get('/:id', getReminder);

// POST /api/reminders
router.post('/', reminderValidation, createReminder);

// PUT /api/reminders/:id
router.put('/:id', updateReminder);

// DELETE /api/reminders/:id
router.delete('/:id', deleteReminder);

// PATCH /api/reminders/:id/toggle
router.patch('/:id/toggle', toggleActive);

// POST /api/reminders/:id/send
router.post('/:id/send', mockSend);

module.exports = router;
