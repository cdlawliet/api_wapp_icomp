const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function md5(s) {
  return crypto.createHash('md5').update(String(s ?? ''), 'utf8').digest('hex');
}

// arquivo “mascarado”
const SECRET_FILE = path.join(__dirname, '..', 'config', '.cache.bin');

function readTwoLines() {
  const raw = fs.readFileSync(SECRET_FILE, 'utf8');

  // pega só as 2 primeiras linhas “não vazias”
  const lines = raw
    .split(/\r?\n/g)
    .map(l => (l || '').trim())
    .filter(Boolean);

  const userHash = (lines[0] || '').trim();
  const passHash = (lines[1] || '').trim();

  return { userHash, passHash };
}

router.post('/check', (req, res) => {
  try {
    const { user, pass } = req.body || {};

    if (!user || !pass) {
      return res.status(400).json({ ok: false, error: 'Informe usuário e senha.' });
    }

    const { userHash, passHash } = readTwoLines();

    // sanity checks
    if (!userHash || !passHash) {
      return res.status(500).json({ ok: false, error: 'Credenciais não configuradas.' });
    }

    const u = md5(user);
    const p = md5(pass);

    if (u === userHash && p === passHash) {
      return res.json({ ok: true });
    }

    return res.status(401).json({ ok: false, error: 'Usuário ou senha inválidos.' });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'Falha ao validar credenciais.'
    });
  }
});

module.exports = router;
