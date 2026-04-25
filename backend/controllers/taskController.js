const Task = require('../models/Task');
const multer = require('multer');
const path = require('path');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Create a task
const createTask = async (req, res) => {
  try {
    const task = await Task.create({
      ...req.body,
      assignedTo: req.userId
    });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all tasks with filters, search, sort
const getAllTasks = async (req, res) => {
  try {
    const { 
      status, priority, category, search, sortBy, 
      order = 'desc', page = 1, limit = 50 
    } = req.query;
    
    const filter = { assignedTo: req.userId, isArchived: false };
    
    if (status && status !== 'All') filter.status = status;
    if (priority && priority !== 'All') filter.priority = priority;
    if (category && category !== 'All') filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy || 'createdAt'] = order === 'asc' ? 1 : -1;

    const tasks = await Task.find(filter)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: tasks
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single task
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk delete
const bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    await Task.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ success: true, message: 'Tasks deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk update status
const bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    await Task.updateMany({ _id: { $in: ids } }, { status });
    res.status(200).json({ success: true, message: 'Tasks updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add comment
const addComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    task.comments.push({ text: req.body.text });
    await task.save();
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload attachment
const uploadAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    task.attachments.push({
      filename: req.file.originalname,
      path: req.file.path
    });
    await task.save();
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get analytics
const getAnalytics = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.userId, isArchived: false });
    
    const analytics = {
      total: tasks.length,
      byStatus: {
        Pending: tasks.filter(t => t.status === 'Pending').length,
        'In Progress': tasks.filter(t => t.status === 'In Progress').length,
        Completed: tasks.filter(t => t.status === 'Completed').length,
      },
      byPriority: {
        High: tasks.filter(t => t.priority === 'High').length,
        Medium: tasks.filter(t => t.priority === 'Medium').length,
        Low: tasks.filter(t => t.priority === 'Low').length,
      },
      byCategory: {},
      completionRate: tasks.length > 0 ? 
        Math.round((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100) : 0,
      upcomingDeadlines: tasks.filter(t => 
        t.status !== 'Completed' && 
        new Date(t.dueDate) > new Date() &&
        new Date(t.dueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      ).length,
      overdueTasks: tasks.filter(t => 
        t.status !== 'Completed' && 
        new Date(t.dueDate) < new Date()
      ).length
    };

    tasks.forEach(t => {
      analytics.byCategory[t.category] = (analytics.byCategory[t.category] || 0) + 1;
    });

    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTask,
  updateTask,
  deleteTask,
  bulkDelete,
  bulkUpdateStatus,
  addComment,
  uploadAttachment,
  getAnalytics,
  upload
};