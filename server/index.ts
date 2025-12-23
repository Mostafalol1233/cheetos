import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fs from "fs";
import { Buffer } from "node:buffer";
import { createServer } from "http";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const BACKEND_URL = process.env.BACKEND_URL || "";

// Simple rate limiter for /api routes
const rateStore = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 200;
function apiRateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const e = rateStore.get(ip) || { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (now > e.resetAt) {
    e.count = 0;
    e.resetAt = now + RATE_WINDOW_MS;
  }
  e.count += 1;
  rateStore.set(ip as string, e);
  if (e.count > RATE_MAX_REQUESTS) {
    return res.status(429).json({ message: 'Too many requests' });
  }
  next();
}
app.use('/api', apiRateLimiter);

// Add logging for static file requests to debug
app.use('/attached_assets', (req, res, next) => {
  log(`Static file request: ${req.path}`);
  next();
});

// Serve attached assets statically
app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));

// Performance and access logging
const logsDir = path.join(process.cwd(), 'logs');
let accessLogStream: fs.WriteStream | null = null;
try {
  fs.mkdirSync(logsDir, { recursive: true });
  accessLogStream = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });
} catch {}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
      if (accessLogStream) {
        try { accessLogStream.write(`[${new Date().toISOString()}] ${logLine}\n`); } catch {}
      }
    }
  });

  next();
});

(async () => {
  console.log("Starting server...");
  const server = BACKEND_URL ? createServer(app) : await registerRoutes(app);
  console.log("Routes registered");

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 3001 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3001', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
if (BACKEND_URL) {
  app.use('/api', async (req, res) => {
    try {
      const target = `${BACKEND_URL}${req.originalUrl}`;
      let bodyData: Buffer | undefined = undefined;
      await new Promise<void>((resolve) => {
        const chunks: Buffer[] = [];
        req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        req.on('end', () => {
          if (chunks.length > 0) bodyData = Buffer.concat(chunks);
          resolve();
        });
        req.on('error', () => resolve());
      });

      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (typeof v === 'string') headers[k] = v;
      }
      delete headers['host'];

      const r = await fetch(target, {
        method: req.method,
        headers,
        body: bodyData,
        redirect: 'manual'
      } as any);

      const ab = await r.arrayBuffer();
      res.status(r.status);
      r.headers.forEach((v, k) => {
        try { res.setHeader(k, v); } catch {}
      });
      res.end(Buffer.from(ab));
    } catch (err: any) {
      res.status(502).json({ message: err?.message || 'Bad Gateway' });
    }
  });
}
