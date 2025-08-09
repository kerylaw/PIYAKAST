import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// @ts-ignore - Missing types for passport-kakao
import { Strategy as KakaoStrategy } from "passport-kakao";
import { Strategy as NaverStrategy } from "passport-naver-v2";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { getPeerTubeClient } from "./peertube";
import { User as SelectUser, registerSchema, loginSchema } from "@shared/schema";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

function sanitizePeerTubeUsername(username: string): string {
  const sanitized = username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
  if (sanitized.length === 0) {
    return `user${Date.now()}`;
  }
  return sanitized;
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  if (!stored || !stored.includes('.')) return false;
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({ 
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false 
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy (Email + Password)
  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !user.password) {
            return done(null, false, { message: 'Invalid credentials' });
          }
          
          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            return done(null, false, { message: 'Invalid credentials' });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
        },
        async (accessToken: any, refreshToken: any, profile: any, done: any) => {
          try {
            let user = await storage.getUserByProviderId('google', profile.id);
            
            if (!user) {
              // Create new user
              const userData = {
                email: profile.emails?.[0]?.value || '',
                firstName: profile.name?.givenName || '',
                lastName: profile.name?.familyName || '',
                profileImageUrl: profile.photos?.[0]?.value || null,
                username: profile.emails?.[0]?.value?.split('@')[0] || `user_${Date.now()}`,
                provider: 'google' as const,
                providerId: profile.id,
                isEmailVerified: true,
              };
              user = await storage.createUser(userData);

              // Create user in PeerTube
              try {
                const peerTubeUsername = sanitizePeerTubeUsername(user.username);
                const channelDisplayName = user.firstName ? `${user.firstName}'s Channel` : `${user.username}'s Channel`;
                await getPeerTubeClient().createUser({
                  username: peerTubeUsername,
                  email: user.email,
                  displayName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username,
                  channelName: peerTubeUsername,
                  channelDisplayName: channelDisplayName,
                });
              } catch (peertubeError) {
                // Log the error but don't block the main registration process
                console.error("Failed to create PeerTube user during registration:", peertubeError);
              }
            }
            
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  // Kakao OAuth Strategy
  if (process.env.KAKAO_CLIENT_ID) {
    passport.use(
      new KakaoStrategy(
        {
          clientID: process.env.KAKAO_CLIENT_ID,
          callbackURL: "/api/auth/kakao/callback",
        },
        async (accessToken: any, refreshToken: any, profile: any, done: any) => {
          try {
            let user = await storage.getUserByProviderId('kakao', profile.id);
            
            if (!user) {
              const userData = {
                email: profile._json.kakao_account?.email || '',
                firstName: profile._json.kakao_account?.profile?.nickname || '',
                lastName: '',
                profileImageUrl: profile._json.kakao_account?.profile?.profile_image_url || null,
                username: profile._json.kakao_account?.email?.split('@')[0] || `kakao_${Date.now()}`,
                provider: 'kakao' as const,
                providerId: profile.id,
                isEmailVerified: profile._json.kakao_account?.is_email_verified || false,
              };
              user = await storage.createUser(userData);

              // Create user in PeerTube
              try {
                const peerTubeUsername = sanitizePeerTubeUsername(user.username);
                const channelDisplayName = user.firstName ? `${user.firstName}'s Channel` : `${user.username}'s Channel`;
                await getPeerTubeClient().createUser({
                  username: peerTubeUsername,
                  email: user.email,
                  displayName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username,
                  channelName: peerTubeUsername,
                  channelDisplayName: channelDisplayName,
                });
              } catch (peertubeError) {
                // Log the error but don't block the main registration process
                console.error("Failed to create PeerTube user during registration:", peertubeError);
              }
            }
            
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  // Naver OAuth Strategy
  if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
    passport.use(
      new NaverStrategy(
        {
          clientID: process.env.NAVER_CLIENT_ID,
          clientSecret: process.env.NAVER_CLIENT_SECRET,
          callbackURL: "/api/auth/naver/callback",
        },
        async (accessToken: any, refreshToken: any, profile: any, done: any) => {
          try {
            let user = await storage.getUserByProviderId('naver', profile.id);
            
            if (!user) {
              const userData = {
                email: profile._json.email || '',
                firstName: profile._json.nickname || '',
                lastName: '',
                profileImageUrl: profile._json.profile_image || null,
                username: profile._json.email?.split('@')[0] || `naver_${Date.now()}`,
                provider: 'naver' as const,
                providerId: profile.id,
                isEmailVerified: true,
              };
              user = await storage.createUser(userData);

              // Create user in PeerTube
              try {
                const peerTubeUsername = sanitizePeerTubeUsername(user.username);
                const channelDisplayName = user.firstName ? `${user.firstName}'s Channel` : `${user.username}'s Channel`;
                await getPeerTubeClient().createUser({
                  username: peerTubeUsername,
                  email: user.email,
                  displayName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username,
                  channelName: peerTubeUsername,
                  channelDisplayName: channelDisplayName,
                });
              } catch (peertubeError) {
                // Log the error but don't block the main registration process
                console.error("Failed to create PeerTube user during registration:", peertubeError);
              }
            }
            
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create user in PIYAKast
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        username: userData.username,
        provider: 'email',
      });

      // Create user in PeerTube
      try {
        const peerTubeUsername = sanitizePeerTubeUsername(user.username);
        const channelDisplayName = user.firstName ? `${user.firstName}'s Channel` : `${user.username}'s Channel`;
        await getPeerTubeClient().createUser({
          username: peerTubeUsername,
          password: userData.password, // Send plain password to PeerTube
          email: user.email,
          displayName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username,
          channelName: peerTubeUsername,
          channelDisplayName: channelDisplayName,
        });
      } catch (peertubeError) {
        // Log the error but don't block the main registration process
        console.error("Failed to create PeerTube user during registration:", peertubeError);
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          profileImageUrl: user.profileImageUrl,
          role: user.role,
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed", error: error.message });
    }
  });

  // Login endpoint
  app.post("/api/login", async (req, res, next) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      passport.authenticate("local", (err: any, user: SelectUser | false) => {
        if (err) return next(err);
        if (!user) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        req.login(user, (err) => {
          if (err) return next(err);
          res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            profileImageUrl: user.profileImageUrl,
            role: user.role,
          });
        });
      })(req, res, next);
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // OAuth routes
  app.get("/api/auth/google", 
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth?error=google" }),
    (req, res) => {
      res.redirect("/");
    }
  );

  app.get("/api/auth/kakao",
    passport.authenticate("kakao")
  );

  app.get("/api/auth/kakao/callback",
    passport.authenticate("kakao", { failureRedirect: "/auth?error=kakao" }),
    (req, res) => {
      res.redirect("/");
    }
  );

  app.get("/api/auth/naver",
    passport.authenticate("naver")
  );

  app.get("/api/auth/naver/callback",
    passport.authenticate("naver", { failureRedirect: "/auth?error=naver" }),
    (req, res) => {
      res.redirect("/");
    }
  );

  // Logout endpoint (support both GET and POST)
  const handleLogout = (req: any, res: any, next: any) => {
    req.logout((err: any) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  };
  
  app.post("/api/logout", handleLogout);
  app.get("/api/logout", handleLogout);

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    res.json({
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      username: req.user.username,
      profileImageUrl: req.user.profileImageUrl,
      role: req.user.role,
    });
  });
}

// Auth middleware
export const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};