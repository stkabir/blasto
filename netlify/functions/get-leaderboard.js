"use strict";

const pool = require("./db");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query(
      "SELECT name, score, created_at FROM scores ORDER BY score DESC LIMIT 20"
    );
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(
        rows.map(({ name, score, created_at }) => ({
          name,
          score,
          created_at,
        }))
      ),
    };
  } catch (err) {
    console.error("get-leaderboard error:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Database error" }),
    };
  } finally {
    if (conn) conn.release();
  }
};
