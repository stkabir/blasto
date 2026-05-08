"use strict";

const API_URL = process.env.LEADERBOARD_API_URL;

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
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  if (!API_URL) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "API not configured" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { name, score } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 12) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid name" }) };
  }

  if (!Number.isInteger(score) || score < 0) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid score" }) };
  }

  try {
    const res = await fetch(`${API_URL}/api/scores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), score }),
    });

    const data = await res.json();

    return {
      statusCode: res.status,
      headers,
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error("submit-score error:", err.message);
    return { statusCode: 502, headers, body: JSON.stringify({ error: "Backend unavailable" }) };
  }
};
