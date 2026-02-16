const express = require('express');
const router = express.Router();
const {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
} = require('../controllers/groupController');
const { protect } = require('../middleware/auth');
const { groupValidation } = require('../middleware/validate');

// All routes are protected
router.use(protect);

// GET /api/groups
router.get('/', getGroups);

// GET /api/groups/:id
router.get('/:id', getGroup);

// POST /api/groups
router.post('/', groupValidation, createGroup);

// PUT /api/groups/:id
router.put('/:id', updateGroup);

// DELETE /api/groups/:id
router.delete('/:id', deleteGroup);

module.exports = router;
