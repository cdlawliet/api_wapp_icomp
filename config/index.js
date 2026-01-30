const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config.json');

function loadConfig() {
  const raw = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(raw);
}

function saveConfig(data) {
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

module.exports = {
  loadConfig,
  saveConfig
};
