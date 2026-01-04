const mysql = require("mysql2/promise");
const config = require("./config/environment");

const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  port: Number(config.db.port || 3306),
});

module.exports = pool;
