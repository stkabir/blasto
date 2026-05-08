"use strict";

const pool = require("./db");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  const { name, score } = body;

  if (
    !name ||
    typeof name !== "string" ||
    name.trim().length === 0 ||
    name.length > 12
  ) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid name (1-12 characters)" }),
    };
  }

  if (!Number.isInteger(score) || score < 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid score" }),
    };
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.execute("INSERT INTO scores (name, score) VALUES (?, ?)", [
      name.trim(),
      score,
    ]);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error("submit-score error:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Database error" }),
    };
  } finally {
    if (conn) conn.release();
  }
};
