const controller = require('./controller');
const { loadConfig } = require('../../config/index');

module.exports = function () {
  const config = loadConfig();

  console.log('==============================');
  console.log(' DB Message Worker carregado');
  console.log(' Grupo:', config.grupo);
  console.log(' Delay:', config.delay, 'segundos');
  console.log(' AutoStart:', !!config.autoStartWorker);
  console.log('==============================');

  if (config.autoStartWorker) {
    const r = controller.start();
    console.log('[Worker] AutoStart:', r.message);
  } else {
    console.log('[Worker] Iniciando PARADO (manual via painel)');
  }

  return controller;
};

// expõe também para outros módulos (routes)
module.exports.controller = controller;
module.exports.start = controller.start;
module.exports.stop = controller.stop;
module.exports.status = controller.status;
