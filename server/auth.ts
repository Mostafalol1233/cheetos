import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import crypto from "crypto";
import { type Express } from "express";
import session from "express-session";

export function setupAuth(app: Express) {
  // Session setup
  app.use(session({
    secret: process.env.SESSION_SECRET || "super_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === "production"
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
