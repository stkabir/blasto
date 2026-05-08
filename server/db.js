const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "2.24.31.74",
  port: parseInt(process.env.MYSQL_PORT || "3320"),
  user: process.env.MYSQL_USER || "admin",
  password: process.env.MYSQL_PASSWORD || "1xgu0hfsephxfav9",
  database: process.env.MYSQL_DATABASE || "blasto",
  connectionLimit: 3,
  waitForConnections: true,
  queueLimit: 0,
});

module.exports = pool;