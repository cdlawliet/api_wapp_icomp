const express = require('express');
const router = express.Router();
const configService = require('../config/index');

function onlyDigits(v) {
  return (v ?? '').toString().replace(/\D/g, '');
}

router.get('/', (req, res) => {
  res.json(configService.loadConfig());
});

router.put('/', (req, res) => {
  const newConfig = req.body || {};

  if (!newConfig.db) {
    return res.status(400).json({ error: 'Configuração inválida (db ausente)' });
  }

  // ✅ garante boolean e default
  if (typeof newConfig.autoStartWorker !== 'boolean') {
    newConfig.autoStartWorker = false;
  }

  // ✅ garante estrutura api
  newConfig.api = newConfig.api || {};

  // ✅ compatibilidade: se vier apiPort ou api.port, monta baseUrl
  // (mas continuamos salvando api.baseUrl para não mexer no sender.js)
  const apiPort =
    Number(newConfig.apiPort) ||
    Number(newConfig.api?.port) ||
    null;

  if (apiPort && apiPort > 0) {
    newConfig.api.baseUrl = `http://localhost:${apiPort}`;
    delete newConfig.apiPort;
    delete newConfig.api.port;
  }

  // ✅ se vier baseUrl inválida, tenta ao menos não salvar lixo
  if (typeof newConfig.api.baseUrl !== 'string' || !newConfig.api.baseUrl.trim()) {
    // tenta reaproveitar a atual
    const current = configService.loadConfig();
    newConfig.api.baseUrl = current?.api?.baseUrl || 'http://localhost:8888';
  }

  // sanitiza baseUrl só pra garantir formato básico
  // (não vamos forçar demais)
  const m = newConfig.api.baseUrl.match(/localhost:(\d+)/i);
  if (m && m[1]) {
    const p = Number(onlyDigits(m[1])) || 8888;
    newConfig.api.baseUrl = `http://localhost:${p}`;
  }

  configService.saveConfig(newConfig);

  res.json({
    status: true,
    message: 'Configuração salva com sucesso'
  });
});

module.exports = router;
