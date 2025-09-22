const express = require('express');
const { body, validationResult } = require('express-validator');
const Submission = require('../models/Submission');
const Form = require('../models/Form');
const { protect, authorize, checkPermission } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all submissions
// @route   GET /api/submissions
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      priority, 
      assignedTo, 
      formId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Add filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (formId) query.formId = formId;

    // Search functionality
    if (search) {
      query.$or = [
        { 'data': { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // If user is not admin, only show submissions they can access
    if (req.user.role !== 'admin') {
      if (req.user.permissions.canViewAllSubmissions) {
        // User can view all submissions
      } else {
        // User can only view submissions assigned to them or they submitted
        query.$or = [
          { assignedTo: req.user.id },
          { submittedBy: req.user.id }
        ];
      }
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const submissions = await Submission.find(query)
      .populate('formId', 'title')
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Submission.countDocuments(query);

    res.json({
      success: true,
      count: submissions.length,
      total,
      pages: Math.ceil(total / limit),
      current: page,
      data: submissions
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single submission
// @route   GET /api/submissions/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('formId', 'title fields')
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .populate('notes.addedBy', 'name email');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check if user has access to this submission
    if (req.user.role !== 'admin' && 
        submission.assignedTo?._id.toString() !== req.user.id &&
        submission.submittedBy?._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this submission'
      });
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new submission
// @route   POST /api/submissions
// @access  Public (for form submissions)
router.post('/', [
  body('formId').isMongoId().withMessage('Valid form ID is required'),
  body('data').isObject().withMessage('Submission data is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { formId, data, tags = [] } = req.body;

    // Check if form exists and is active
    const form = await Form.findById(formId);
    if (!form || !form.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Form not found or inactive'
      });
    }

    // Check if user is authenticated (for forms that require authentication)
    let submittedBy = null;
    if (form.settings.requireAuthentication && req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      submittedBy = decoded.id;
    }

    // Create submission
    const submissionData = {
      formId,
      data,
      tags,
      submittedBy,
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        region: req.get('CF-IPCountry') || 'unknown',
        referrer: req.get('Referer')
      }
    };

    const submission = await Submission.create(submissionData);

    // Update form submission count
    await Form.findByIdAndUpdate(formId, { $inc: { submissionCount: 1 } });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`form-${formId}`).emit('new-submission', {
      submission,
      formTitle: form.title
    });

    res.status(201).json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update submission
// @route   PUT /api/submissions/:id
// @access  Private
router.put('/:id', protect, checkPermission('canEditSubmissions'), [
  body('status').optional().isIn(['pending', 'in-progress', 'completed', 'rejected', 'on-hold']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('assignedTo').optional().isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    let submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check if user has permission to update this submission
    if (req.user.role !== 'admin' && 
        submission.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this submission'
      });
    }

    // Add lastUpdatedBy
    req.body.lastUpdatedBy = req.user.id;

    submission = await Submission.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('assignedTo', 'name email');

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`form-${submission.formId}`).emit('submission-updated', {
      submission,
      updatedBy: req.user.name
    });

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Update submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Add note to submission
// @route   POST /api/submissions/:id/notes
// @access  Private
router.post('/:id/notes', protect, [
  body('text').trim().isLength({ min: 1 }).withMessage('Note text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check if user has access to this submission
    if (req.user.role !== 'admin' && 
        submission.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add notes to this submission'
      });
    }

    const note = {
      text: req.body.text,
      addedBy: req.user.id
    };

    submission.notes.push(note);
    submission.lastUpdatedBy = req.user.id;
    await submission.save();

    // Populate the note data
    await submission.populate('notes.addedBy', 'name email');

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`form-${submission.formId}`).emit('submission-note-added', {
      submissionId: submission._id,
      note: submission.notes[submission.notes.length - 1],
      addedBy: req.user.name
    });

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete submission
// @route   DELETE /api/submissions/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    await Submission.findByIdAndDelete(req.params.id);

    // Update form submission count
    await Form.findByIdAndUpdate(submission.formId, { $inc: { submissionCount: -1 } });

    res.json({
      success: true,
      message: 'Submission deleted successfully'
    });
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get submission statistics
// @route   GET /api/submissions/stats/overview
// @access  Private
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build query based on user permissions
    let query = { createdAt: { $gte: startDate } };
    if (req.user.role !== 'admin' && !req.user.permissions.canViewAllSubmissions) {
      query.$or = [
        { assignedTo: req.user.id },
        { submittedBy: req.user.id }
      ];
    }

    // Get statistics
    const [
      totalSubmissions,
      statusBreakdown,
      priorityBreakdown,
      recentSubmissions
    ] = await Promise.all([
      Submission.countDocuments(query),
      Submission.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Submission.aggregate([
        { $match: query },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Submission.countDocuments({
        ...query,
        createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalSubmissions,
        recentSubmissions,
        statusBreakdown,
        priorityBreakdown,
        period
      }
    });
  } catch (error) {
    console.error('Get submission stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
