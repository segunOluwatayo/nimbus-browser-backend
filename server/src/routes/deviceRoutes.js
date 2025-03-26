const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', deviceController.getDevices);
router.post('/register', deviceController.registerDevice);
router.put('/active', deviceController.updateLastActive);
router.delete('/:deviceId', deviceController.removeDevice);

module.exports = router;