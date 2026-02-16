const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  message: {
    type: String,
    required: [true, 'Message template is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: {
      values: ['birthday', 'anniversary', 'holiday', 'custom'],
      message: '{VALUE} is not a valid reminder type',
    },
    default: 'custom',
  },
  date: {
    type: Date,
    required: [true, 'Event date is required'],
  },
  recurringYearly: {
    type: Boolean,
    default: true,
  },
  groups: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
    },
  ],
  contacts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  lastSent: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure virtuals are included in JSON output
reminderSchema.set('toJSON', { virtuals: true });
reminderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Reminder', reminderSchema);
