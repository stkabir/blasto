"use strict";

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "2.24.31.74",
  port: 3320,
  user: "admin",
  password: "1xgu0hfsephxfav9",
  database: "blasto",
  connectionLimit: 3,
  waitForConnections: true,
  queueLimit: 0,
});

module.exports = pool;
