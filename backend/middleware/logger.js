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
    const logMessage = `[${new Date().toISOString()}] ${method} ${url} ${statusCode} ${duration}ms - ${ip} - ${userAgent}\n`;
    
    console.log(logMessage.trim());
    
    if (accessLogStream) {
      try { accessLogStream.write(logMessage); } catch {}
    }
  });

  next();
};

export default requestLogger;
