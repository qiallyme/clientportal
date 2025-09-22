const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for anonymous submissions
  },
  data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'rejected', 'on-hold'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  notes: [{
    text: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    ipAddress: String,
    userAgent: String,
    region: String,
    referrer: String
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: Date,
  tags: [String]
}, {
  timestamps: true
});

// Indexes for better performance
submissionSchema.index({ formId: 1, status: 1 });
submissionSchema.index({ assignedTo: 1, status: 1 });
submissionSchema.index({ createdAt: -1 });
submissionSchema.index({ status: 1, priority: 1 });

// Virtual for submission number
submissionSchema.virtual('submissionNumber').get(function() {
  return `SUB-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Ensure virtual fields are serialized
submissionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Submission', submissionSchema);
