const express = require('express');
const { body, validationResult } = require('express-validator');
const Form = require('../models/Form');
const Submission = require('../models/Submission');
const { protect, authorize, checkPermission } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all forms
// @route   GET /api/forms
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;
    const query = {};

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // If user is not admin, only show forms they created or public forms
    if (req.user.role !== 'admin') {
      query.$or = [
        { createdBy: req.user.id },
        { isPublic: true }
      ];
    }

    const forms = await Form.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Form.countDocuments(query);

    res.json({
      success: true,
      count: forms.length,
      total,
      pages: Math.ceil(total / limit),
      current: page,
      data: forms
    });
  } catch (error) {
    console.error('Get forms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single form (public for submission)
// @route   GET /api/forms/:id/submit
// @access  Public
router.get('/:id/submit', async (req, res) => {
  try {
    const form = await Form.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Only allow access to active forms
    if (!form.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Form is not active'
      });
    }

    res.json({
      success: true,
      data: form
    });
  } catch (error) {
    console.error('Get form for submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single form
// @route   GET /api/forms/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const form = await Form.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Check if user has access to this form
    if (req.user.role !== 'admin' && 
        form.createdBy._id.toString() !== req.user.id && 
        !form.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this form'
      });
    }

    res.json({
      success: true,
      data: form
    });
  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new form
// @route   POST /api/forms
// @access  Private
router.post('/', protect, checkPermission('canCreateForms'), [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title is required and must be less than 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('fields').isArray({ min: 1 }).withMessage('At least one field is required'),
  body('fields.*.name').trim().isLength({ min: 1 }).withMessage('Field name is required'),
  body('fields.*.label').trim().isLength({ min: 1 }).withMessage('Field label is required'),
  body('fields.*.type').isIn(['text', 'email', 'number', 'textarea', 'select', 'checkbox', 'radio', 'date', 'file']).withMessage('Invalid field type')
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

    const formData = {
      ...req.body,
      createdBy: req.user.id
    };

    const form = await Form.create(formData);

    res.status(201).json({
      success: true,
      data: form
    });
  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update form
// @route   PUT /api/forms/:id
// @access  Private
router.put('/:id', protect, [
  body('title').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Title must be less than 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
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

    let form = await Form.findById(req.params.id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Check if user has permission to update this form
    if (req.user.role !== 'admin' && form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this form'
      });
    }

    form = await Form.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: form
    });
  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete form
// @route   DELETE /api/forms/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Check if user has permission to delete this form
    if (req.user.role !== 'admin' && form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this form'
      });
    }

    // Delete all submissions for this form
    await Submission.deleteMany({ formId: req.params.id });

    // Delete the form
    await Form.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Form deleted successfully'
    });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get form submissions
// @route   GET /api/forms/:id/submissions
// @access  Private
router.get('/:id/submissions', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, assignedTo } = req.query;
    const query = { formId: req.params.id };

    // Add filters
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;

    const submissions = await Submission.find(query)
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .sort({ createdAt: -1 })
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
    console.error('Get form submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get form statistics
// @route   GET /api/forms/:id/stats
// @access  Private
router.get('/:id/stats', protect, async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Get submission statistics
    const stats = await Submission.aggregate([
      { $match: { formId: form._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalSubmissions = await Submission.countDocuments({ formId: req.params.id });
    const recentSubmissions = await Submission.countDocuments({
      formId: req.params.id,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      data: {
        totalSubmissions,
        recentSubmissions,
        statusBreakdown: stats,
        form: {
          id: form._id,
          title: form.title,
          submissionCount: form.submissionCount
        }
      }
    });
  } catch (error) {
    console.error('Get form stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
