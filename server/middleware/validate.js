const { body } = require('express-validator');

const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const contactValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('birthday')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('groups')
    .optional()
    .isArray()
    .withMessage('Groups must be an array'),
];

const groupValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Group name is required')
    .isLength({ max: 50 })
    .withMessage('Group name cannot exceed 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  body('color')
    .optional()
    .trim()
    .matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .withMessage('Please provide a valid hex color'),
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Icon name cannot exceed 30 characters'),
];

const reminderValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message template is required')
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters'),
  body('type')
    .optional()
    .isIn(['birthday', 'anniversary', 'holiday', 'custom'])
    .withMessage('Type must be birthday, anniversary, holiday, or custom'),
  body('date')
    .notEmpty()
    .withMessage('Event date is required')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('recurringYearly')
    .optional()
    .isBoolean()
    .withMessage('Recurring yearly must be a boolean'),
  body('groups')
    .optional()
    .isArray()
    .withMessage('Groups must be an array'),
  body('contacts')
    .optional()
    .isArray()
    .withMessage('Contacts must be an array'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

module.exports = {
  registerValidation,
  loginValidation,
  contactValidation,
  groupValidation,
  reminderValidation,
};
