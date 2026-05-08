"use strict";

const express = require("express");
const mariadb = require("mariadb");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

const pool = mariadb.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "blasto",
  connectionLimit: 5,
});

app.use(express.json());
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"],
  })
);

const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many requests, try again later" },
});

async function initDB() {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(12) NOT NULL,
        score INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45)
      )
    `);
    await conn.query(
      "CREATE INDEX IF NOT EXISTS idx_score ON scores (score DESC)"
    );
    console.log("Database initialized");
  } catch (err) {
    console.error("DB init error:", err.message);
  } finally {
    if (conn) conn.release();
  }
}

app.get("/api/scores", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      "SELECT name, score, created_at FROM scores ORDER BY score DESC LIMIT 20"
    );
    res.json(rows.map(({ name, score, created_at }) => ({ name, score, created_at })));
  } catch (err) {
    console.error("GET /api/scores error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

app.post("/api/scores", submitLimiter, async (req, res) => {
  const { name, score } = req.body;

  if (
    !name ||
    typeof name !== "string" ||
    name.trim().length === 0 ||
    name.length > 12
  ) {
    return res.status(400).json({ error: "Invalid name (1-12 characters)" });
  }

  if (!Number.isInteger(score) || score < 0) {
    return res.status(400).json({ error: "Invalid score" });
  }

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      "INSERT INTO scores (name, score, ip_address) VALUES (?, ?, ?)",
      [name.trim(), score, ip.substring(0, 45)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/scores error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Leaderboard API running on port ${PORT}`);
  });
});
