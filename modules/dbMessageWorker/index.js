const { loadConfig } = require('../../config/index');
const iniciarWorker = require('./worker');

module.exports = function () {
  const config = loadConfig();

  console.log('==============================');
  console.log(' DB Message Worker iniciado');
  console.log(' Grupo:', config.grupo);
  console.log(' Delay:', config.delay, 'segundos');
  console.log('==============================');

  iniciarWorker();
};
