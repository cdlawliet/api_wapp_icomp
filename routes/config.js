const express = require('express');
const router = express.Router();
const configService = require('../config/index');

router.get('/', (req, res) => {
  res.json(configService.loadConfig());
});

router.put('/', (req, res) => {
  const newConfig = req.body;

  if (!newConfig.db || !newConfig.api) {
    return res.status(400).json({ error: 'Configuração inválida' });
  }

  configService.saveConfig(newConfig);

  res.json({
    status: true,
    message: 'Configuração salva com sucesso'
  });
});

module.exports = router;
