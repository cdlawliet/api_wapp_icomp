const { Pool } = require('pg');

const pools = {};

function getPool(config) {
  const key = `${config.db.host}_${config.db.port}_${config.db.database}_${config.db.user}`;

  if (!pools[key]) {
    pools[key] = new Pool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database
    });

    console.log('[DB] Novo pool criado:', key);
  }

  return pools[key];
}

module.exports = getPool;
