const express = require('express');
const router = express.Router();
const dockerController = require('../controllers/dockerController');

router.post('/generate', dockerController.generateAndBuild);

router.get('/build/status/:id', dockerController.getBuildStatus);

module.exports = router;
