const pool = require('./db');
const config = require('./config');

async function buscarMensagemPendente() {
  const sql = `
    SELECT
      id,
      fone_destino,
      mensagem,
      anexo,
      nome_original_arquivo_anexo
    FROM envio_mensagens
    WHERE msg_grupo = $1
      AND enviada IS FALSE
    ORDER BY id ASC
    LIMIT 1
  `;

  const result = await pool.query(sql, [config.grupo]);
  return result.rows[0] || null;
}

async function marcarComoEnviada(id) {
  const sql = `
    UPDATE envio_mensagens
       SET enviada = TRUE
     WHERE id = $1
  `;

  await pool.query(sql, [id]);
}

module.exports = {
  buscarMensagemPendente,
  marcarComoEnviada
};
