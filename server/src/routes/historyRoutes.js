const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', historyController.getHistory);
router.post('/', historyController.addHistory);
router.delete('/:id', historyController.deleteHistoryEntry);
router.delete('/url', historyController.deleteHistoryEntryByUrl);
router.delete('/', historyController.clearHistory);

module.exports = router;
