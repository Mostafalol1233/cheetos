import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

// Serve web manifest explicitly with correct MIME
app.get('/manifest.webmanifest', (req, res) => {
  const candidates = [
    path.join(process.cwd(), 'client', 'manifest.webmanifest'),
    path.join(process.cwd(), 'public', 'manifest.webmanifest'),
    path.join(process.cwd(), 'dist', 'public', 'manifest.webmanifest'),
  ];
  const file = candidates.find(p => {
    try { return fs.existsSync(p); } catch { return false; }
  });
  if (!file) {
    return res.status(404).json({ message: 'manifest not found' });
  }
  res.type('application/manifest+json');
  res.sendFile(file);
});

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
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  console.log("Starting server...");
  const server = await registerRoutes(app);
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
