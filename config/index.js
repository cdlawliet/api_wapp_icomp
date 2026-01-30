const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../config.json');

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

function saveConfig(newConfig) {
  fs.writeFileSync(
    CONFIG_PATH,
    JSON.stringify(newConfig, null, 2),
    'utf8'
  );
}

module.exports = {
  loadConfig,
  saveConfig
};
