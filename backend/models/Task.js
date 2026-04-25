const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  category: {
    type: String,
    enum: ['Work', 'Personal', 'Study', 'Health', 'Finance', 'Other'],
    default: 'Other'
  },
  tags: [{
    type: String,
    trim: true
  }],
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  attachments: [{
    filename: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  comments: [commentSchema],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  order: {
    type: Number,
    default: 0
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better search performance
taskSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Task', taskSchema);