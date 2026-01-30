const axios = require('axios');
const FormData = require('form-data');
const { loadConfig } = require('../../config/index');

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

async function enviarMensagemComAnexo(msg) {
  const config = loadConfig();

  const form = new FormData();

  form.append('number', '55' + msg.fone_destino);
  form.append('caption', msg.mensagem || '');
  form.append(
    'file',
    Buffer.from(msg.anexo),
    msg.nome_original_arquivo_anexo
  );
  form.append('namemedia', msg.nome_original_arquivo_anexo);

  await axios.post(
    `${config.api.baseUrl}/media`,
    form,
    {
      headers: form.getHeaders()
    }
  );
}

module.exports = {
  enviarMensagemTexto,
  enviarMensagemComAnexo
};
