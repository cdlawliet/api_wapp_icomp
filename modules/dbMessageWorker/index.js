const controller = require('./controller');
const { loadConfig } = require('../../config/index');

module.exports = function () {
  const config = loadConfig();

  console.log('==============================');
  console.log(' DB Message Worker carregado');
  console.log(' Grupo:', config.grupo);
  console.log(' Delay:', config.delay, 'segundos');
  console.log(' Status inicial: PARADO');
  console.log('==============================');

  // NÃO inicia aqui. Apenas deixa pronto.
  return controller;
};

// expõe também para outros módulos (routes)
module.exports.controller = controller;
module.exports.start = controller.start;
module.exports.stop = controller.stop;
module.exports.status = controller.status;
