const express = require("express");
const pool = require("./db");

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.get("/api/get-leaderboard", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query(
      "SELECT name, score, created_at FROM scores ORDER BY score DESC LIMIT 20"
    );
    res.json(rows.map(({ name, score, created_at }) => ({ name, score, created_at })));
  } catch (err) {
    console.error("get-leaderboard error:", err.message);
    res.status(500).json({ error: "Database error" });
  } finally {
    if (conn) conn.release();
  }
});

app.post("/api/submit-score", async (req, res) => {
  const { name, score } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 12) {
    return res.status(400).json({ error: "Invalid name (1-12 characters)" });
  }

  if (!Number.isInteger(score) || score < 0) {
    return res.status(400).json({ error: "Invalid score" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.execute("INSERT INTO scores (name, score) VALUES (?, ?)", [
      name.trim(),
      score,
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error("submit-score error:", err.message);
    res.status(500).json({ error: "Database error" });
  } finally {
    if (conn) conn.release();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});