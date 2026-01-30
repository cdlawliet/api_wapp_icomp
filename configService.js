const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'config.json');

const defaultConfig = {
  db_host: "",
  db_port: "",
  db_user: "",
  db_pass: "",
  db_name: "",
  grupo_mensagens: "",
  delay_segundos: 5
};

function ensureConfigExists() {
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    }
}

function getConfig() {
    ensureConfigExists();
    const raw = fs.readFileSync(configPath);
    return JSON.parse(raw);
}

function saveConfig(newConfig) {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    return true;
}

module.exports = { getConfig, saveConfig };