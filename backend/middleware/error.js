import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultDir = path.join(process.cwd(), 'logs');
const configuredDir = process.env.LOG_DIR && String(process.env.LOG_DIR).trim();
const logsDir = configuredDir || defaultDir;

let errorLogStream = null;
try {
  fs.mkdirSync(logsDir, { recursive: true });
  errorLogStream = fs.createWriteStream(path.join(logsDir, 'error.log'), { flags: 'a' });
} catch (e) {
  errorLogStream = null;
}

const errorHandler = (err, req, res, next) => {
  const { method, url, ip } = req;
  const timestamp = new Date().toISOString();
  
  const errorMessage = `[${timestamp}] ERROR: ${method} ${url} - ${ip}\n${err.stack || err.message}\n-----------------------------------\n`;
  
  // Log to console
  console.error(errorMessage);
  
  if (errorLogStream) {
    try { errorLogStream.write(errorMessage); } catch {}
  }

  const statusCode = err.statusCode || 500;
  const message = err.isPublic ? err.message : 'Internal Server Error';

  res.status(statusCode).json({
    status: 'error',
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;
