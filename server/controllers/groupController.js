const { validationResult } = require('express-validator');
const Group = require('../models/Group');
const Contact = require('../models/Contact');

/**
 * @desc    Get all groups for the authenticated user (with contact counts)
 * @route   GET /api/groups
 * @access  Private
 */
const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ user: req.user._id }).sort({ name: 1 });

    // Get contact counts for each group using aggregation
    const groupIds = groups.map((g) => g._id);
    const contactCounts = await Contact.aggregate([
      {
        $match: {
          user: req.user._id,
          groups: { $in: groupIds },
        },
      },
      { $unwind: '$groups' },
      { $match: { groups: { $in: groupIds } } },
      {
        $group: {
          _id: '$groups',
          count: { $sum: 1 },
        },
      },
    ]);

    // Map counts to groups
    const countMap = {};
    contactCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const groupsWithCounts = groups.map((group) => ({
      ...group.toJSON(),
      contactCount: countMap[group._id.toString()] || 0,
    }));

    res.json({
      success: true,
      count: groupsWithCounts.length,
      data: groupsWithCounts,
    });
  } catch (error) {
    console.error('getGroups error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching groups',
    });
  }
};

/**
 * @desc    Get a single group with its contacts
 * @route   GET /api/groups/:id
 * @access  Private
 */
const getGroup = async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Fetch contacts belonging to this group
    const contacts = await Contact.find({
      user: req.user._id,
      groups: group._id,
    }).sort({ firstName: 1 });

    res.json({
      success: true,
      data: {
        ...group.toJSON(),
        contactCount: contacts.length,
        contacts,
      },
    });
  } catch (error) {
    console.error('getGroup error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching group',
    });
  }
};

/**
 * @desc    Create a new group
 * @route   POST /api/groups
 * @access  Private
 */
const createGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const groupData = {
      ...req.body,
      user: req.user._id,
    };

    const group = await Group.create(groupData);

    res.status(201).json({
      success: true,
      data: {
        ...group.toJSON(),
        contactCount: 0,
      },
    });
  } catch (error) {
    console.error('createGroup error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error creating group',
    });
  }
};

/**
 * @desc    Update a group
 * @route   PUT /api/groups/:id
 * @access  Private
 */
const updateGroup = async (req, res) => {
  try {
    let group = await Group.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    group = await Group.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Get contact count
    const contactCount = await Contact.countDocuments({
      user: req.user._id,
      groups: group._id,
    });

    res.json({
      success: true,
      data: {
        ...group.toJSON(),
        contactCount,
      },
    });
  } catch (error) {
    console.error('updateGroup error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error updating group',
    });
  }
};

/**
 * @desc    Delete a group (also removes group reference from contacts)
 * @route   DELETE /api/groups/:id
 * @access  Private
 */
const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Remove this group reference from all contacts that have it
    await Contact.updateMany(
      { groups: group._id },
      { $pull: { groups: group._id } }
    );

    await Group.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error) {
    console.error('deleteGroup error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error deleting group',
    });
  }
};

module.exports = {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
};
