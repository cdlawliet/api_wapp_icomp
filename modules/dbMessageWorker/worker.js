const repo = require('./repository');
const sender = require('./sender');
const { loadConfig } = require('../../config/index');

async function executarCiclo() {
  const config = loadConfig();

  const msg = await repo.buscarMensagemPendente(config.grupo);
  if (!msg) return;

  if (msg.anexo === null) {
    await sender.enviarMensagemTexto(msg);
  } else {
    await sender.enviarMensagemComAnexo(msg);
  }

  await repo.marcarComoEnviada(msg.id);

  console.log(`[Worker] Mensagem ${msg.id} enviada com sucesso`);
}

module.exports = executarCiclo;
