const { loadConfig } = require('../../config/index');
const executarCiclo = require('./worker');

let running = false;
let timer = null;

function getIo() {
  return global.io || global.__io || null;
}

function emitUiMessage(text) {
  try {
    const io = getIo();
    if (io && typeof io.emit === 'function') {
      io.emit('message', text);
    }
  } catch (_) {}
}

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
    const msg = '[Worker] Erro no ciclo: ' + (err?.message || err);
    console.error(msg);
    emitUiMessage(msg);
  }

  const config = loadConfig();
  timer = setTimeout(tick, (config.delay || 5) * 1000);
}

function start() {
  if (running) return { running: true, message: 'Worker já estava ativo' };

  running = true;
  clearTimer();
  tick();
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
