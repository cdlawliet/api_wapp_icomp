const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../../config/index');

const TMP_DIR = path.join(__dirname, 'tmp');

// garante que a pasta tmp existe
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

function onlyDigits(v) {
  return (v ?? '').toString().replace(/\D/g, '');
}

function asAxiosError(err, fallbackMsg) {
  // mantém o erro original do axios (com response) para o worker formatar bem
  if (err) return err;
  return new Error(fallbackMsg || 'Erro ao enviar');
}

/**
 * ENVIO DE TEXTO
 */
async function enviarMensagemTexto(msg) {
  const config = loadConfig();

  const payload = {
    number: '55' + onlyDigits(msg.fone_destino),
    message: msg.mensagem
  };

  try {
    await axios.post(`${config.api.baseUrl}/message`, payload);
  } catch (err) {
    throw asAxiosError(err, 'Falha ao enviar texto');
  }
}

/**
 * ENVIO DE MÍDIA (via URL local /tmp)
 */
async function enviarMensagemComAnexo(msg) {
  const config = loadConfig();

  const tmpFileName = `${Date.now()}_${msg.nome_original_arquivo_anexo}`;
  const tmpFilePath = path.join(TMP_DIR, tmpFileName);

  try {
    fs.writeFileSync(tmpFilePath, Buffer.from(msg.anexo));

    const fileUrl = `${config.api.baseUrl}/tmp/${tmpFileName}`;

    await axios.post(`${config.api.baseUrl}/media`, {
      number: '55' + onlyDigits(msg.fone_destino),
      caption: msg.mensagem || '',
      file: fileUrl,
      fileName: msg.nome_original_arquivo_anexo
    });
  } catch (err) {
    throw asAxiosError(err, 'Falha ao enviar mídia');
  } finally {
    try {
      if (fs.existsSync(tmpFilePath)) fs.unlinkSync(tmpFilePath);
    } catch (_) {}
  }
}

module.exports = {
  enviarMensagemTexto,
  enviarMensagemComAnexo
};
