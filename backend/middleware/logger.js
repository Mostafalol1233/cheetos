import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultDir = path.join(process.cwd(), 'logs');
const configuredDir = process.env.LOG_DIR && String(process.env.LOG_DIR).trim();
const logsDir = configuredDir || defaultDir;

let accessLogStream = null;
try {
  fs.mkdirSync(logsDir, { recursive: true });
  accessLogStream = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });
} catch (e) {
  accessLogStream = null;
}

const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('user-agent') || '-';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    // Only log API requests, skip static files
    if (url.startsWith('/api/')) {
      const statusColor = statusCode >= 500 ? '\x1b[31m' : statusCode >= 400 ? '\x1b[33m' : statusCode >= 300 ? '\x1b[36m' : '\x1b[32m';
      const resetColor = '\x1b[0m';
      const statusText = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : statusCode >= 300 ? 'REDIR' : 'OK';
      console.log(`${statusColor}${method} ${url} ${statusCode} ${statusText}${resetColor} ${duration}ms`);
    }
    
    const logMessage = `[${new Date().toISOString()}] ${method} ${url} ${statusCode} ${duration}ms - ${ip} - ${userAgent}\n`;
    if (accessLogStream) {
      try { accessLogStream.write(logMessage); } catch {}
    }
  });

  next();
};

export default requestLogger;
