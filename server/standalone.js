import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { handleDoubtApi } from './doubtApi.ts';
import { handleSyllabusApi } from './syllabusApi.ts';

// Simple .env parser for standalone execution
function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  const envVars = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        envVars[key] = val;
      }
    }
  }
  return { ...envVars, ...process.env };
}

const env = loadEnvFile();
const PORT = process.env.PORT || 3001;

const server = http.createServer(async (req, res) => {
  if (req.url && req.url.startsWith('/api/doubt/')) {
    const handled = await handleDoubtApi(req, res, env);
    if (handled) return;
  }

  if (req.url && req.url.startsWith('/api/syllabus')) {
    const handled = await handleSyllabusApi(req, res, env);
    if (handled) return;
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'NOT_FOUND', message: 'API route not found' }));
});

server.listen(PORT, () => {
  console.log(`[ConceptTrace AI Backend Server] running on http://localhost:${PORT}`);
  console.log(`[AI Key Configured]: ${Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 10)}`);
});
