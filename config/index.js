const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config.json');
const examplePath = path.join(__dirname, '../config.example.json');

function createDefaultConfig() {
  return {
    autoStartWorker: false,
    db: {
      host: '127.0.0.1',
      port: 5432,
      user: 'postgres',
      password: '',
      database: 'meubanco'
    },
    delay: 10,
    grupo: 'padrao',
    api: {
      baseUrl: 'http://localhost:8888'
    }
  };
}

// Garante que o arquivo config.json exista
function ensureConfigFile() {
  if (fs.existsSync(configPath)) return;

  // 1) tenta copiar do example
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, configPath);
    return;
  }

  // 2) se não tiver example, cria default
  const defaults = createDefaultConfig();
  fs.writeFileSync(configPath, JSON.stringify(defaults, null, 2), 'utf8');
}

function loadConfig() {
  ensureConfigFile();

  const raw = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(raw);
}

function saveConfig(data) {
  // garante que sempre exista (não é obrigatório aqui, mas é seguro)
  ensureConfigFile();

  fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
  loadConfig,
  saveConfig
};
