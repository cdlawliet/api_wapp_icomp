const express = require('express');
const router = express.Router();

const worker = require('../modules/dbMessageWorker'); // usa as funções expostas

router.get('/status', (req, res) => {
  res.json(worker.status());
});

router.post('/start', (req, res) => {
  res.json(worker.start());
});

router.post('/stop', (req, res) => {
  res.json(worker.stop());
});

module.exports = router;
