const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../../config');
const config = loadConfig();

function montarNumero(fone) {
  return `55${fone}`;
}

async function enviarMensagemTexto(msg) {
  await axios.post(`${config.api.baseUrl}/message`, {
    number: montarNumero(msg.fone_destino),
    message: msg.mensagem
  });
}

async function enviarMensagemComAnexo(msg) {
  const tempDir = path.join(__dirname, 'tmp');

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const filePath = path.join(tempDir, msg.nome_original_arquivo_anexo);
  fs.writeFileSync(filePath, msg.anexo);

  const fileUrl = `${config.api.baseUrl}/tmp/${msg.nome_original_arquivo_anexo}`;

  await axios.post(`${config.api.baseUrl}/media`, {
    number: montarNumero(msg.fone_destino),
    caption: msg.mensagem,
    file: fileUrl,
    fileName: msg.nome_original_arquivo_anexo
  });
}

module.exports = {
  enviarMensagemTexto,
  enviarMensagemComAnexo
};
