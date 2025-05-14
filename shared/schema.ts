import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),
  provider: text("provider"),
  providerId: text("providerId"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  votes: integer("votes").default(0).notNull(),
  accessToken: text("access_token").notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  storyId: integer("story_id").notNull().references(() => stories.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
});

export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const userSocialLoginSchema = z.object({
  provider: z.enum(["google", "facebook"]),
  providerId: z.string(),
  email: z.string().email(),
  username: z.string(),
  avatar: z.string().optional(),
});

// Story schemas
export const insertStorySchema = createInsertSchema(stories).omit({ 
  id: true, 
  createdAt: true, 
  authorId: true, 
  votes: true, 
  accessToken: true 
});

export const storyLifetimeSchema = z.enum(["1h", "3h", "6h", "12h", "1d", "3d", "1w", "2w", "1m"]);

// Votes schemas
export const insertVoteSchema = createInsertSchema(votes).omit({ 
  id: true, 
  createdAt: true 
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type UserSocialLogin = z.infer<typeof userSocialLoginSchema>;

export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type StoryLifetime = z.infer<typeof storyLifetimeSchema>;

export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;

// Helper function to calculate expiry date from lifetime string
export function calculateExpiryDate(lifetime: StoryLifetime): Date {
  const now = new Date();
  
  switch (lifetime) {
    case "1h":
      return new Date(now.getTime() + 60 * 60 * 1000);
    case "3h":
      return new Date(now.getTime() + 3 * 60 * 60 * 1000);
    case "6h":
      return new Date(now.getTime() + 6 * 60 * 60 * 1000);
    case "12h":
      return new Date(now.getTime() + 12 * 60 * 60 * 1000);
    case "1d":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "3d":
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    case "1w":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "2w":
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    case "1m":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Default to 1 week
  }
}
