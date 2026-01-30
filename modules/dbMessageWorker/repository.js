const pool = require('./db');
const { loadConfig } = require('../../config/index');

async function buscarMensagemPendente(grupo) {
  const config = loadConfig();

  const result = await pool.query(
    `
    SELECT *
    FROM envio_mensagens
    WHERE enviada = false
      AND msg_grupo = $1
    ORDER BY id
    LIMIT 1
    `,
    [grupo || config.grupo]
  );

  return result.rows[0] || null;
}

async function marcarComoEnviada(id) {
  await pool.query(
    `
    UPDATE envio_mensagens
    SET enviada = true,
        updated_at = NOW()
    WHERE id = $1
    `,
    [id]
  );
}

module.exports = {
  buscarMensagemPendente,
  marcarComoEnviada
};
