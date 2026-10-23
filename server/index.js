import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'postgres',
  connectionTimeoutMillis: 5000,
});

app.use(cors());
app.use(express.json());

// Health check for database
app.get('/api/db/health', async (_req, res) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    res.json({
      online: true,
      database: process.env.DB_NAME || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
    });
  } catch (err) {
    res.status(503).json({
      online: false,
      error: err.message,
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
    });
  }
});

// Execute SQL query endpoint (strictly SELECT queries)
app.post('/api/db/query', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "query" parameter' });
  }

  const trimmed = query.trim().toLowerCase();
  if (!trimmed.startsWith('select') && !trimmed.startsWith('with')) {
    return res.status(403).json({ error: 'Only read-only SELECT / WITH queries are allowed' });
  }

  try {
    const result = await pool.query(query);
    res.json({
      success: true,
      rows: result.rows,
      rowCount: result.rowCount,
    });
  } catch (err) {
    console.error('[DB Query Error]:', err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Proxy /api/ollama requests to Ollama service
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
app.use('/api/ollama', async (req, res) => {
  try {
    const targetUrl = `${OLLAMA_HOST}${req.url}`;
    const options = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      options.body = JSON.stringify(req.body);
    }
    const ollamaRes = await fetch(targetUrl, options);
    const data = await ollamaRes.text();
    res.status(ollamaRes.status)
       .header('Content-Type', ollamaRes.headers.get('content-type') || 'application/json')
       .send(data);
  } catch (err) {
    res.status(502).json({ error: `Failed to proxy to Ollama at ${OLLAMA_HOST}: ${err.message}` });
  }
});

// Serve frontend static files
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Stockholm Planner Server running on http://0.0.0.0:${PORT}`);
  console.log(`🔌 DB Target: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}`);
  console.log(`🧠 Ollama Target: ${OLLAMA_HOST}`);
});

