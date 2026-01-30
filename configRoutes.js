const express = require('express');
const router = express.Router();
const { getConfig, saveConfig } = require('./configService');

router.get('/config', (req, res) => {
    const config = getConfig();
    res.json(config);
});

router.post('/config', (req, res) => {
    const newConfig = req.body;
    saveConfig(newConfig);
    res.json({ message: "Configurações atualizadas com sucesso" });
});

module.exports = router;