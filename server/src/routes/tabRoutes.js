const express = require('express');
const router = express.Router();
const tabController = require('../controllers/tabController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', tabController.getAllTabs);
router.post('/', tabController.createOrUpdateTab);
router.put('/:id', tabController.updateTabById);
router.delete('/:id', tabController.deleteTab);

module.exports = router;
