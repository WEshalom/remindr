const { validationResult } = require('express-validator');
const Reminder = require('../models/Reminder');
const Contact = require('../models/Contact');

/**
 * @desc    Get all reminders for the authenticated user
 * @route   GET /api/reminders
 * @access  Private
 */
const getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user._id })
      .populate('groups', 'name color icon')
      .populate('contacts', 'firstName lastName phone email')
      .populate('subjectContact', 'firstName lastName phone email')
      .sort({ date: 1 });

    res.json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (error) {
    console.error('getReminders error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reminders',
    });
  }
};

/**
 * @desc    Get a single reminder
 * @route   GET /api/reminders/:id
 * @access  Private
 */
const getReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate('groups', 'name color icon')
      .populate('contacts', 'firstName lastName phone email')
      .populate('subjectContact', 'firstName lastName phone email');

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found',
      });
    }

    res.json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    console.error('getReminder error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reminder',
    });
  }
};

/**
 * @desc    Create a new reminder
 * @route   POST /api/reminders
 * @access  Private
 */
const createReminder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const reminderData = {
      ...req.body,
      user: req.user._id,
    };

    const reminder = await Reminder.create(reminderData);
    const populated = await reminder.populate([
      { path: 'groups', select: 'name color icon' },
      { path: 'contacts', select: 'firstName lastName phone email' },
      { path: 'subjectContact', select: 'firstName lastName phone email' },
    ]);

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    console.error('createReminder error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error creating reminder',
    });
  }
};

/**
 * @desc    Update a reminder
 * @route   PUT /api/reminders/:id
 * @access  Private
 */
const updateReminder = async (req, res) => {
  try {
    let reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found',
      });
    }

    reminder = await Reminder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('groups', 'name color icon')
      .populate('contacts', 'firstName lastName phone email')
      .populate('subjectContact', 'firstName lastName phone email');

    res.json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    console.error('updateReminder error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error updating reminder',
    });
  }
};

/**
 * @desc    Delete a reminder
 * @route   DELETE /api/reminders/:id
 * @access  Private
 */
const deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found',
      });
    }

    await Reminder.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Reminder deleted successfully',
    });
  } catch (error) {
    console.error('deleteReminder error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error deleting reminder',
    });
  }
};

/**
 * @desc    Get upcoming reminders (next 30 days, accounting for recurring yearly)
 * @route   GET /api/reminders/upcoming
 * @access  Private
 */
const getUpcoming = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const reminders = await Reminder.find({
      user: req.user._id,
      isActive: true,
    })
      .populate('groups', 'name color icon')
      .populate('contacts', 'firstName lastName phone email');

    // Filter reminders that fall within the next 30 days
    const upcoming = reminders.filter((reminder) => {
      const eventDate = new Date(reminder.date);

      if (reminder.recurringYearly) {
        // For recurring reminders, check if the month/day falls within the next 30 days
        // by projecting the event onto the current year
        const thisYearOccurrence = new Date(
          now.getFullYear(),
          eventDate.getMonth(),
          eventDate.getDate()
        );

        // Also check next year in case we are near year-end
        const nextYearOccurrence = new Date(
          now.getFullYear() + 1,
          eventDate.getMonth(),
          eventDate.getDate()
        );

        return (
          (thisYearOccurrence >= now && thisYearOccurrence <= thirtyDaysFromNow) ||
          (nextYearOccurrence >= now && nextYearOccurrence <= thirtyDaysFromNow)
        );
      }

      // Non-recurring: just check the exact date
      return eventDate >= now && eventDate <= thirtyDaysFromNow;
    });

    // Sort by the next occurrence date
    upcoming.sort((a, b) => {
      const getNextOccurrence = (reminder) => {
        const eventDate = new Date(reminder.date);
        if (!reminder.recurringYearly) return eventDate;

        const thisYear = new Date(
          now.getFullYear(),
          eventDate.getMonth(),
          eventDate.getDate()
        );
        if (thisYear >= now) return thisYear;

        return new Date(
          now.getFullYear() + 1,
          eventDate.getMonth(),
          eventDate.getDate()
        );
      };

      return getNextOccurrence(a) - getNextOccurrence(b);
    });

    res.json({
      success: true,
      count: upcoming.length,
      data: upcoming,
    });
  } catch (error) {
    console.error('getUpcoming error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching upcoming reminders',
    });
  }
};

/**
 * @desc    Toggle reminder active status
 * @route   PATCH /api/reminders/:id/toggle
 * @access  Private
 */
const toggleActive = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found',
      });
    }

    reminder.isActive = !reminder.isActive;
    await reminder.save();

    const populated = await reminder.populate([
      { path: 'groups', select: 'name color icon' },
      { path: 'contacts', select: 'firstName lastName phone email' },
      { path: 'subjectContact', select: 'firstName lastName phone email' },
    ]);

    res.json({
      success: true,
      data: populated,
    });
  } catch (error) {
    console.error('toggleActive error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error toggling reminder status',
    });
  }
};

/**
 * @desc    Simulate sending SMS for a reminder (mock send)
 * @route   POST /api/reminders/:id/send
 * @access  Private
 */
const mockSend = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate('groups', 'name color icon')
      .populate('contacts', 'firstName lastName phone email')
      .populate('subjectContact', 'firstName lastName phone email');

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found',
      });
    }

    // Collect all contacts that would receive the SMS
    const recipientSet = new Map();

    // Add directly attached contacts
    if (reminder.contacts && reminder.contacts.length > 0) {
      reminder.contacts.forEach((contact) => {
        recipientSet.set(contact._id.toString(), contact);
      });
    }

    // Add contacts from groups
    if (reminder.groups && reminder.groups.length > 0) {
      const groupIds = reminder.groups.map((g) => g._id);
      const groupContacts = await Contact.find({
        user: req.user._id,
        groups: { $in: groupIds },
      });

      groupContacts.forEach((contact) => {
        recipientSet.set(contact._id.toString(), contact);
      });
    }

    // Exclude the subject contact (e.g., don't send someone their own birthday reminder)
    const subjectId = reminder.subjectContact?._id?.toString() || reminder.subjectContact?.toString();
    if (subjectId) {
      recipientSet.delete(subjectId);
    }

    const recipients = Array.from(recipientSet.values());
    const excluded = subjectId ? await Contact.findById(subjectId).select('firstName lastName') : null;

    // Simulate sending: build the list of messages that would be sent
    const messages = recipients.map((contact) => ({
      to: contact.phone,
      contactName: `${contact.firstName} ${contact.lastName}`,
      message: reminder.message
        .replace('{{firstName}}', contact.firstName)
        .replace('{{lastName}}', contact.lastName)
        .replace('{{fullName}}', `${contact.firstName} ${contact.lastName}`),
      status: 'simulated',
    }));

    // Update lastSent timestamp
    reminder.lastSent = new Date();
    await reminder.save();

    res.json({
      success: true,
      data: {
        reminder: {
          _id: reminder._id,
          title: reminder.title,
          type: reminder.type,
        },
        totalRecipients: recipients.length,
        messages,
        excluded: excluded
          ? `${excluded.firstName} ${excluded.lastName} (subject of reminder — not notified)`
          : null,
        sentAt: reminder.lastSent,
        note: 'This is a simulated send. No actual SMS messages were sent.',
      },
    });
  } catch (error) {
    console.error('mockSend error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error simulating send',
    });
  }
};

module.exports = {
  getReminders,
  getReminder,
  createReminder,
  updateReminder,
  deleteReminder,
  getUpcoming,
  toggleActive,
  mockSend,
};
