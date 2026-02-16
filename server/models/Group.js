const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  color: {
    type: String,
    default: '#6366f1',
    match: [/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Please provide a valid hex color'],
  },
  icon: {
    type: String,
    default: 'users',
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure virtuals are included in JSON output
groupSchema.set('toJSON', { virtuals: true });
groupSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Group', groupSchema);
