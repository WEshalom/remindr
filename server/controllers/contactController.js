const { validationResult } = require('express-validator');
const Contact = require('../models/Contact');

/**
 * @desc    Get all contacts for the authenticated user
 * @route   GET /api/contacts
 * @access  Private
 */
const getContacts = async (req, res) => {
  try {
    const { search, group } = req.query;
    const query = { user: req.user._id };

    // Search by first or last name
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by group
    if (group) {
      query.groups = group;
    }

    const contacts = await Contact.find(query)
      .populate('groups', 'name color icon')
      .sort({ firstName: 1, lastName: 1 });

    res.json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    console.error('getContacts error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching contacts',
    });
  }
};

/**
 * @desc    Get a single contact by ID
 * @route   GET /api/contacts/:id
 * @access  Private
 */
const getContact = async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('groups', 'name color icon');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error('getContact error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching contact',
    });
  }
};

/**
 * @desc    Create a new contact
 * @route   POST /api/contacts
 * @access  Private
 */
const createContact = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const contactData = {
      ...req.body,
      user: req.user._id,
    };

    const contact = await Contact.create(contactData);
    const populated = await contact.populate('groups', 'name color icon');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    console.error('createContact error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error creating contact',
    });
  }
};

/**
 * @desc    Update a contact
 * @route   PUT /api/contacts/:id
 * @access  Private
 */
const updateContact = async (req, res) => {
  try {
    let contact = await Contact.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    contact = await Contact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('groups', 'name color icon');

    res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error('updateContact error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error updating contact',
    });
  }
};

/**
 * @desc    Delete a contact
 * @route   DELETE /api/contacts/:id
 * @access  Private
 */
const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    await Contact.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    console.error('deleteContact error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error deleting contact',
    });
  }
};

/**
 * @desc    Bulk import contacts
 * @route   POST /api/contacts/import
 * @access  Private
 */
const importContacts = async (req, res) => {
  try {
    const { contacts } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of contacts to import',
      });
    }

    // Attach user ID to each contact
    const contactsWithUser = contacts.map((contact) => ({
      ...contact,
      user: req.user._id,
    }));

    const imported = await Contact.insertMany(contactsWithUser, {
      ordered: false,
    });

    res.status(201).json({
      success: true,
      count: imported.length,
      data: imported,
    });
  } catch (error) {
    console.error('importContacts error:', error.message);

    // Handle partial insert errors from insertMany
    if (error.insertedDocs && error.insertedDocs.length > 0) {
      return res.status(207).json({
        success: false,
        message: 'Some contacts failed to import',
        imported: error.insertedDocs.length,
        errors: error.writeErrors?.map((e) => e.errmsg) || [],
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error importing contacts',
    });
  }
};

module.exports = {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  importContacts,
};
