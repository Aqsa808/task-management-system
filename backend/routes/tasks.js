const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validateTask } = require('../middleware/validation');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

const {
  createTask,
  getAllTasks,
  getTask,
  updateTask,
  deleteTask,
  bulkDelete,
  bulkUpdateStatus,
  addComment,
  uploadAttachment,
  getAnalytics
} = require('../controllers/taskController');

// All routes require authentication
router.use(auth);

router.post('/', validateTask, createTask);
router.get('/', getAllTasks);
router.get('/analytics', getAnalytics);
router.get('/:id', getTask);
router.put('/:id', validateTask, updateTask);
router.delete('/:id', deleteTask);
router.post('/bulk-delete', bulkDelete);
router.post('/bulk-update-status', bulkUpdateStatus);
router.post('/:id/comments', addComment);
router.post('/:id/attachments', upload.single('file'), uploadAttachment);

module.exports = router;