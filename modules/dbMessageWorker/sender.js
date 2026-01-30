const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../../config/index');

const TMP_DIR = path.join(__dirname, 'tmp');

// garante que a pasta tmp existe
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

/**
 * ENVIO DE TEXTO (não mexemos — já funciona)
 */
async function enviarMensagemTexto(msg) {
  const config = loadConfig();

  const payload = {
    number: '55' + msg.fone_destino,
    message: msg.mensagem
  };

  await axios.post(
    `${config.api.baseUrl}/message`,
    payload
  );
}

/**
 * ENVIO DE MÍDIA (AJUSTADO PARA URL, NÃO MULTIPART)
 */
async function enviarMensagemComAnexo(msg) {
  const config = loadConfig();

  const tmpFileName = `${Date.now()}_${msg.nome_original_arquivo_anexo}`;
  const tmpFilePath = path.join(TMP_DIR, tmpFileName);

  try {
    fs.writeFileSync(tmpFilePath, Buffer.from(msg.anexo));

    const fileUrl = `${config.api.baseUrl}/tmp/${tmpFileName}`;

    await axios.post(`${config.api.baseUrl}/media`, {
      number: '55' + msg.fone_destino,
      caption: msg.mensagem || '',
      file: fileUrl,
      fileName: msg.nome_original_arquivo_anexo
    });
  } finally {
    if (fs.existsSync(tmpFilePath)) {
      fs.unlinkSync(tmpFilePath);
    }
  }
}


module.exports = {
  enviarMensagemTexto,
  enviarMensagemComAnexo
};
