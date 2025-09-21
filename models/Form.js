const mongoose = require('mongoose');

const formSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a form title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  fields: [{
    name: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'email', 'number', 'textarea', 'select', 'checkbox', 'radio', 'date', 'file'],
      required: true
    },
    required: {
      type: Boolean,
      default: false
    },
    options: [String], // For select, radio, checkbox
    placeholder: String,
    validation: {
      min: Number,
      max: Number,
      pattern: String
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  settings: {
    allowMultipleSubmissions: {
      type: Boolean,
      default: true
    },
    requireAuthentication: {
      type: Boolean,
      default: false
    },
    notificationEmail: String,
    autoResponse: {
      enabled: Boolean,
      subject: String,
      message: String
    }
  },
  submissionCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better performance
formSchema.index({ isActive: 1, isPublic: 1 });
formSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Form', formSchema);
