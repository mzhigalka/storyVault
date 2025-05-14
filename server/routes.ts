import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { z } from "zod";

// Define schema for MongoDB
const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const userSocialLoginSchema = z.object({
  provider: z.enum(["google", "facebook"]),
  providerId: z.string(),
  email: z.string().email(),
  username: z.string(),
  avatar: z.string().optional(),
});

const insertUserSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string().optional().nullable(),
  provider: z.string().optional().nullable(),
  providerId: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
});

const insertStorySchema = z.object({
  title: z.string().min(3).max(100),
  content: z.string().min(20).max(5000),
});

const storyLifetimeSchema = z.enum([
  "1h",
  "3h",
  "6h",
  "12h",
  "1d",
  "3d",
  "1w",
  "2w",
  "1m",
]);
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import memorystore from "memorystore";

// Time to live for session in milliseconds
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware with MongoDB session store
  const MemoryStore = memorystore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "storyvault_secret_key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_TTL,
      },
      store: new MemoryStore({
        checkPeriod: SESSION_TTL,
      }),
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport serialization
  passport.serializeUser((user: any, done) => {
    done(null, user._id ? user._id.toString() : user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // Local strategy for email/password login
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, {
              message: "Incorrect email or password",
            });
          }

          if (!user.password) {
            return done(null, false, {
              message: "This account uses social login",
            });
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, {
              message: "Incorrect email or password",
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Google OAuth strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user exists
            let user = await storage.getUserByProvider("google", profile.id);

            if (!user) {
              // Create new user if doesn't exist
              const email =
                profile.emails && profile.emails[0]
                  ? profile.emails[0].value
                  : "";
              const avatar =
                profile.photos && profile.photos[0]
                  ? profile.photos[0].value
                  : "";

              if (!email) {
                return done(new Error("Email is required"));
              }

              // Check if email already exists with different provider
              const existingUser = await storage.getUserByEmail(email);
              if (existingUser) {
                return done(null, existingUser);
              }

              user = await storage.createUser({
                username: profile.displayName || email.split("@")[0],
                email,
                provider: "google",
                providerId: profile.id,
                avatar,
                password: null,
              });
            }

            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
  }

  // Facebook OAuth strategy
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: "/api/auth/facebook/callback",
          profileFields: ["id", "displayName", "photos", "email"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user exists
            let user = await storage.getUserByProvider("facebook", profile.id);

            if (!user) {
              // Create new user if doesn't exist
              const email =
                profile.emails && profile.emails[0]
                  ? profile.emails[0].value
                  : "";
              const avatar =
                profile.photos && profile.photos[0]
                  ? profile.photos[0].value
                  : "";

              if (!email) {
                return done(new Error("Email is required"));
              }

              // Check if email already exists with different provider
              const existingUser = await storage.getUserByEmail(email);
              if (existingUser) {
                return done(null, existingUser);
              }

              user = await storage.createUser({
                username: profile.displayName || email.split("@")[0],
                email,
                provider: "facebook",
                providerId: profile.id,
                avatar,
                password: null,
              });
            }

            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
  }

  // Authentication middleware
  function isAuthenticated(req: Request, res: Response, next: Function) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  }

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password || "", 10);

      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Log user in
      req.login(user, (err) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Error logging in after registration" });
        }

        // Return sanitized user data (without password)
        const { password, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }

      return res
        .status(500)
        .json({ message: "Server error during registration" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    try {
      userLoginSchema.parse(req.body);

      passport.authenticate("local", (err: Error, user: any, info: any) => {
        if (err) {
          return res.status(500).json({ message: "Authentication error" });
        }

        if (!user) {
          return res.status(401).json({ message: info.message });
        }

        req.login(user, (loginErr) => {
          if (loginErr) {
            return res.status(500).json({ message: "Error logging in" });
          }

          // Return sanitized user data (without password)
          const { password, ...userWithoutPassword } = user;
          return res.json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }

      return res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.get(
    "/api/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/?authError=true",
    }),
    (req, res) => {
      res.redirect("/");
    }
  );

  app.get(
    "/api/auth/facebook",
    passport.authenticate("facebook", {
      scope: ["email"],
    })
  );

  app.get(
    "/api/auth/facebook/callback",
    passport.authenticate("facebook", {
      failureRedirect: "/?authError=true",
    }),
    (req, res) => {
      res.redirect("/");
    }
  );

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error during logout" });
      }
      res.json({ message: "Successfully logged out" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    // Sanitize user data (without password)
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Story routes
  app.post("/api/stories", isAuthenticated, async (req, res) => {
    try {
      const storyData = insertStorySchema.parse(req.body.story);
      const lifetime = storyLifetimeSchema.parse(req.body.lifetime);

      const user = req.user as any;
      const story = await storage.createStory(storyData, user.id, lifetime);

      res.status(201).json(story);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }

      return res.status(500).json({ message: "Error creating story" });
    }
  });

  app.get("/api/stories", async (req, res) => {
    try {
      const sort = (req.query.sort as "latest" | "popular") || "latest";
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await storage.getPublicStories(sort, page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Error fetching stories" });
    }
  });

  app.get("/api/stories/author", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const stories = await storage.getStoriesByAuthor(user.id);
      res.json(stories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching author stories" });
    }
  });

  app.get("/api/stories/random", async (req, res) => {
    try {
      const story = await storage.getRandomStory();
      if (!story) {
        return res.status(404).json({ message: "No stories found" });
      }
      res.json(story);
    } catch (error) {
      res.status(500).json({ message: "Error fetching random story" });
    }
  });

  app.get("/api/stories/expiring/:timeframe", async (req, res) => {
    try {
      const timeframe = req.params.timeframe;
      if (!["hour", "day", "week"].includes(timeframe)) {
        return res.status(400).json({ message: "Invalid timeframe" });
      }

      const story = await storage.getRandomExpiringStory(timeframe);
      if (!story) {
        return res
          .status(404)
          .json({ message: `No stories expiring within ${timeframe} found` });
      }
      res.json(story);
    } catch (error) {
      res.status(500).json({ message: "Error fetching expiring story" });
    }
  });

  app.get("/api/stories/:id", async (req, res) => {
    try {
      const storyId = req.params.id;
      const story = await storage.getStory(storyId);

      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }

      // Check if story has expired and is public
      const now = new Date();
      if (story.expiresAt < now && story.isPublic) {
        return res.status(410).json({ message: "Story has expired" });
      }

      res.json(story);
    } catch (error) {
      res.status(500).json({ message: "Error fetching story" });
    }
  });

  app.get("/api/stories/access/:token", async (req, res) => {
    try {
      const accessToken = req.params.token;
      const story = await storage.getStoryByAccessToken(accessToken);

      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }

      res.json(story);
    } catch (error) {
      res.status(500).json({ message: "Error fetching story by access token" });
    }
  });

  app.post("/api/stories/:id/vote", isAuthenticated, async (req, res) => {
    try {
      const storyId = req.params.id;
      const user = req.user as any;
      const userId = user._id ? user._id.toString() : user.id;

      // Check if story exists
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }

      // Check if story has expired
      const now = new Date();
      if (story.expiresAt < now) {
        return res
          .status(410)
          .json({ message: "Cannot vote for an expired story" });
      }

      // Check if user has already voted
      const hasVoted = await storage.hasVoted(storyId, userId);
      if (hasVoted) {
        return res
          .status(400)
          .json({ message: "You have already voted for this story" });
      }

      await storage.voteStory(storyId, userId);

      // Get updated story
      const updatedStory = await storage.getStory(storyId);
      res.json(updatedStory);
    } catch (error) {
      res.status(500).json({ message: "Error voting for story" });
    }
  });

  // Stats routes
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching stats" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
