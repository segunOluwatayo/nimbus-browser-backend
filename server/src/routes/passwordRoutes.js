const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/passwordController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', passwordController.getPasswords);
router.post('/', passwordController.addPassword);
router.put('/:id', passwordController.updatePassword);
router.delete('/:id', passwordController.deletePassword);

module.exports = router;
