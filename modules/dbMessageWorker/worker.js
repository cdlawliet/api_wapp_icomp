const config = require('./config');
const repo = require('./repository');
const sender = require('./sender');

async function executarCiclo() {
  try {
    const msg = await repo.buscarMensagemPendente();

    if (!msg) {
      return;
    }

    if (msg.anexo === null) {
      await sender.enviarMensagemTexto(msg);
    } else {
      await sender.enviarMensagemComAnexo(msg);
    }

    await repo.marcarComoEnviada(msg.id);

    console.log(`Mensagem ${msg.id} enviada com sucesso`);
  } catch (err) {
    console.error('Erro no envio:', err.message);
  }
}

async function loop() {
  await executarCiclo();
  setTimeout(loop, config.delay * 1000);
}

module.exports = loop;
