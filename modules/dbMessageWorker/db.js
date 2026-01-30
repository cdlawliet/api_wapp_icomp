const { Pool } = require('pg');
const { loadConfig } = require('../../config/index');

function createPool() {
  const config = loadConfig();

  return new Pool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database
  });
}

module.exports = createPool();
