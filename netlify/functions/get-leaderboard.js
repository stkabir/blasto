"use strict";

const API_URL = process.env.LEADERBOARD_API_URL;

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  if (!API_URL) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "API not configured" }) };
  }

  try {
    const res = await fetch(`${API_URL}/api/scores`);
    const data = await res.json();

    return {
      statusCode: res.status,
      headers,
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error("get-leaderboard error:", err.message);
    return { statusCode: 502, headers, body: JSON.stringify({ error: "Backend unavailable" }) };
  }
};
