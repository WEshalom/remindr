const express = require('express');
const router = express.Router();
const {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  importContacts,
} = require('../controllers/contactController');
const { protect } = require('../middleware/auth');
const { contactValidation } = require('../middleware/validate');

// All routes are protected
router.use(protect);

// POST /api/contacts/import  (must be before /:id to avoid route conflict)
router.post('/import', importContacts);

// GET /api/contacts
router.get('/', getContacts);

// GET /api/contacts/:id
router.get('/:id', getContact);

// POST /api/contacts
router.post('/', contactValidation, createContact);

// PUT /api/contacts/:id
router.put('/:id', updateContact);

// DELETE /api/contacts/:id
router.delete('/:id', deleteContact);

module.exports = router;
