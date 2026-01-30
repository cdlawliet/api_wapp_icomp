const iniciarWorker = require('./worker');

module.exports = function () {
  console.log('DB Message Worker iniciado');
  iniciarWorker();
};
