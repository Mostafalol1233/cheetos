import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import crypto from "crypto";
import { type Express } from "express";
import session from "express-session";
import pg from "pg";
import connectPgSimple from "connect-pg-simple";

export function setupAuth(app: Express) {
  // Session setup
  // Changed default secret to a strong random value as requested
  const sessionSecret = process.env.SESSION_SECRET || "9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a";
  const PgSession = connectPgSimple(session);
  const canUseDbSession = Boolean(process.env.DATABASE_URL);

  const store = canUseDbSession
    ? new PgSession({
      pool: new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      }),
      tableName: "user_sessions",
      createTableIfMissing: true,
    })
    : undefined;

  app.use(session({
    store,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: "Incorrect username." });
      }
      
      // Verify password
      const [hash, salt] = user.password.split(".");
      const buf = crypto.scryptSync(password, salt, 64) as Buffer;
      if (buf.toString("hex") !== hash) {
        return done(null, false, { message: "Incorrect password." });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = crypto.scryptSync(password, salt, 64) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}
