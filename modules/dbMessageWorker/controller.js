const { loadConfig } = require('../../config/index');
const executarCiclo = require('./worker'); // worker.js deve exportar executarCiclo (ajuste abaixo)

let running = false;
let timer = null;

function clearTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

async function tick() {
  if (!running) return;

  try {
    await executarCiclo();
  } catch (err) {
    console.error('[Worker] Erro no ciclo:', err?.message || err);
  }

  // agenda próximo ciclo com delay atual (config pode mudar sem restart)
  const config = loadConfig();
  timer = setTimeout(tick, (config.delay || 5) * 1000);
}

function start() {
  if (running) return { running: true, message: 'Worker já estava ativo' };
  running = true;
  clearTimer();
  tick(); // inicia imediatamente
  return { running: true, message: 'Worker iniciado' };
}

function stop() {
  running = false;
  clearTimer();
  return { running: false, message: 'Worker parado' };
}

function status() {
  return { running };
}

module.exports = { start, stop, status };
