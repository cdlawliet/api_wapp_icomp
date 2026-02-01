const repo = require('./repository');
const sender = require('./sender');
const { loadConfig } = require('../../config/index');

function getIo() {
  return global.io || global.__io || null;
}

function emitUiMessage(text) {
  try {
    const io = getIo();
    if (io && typeof io.emit === 'function') {
      io.emit('message', text);
    }
  } catch (_) {
    // silencioso: não derruba worker por causa de log
  }
}

function onlyDigits(v) {
  return (v ?? '').toString().replace(/\D/g, '');
}

// máscara BR simples: "55 11 9****-****"
function maskPhoneBR(number) {
  const d = onlyDigits(number);

  // espera algo tipo 55 + DDD + 9 dígitos (cel) ou 8 dígitos (fixo)
  if (d.length < 10) return d;

  let cc = '';
  let rest = d;

  if (d.startsWith('55') && d.length >= 12) {
    cc = '55';
    rest = d.slice(2);
  }

  const ddd = rest.slice(0, 2);
  const local = rest.slice(2);

  // mantém 1º dígito do local e mascara o resto
  const first = local.slice(0, 1) || '';
  const masked = `${first}****-****`;

  return `${cc ? cc + ' ' : ''}${ddd} ${masked}`.trim();
}

function buildSuccessLog(msg) {
  const destinatario = maskPhoneBR('55' + onlyDigits(msg.fone_destino));
  const conteudo = (msg.anexo === null)
    ? (msg.mensagem || '')
    : (msg.mensagem || ''); // caption

  return (
    `Mensagem enviada com sucesso: id mensagem (${msg.id})\n` +
    `Destinatário: ${destinatario}\n` +
    `Mensagem: ${conteudo}`
  );
}

function buildErrorLog(msg, err) {
  const destinatario = maskPhoneBR('55' + onlyDigits(msg.fone_destino));

  let detalhe = err?.message || err || 'Erro desconhecido';

  // axios costuma ter response
  if (err?.response) {
    const status = err.response.status;
    const data = err.response.data;
    const dataTxt = typeof data === 'string' ? data : JSON.stringify(data);
    detalhe = `HTTP ${status} - ${dataTxt}`;
  }

  const conteudo = (msg.anexo === null)
    ? (msg.mensagem || '')
    : (msg.mensagem || ''); // caption

  return (
    `Erro ao enviar mensagem: id mensagem (${msg.id})\n` +
    `Destinatário: ${destinatario}\n` +
    `Mensagem: ${conteudo}\n` +
    `Erro: ${detalhe}`
  );
}

async function executarCiclo() {
  const config = loadConfig();

  const msg = await repo.buscarMensagemPendente(config.grupo);
  if (!msg) return;

  try {
    if (msg.anexo === null) {
      await sender.enviarMensagemTexto(msg);
    } else {
      await sender.enviarMensagemComAnexo(msg);
    }

    await repo.marcarComoEnviada(msg.id);

    const okLog = buildSuccessLog(msg);
    console.log(`[Worker] Mensagem ${msg.id} enviada com sucesso`);
    emitUiMessage(okLog);
  } catch (err) {
    console.error(`[Worker] Erro ao enviar mensagem ${msg.id}:`, err?.message || err);

    const errLog = buildErrorLog(msg, err);
    emitUiMessage(errLog);

    // não marca como enviada se deu erro
  }
}

module.exports = executarCiclo;
