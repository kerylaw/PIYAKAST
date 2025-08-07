import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"), // for email login
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  provider: varchar("provider").default("email"), // email, google, kakao, naver
  providerId: varchar("provider_id"), // OAuth provider ID
  isEmailVerified: boolean("is_email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Videos table for VOD content
export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: varchar("thumbnail_url"),
  videoUrl: varchar("video_url"),
  duration: integer("duration"), // in seconds
  viewCount: integer("view_count").default(0),
  category: varchar("category"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Live streams table
export const streams = pgTable("streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category"),
  isLive: boolean("is_live").default(false),
  viewerCount: integer("viewer_count").default(0),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments table for videos (YouTube-style threading)  
export const comments: any = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").references(() => videos.id), // null for stream comments
  streamId: varchar("stream_id").references(() => streams.id), // null for video comments
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  parentId: varchar("parent_id").references((): any => comments.id), // for reply threading
  likeCount: integer("like_count").default(0),
  dislikeCount: integer("dislike_count").default(0),
  isHearted: boolean("is_hearted").default(false), // creator heart
  isPinned: boolean("is_pinned").default(false),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages for live streams
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").notNull().references(() => streams.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  type: varchar("type").default("normal"), // normal, superchat, moderator
  amount: integer("amount"), // for superchat donations
  currency: varchar("currency").default("KRW"), // for superchat
  color: varchar("color"), // superchat background color
  isModeratorMessage: boolean("is_moderator_message").default(false),
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Likes/dislikes for videos
export const videoLikes = pgTable("video_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  isLike: boolean("is_like").notNull(), // true for like, false for dislike
  createdAt: timestamp("created_at").defaultNow(),
});

// Follows between users
export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => users.id),
  followingId: varchar("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comment likes/dislikes
export const commentLikes = pgTable("comment_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").notNull().references(() => comments.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  isLike: boolean("is_like").notNull(), // true for like, false for dislike
  createdAt: timestamp("created_at").defaultNow(),
});

// Superchat donations
export const superchats = pgTable("superchats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").notNull().references(() => streams.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  amount: integer("amount").notNull(),
  currency: varchar("currency").default("KRW"),
  color: varchar("color").notNull(),
  displayDuration: integer("display_duration").default(120), // seconds
  isProcessed: boolean("is_processed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User subscriptions/memberships
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  channelId: varchar("channel_id").notNull().references(() => users.id),
  tier: varchar("tier").default("basic"), // basic, premium
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  videos: many(videos),
  streams: many(streams),
  comments: many(comments),
  chatMessages: many(chatMessages),
  videoLikes: many(videoLikes),
  commentLikes: many(commentLikes),
  superchats: many(superchats),
  subscriptions: many(subscriptions, { relationName: "subscriber" }),
  subscribers: many(subscriptions, { relationName: "channel" }),
  followers: many(follows, { relationName: "following" }),
  following: many(follows, { relationName: "follower" }),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  user: one(users, { fields: [videos.userId], references: [users.id] }),
  comments: many(comments),
  likes: many(videoLikes),
}));

export const streamsRelations = relations(streams, ({ one, many }) => ({
  user: one(users, { fields: [streams.userId], references: [users.id] }),
  chatMessages: many(chatMessages),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  video: one(videos, { fields: [comments.videoId], references: [videos.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  stream: one(streams, { fields: [chatMessages.streamId], references: [streams.id] }),
  user: one(users, { fields: [chatMessages.userId], references: [users.id] }),
}));

export const videoLikesRelations = relations(videoLikes, ({ one }) => ({
  video: one(videos, { fields: [videoLikes.videoId], references: [videos.id] }),
  user: one(users, { fields: [videoLikes.userId], references: [users.id] }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, { fields: [follows.followerId], references: [users.id], relationName: "follower" }),
  following: one(users, { fields: [follows.followingId], references: [users.id], relationName: "following" }),
}));

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  comment: one(comments, { fields: [commentLikes.commentId], references: [comments.id] }),
  user: one(users, { fields: [commentLikes.userId], references: [users.id] }),
}));

export const superchatsRelations = relations(superchats, ({ one }) => ({
  stream: one(streams, { fields: [superchats.streamId], references: [streams.id] }),
  user: one(users, { fields: [superchats.userId], references: [users.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id], relationName: "subscriber" }),
  channel: one(users, { fields: [subscriptions.channelId], references: [users.id], relationName: "channel" }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
});

export const insertStreamSchema = createInsertSchema(streams).omit({
  id: true,
  createdAt: true,
  viewerCount: true,
  isLive: true,
  startedAt: true,
  endedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertVideoLikeSchema = createInsertSchema(videoLikes).omit({
  id: true,
  createdAt: true,
});

export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});

export const insertCommentLikeSchema = createInsertSchema(commentLikes).omit({
  id: true,
  createdAt: true,
});

export const insertSuperchatSchema = createInsertSchema(superchats).omit({
  id: true,
  createdAt: true,
  isProcessed: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

// Login schemas
export const loginSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
});

export const registerSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
  firstName: z.string().min(1, "이름을 입력해주세요"),
  lastName: z.string().min(1, "성을 입력해주세요"),
  username: z.string().min(3, "사용자명은 3자 이상이어야 합니다").max(30, "사용자명은 30자 이하여야 합니다"),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertStream = z.infer<typeof insertStreamSchema>;
export type Stream = typeof streams.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertVideoLike = z.infer<typeof insertVideoLikeSchema>;
export type VideoLike = typeof videoLikes.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Follow = typeof follows.$inferSelect;
export type InsertCommentLike = z.infer<typeof insertCommentLikeSchema>;
export type CommentLike = typeof commentLikes.$inferSelect;
export type InsertSuperchat = z.infer<typeof insertSuperchatSchema>;
export type Superchat = typeof superchats.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
