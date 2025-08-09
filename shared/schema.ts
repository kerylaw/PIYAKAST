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
  unique,
  check,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "session",
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
  role: varchar("role").default("user"), // user, admin, creator
  provider: varchar("provider").default("email"), // email, google, kakao, naver
  providerId: varchar("provider_id"), // OAuth provider ID
  isEmailVerified: boolean("is_email_verified").default(false),
  // Ban/suspend management
  isBanned: boolean("is_banned").default(false),
  bannedUntil: timestamp("banned_until"),
  banReason: text("ban_reason"),
  isSuspended: boolean("is_suspended").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  check("CHK_users_role", sql`${table.role} IN ('user', 'admin', 'creator')`),
  check("CHK_users_provider", sql`${table.provider} IN ('email', 'google', 'kakao', 'naver')`),
]);

// Videos table for VOD content
export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: varchar("thumbnail_url"),
  videoUrl: varchar("video_url"),
  // PeerTube integration fields
  peertubeId: integer("peertube_id"),
  peertubeUuid: varchar("peertube_uuid"),
  peertubeEmbedUrl: varchar("peertube_embed_url"),
  peertubeDownloadUrl: varchar("peertube_download_url"),
  peertubeChannelId: integer("peertube_channel_id"),
  // Original fields
  duration: integer("duration"), // in seconds
  viewCount: integer("view_count").default(0),
  category: varchar("category"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_videos_user_id").on(table.userId),
  index("IDX_videos_category").on(table.category),
  index("IDX_videos_view_count").on(table.viewCount),
  index("IDX_videos_created_at").on(table.createdAt),
  index("IDX_videos_is_public_created_at").on(table.isPublic, table.createdAt),
  check("CHK_videos_view_count", sql`${table.viewCount} >= 0`),
  check("CHK_videos_duration", sql`${table.duration} >= 0`),
]);

// Live streams table
export const streams = pgTable("streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category"),
  // PeerTube live streaming fields
  peertubeId: integer("peertube_id"),
  peertubeUuid: varchar("peertube_uuid"),
  peertubeEmbedUrl: varchar("peertube_embed_url"),
  rtmpUrl: varchar("rtmp_url"),
  streamKey: varchar("stream_key"),
  peertubeChannelId: integer("peertube_channel_id"),
  permanentLive: boolean("permanent_live").default(false),
  saveReplay: boolean("save_replay").default(true),
  // Original fields
  isLive: boolean("is_live").default(false),
  isPublic: boolean("is_public").default(false), // 방송 시작 전까지는 다른 사용자에게 보이지 않음
  viewerCount: integer("viewer_count").default(0),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_streams_user_id").on(table.userId),
  index("IDX_streams_is_live").on(table.isLive),
  index("IDX_streams_category").on(table.category),
  index("IDX_streams_viewer_count").on(table.viewerCount),
  index("IDX_streams_is_live_is_public").on(table.isLive, table.isPublic),
]);

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
}, (table) => [
  index("IDX_comments_video_id").on(table.videoId),
  index("IDX_comments_stream_id").on(table.streamId),
  index("IDX_comments_user_id").on(table.userId),
  index("IDX_comments_parent_id").on(table.parentId),
  index("IDX_comments_created_at").on(table.createdAt),
]);

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
}, (table) => [
  index("IDX_chat_messages_stream_id").on(table.streamId),
  index("IDX_chat_messages_user_id").on(table.userId),
  index("IDX_chat_messages_created_at").on(table.createdAt),
  index("IDX_chat_messages_stream_created").on(table.streamId, table.createdAt),
]);

// Likes/dislikes for videos
export const videoLikes = pgTable("video_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  isLike: boolean("is_like").notNull(), // true for like, false for dislike
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_video_likes_video_id").on(table.videoId),
  index("IDX_video_likes_user_id").on(table.userId),
  index("IDX_video_likes_video_user").on(table.videoId, table.userId),
  unique("UQ_video_likes_video_user").on(table.videoId, table.userId),
]);

// Follows between users
export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => users.id),
  followingId: varchar("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_follows_follower_id").on(table.followerId),
  index("IDX_follows_following_id").on(table.followingId),
  index("IDX_follows_follower_following").on(table.followerId, table.followingId),
  unique("UQ_follows_follower_following").on(table.followerId, table.followingId),
  check("CHK_follows_no_self_follow", sql`${table.followerId} != ${table.followingId}`),
]);

// Comment likes/dislikes
export const commentLikes = pgTable("comment_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").notNull().references(() => comments.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  isLike: boolean("is_like").notNull(), // true for like, false for dislike
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_comment_likes_comment_id").on(table.commentId),
  index("IDX_comment_likes_user_id").on(table.userId),
  index("IDX_comment_likes_comment_user").on(table.commentId, table.userId),
  unique("UQ_comment_likes_comment_user").on(table.commentId, table.userId),
]);

// Payment transactions for SuperChat
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  streamId: varchar("stream_id").notNull().references(() => streams.id),
  stripePaymentIntentId: varchar("stripe_payment_intent_id").unique(),
  amount: integer("amount").notNull(), // in won (KRW)
  currency: varchar("currency").default("KRW"),
  status: varchar("status").default("pending"), // pending, completed, failed, refunded
  creatorAmount: integer("creator_amount"), // 70% of amount
  platformAmount: integer("platform_amount"), // 30% of amount
  message: text("message"), // SuperChat message
  isSuperchat: boolean("is_superchat").default(true),
  metadata: jsonb("metadata"), // additional payment data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_payments_user_id").on(table.userId),
  index("IDX_payments_stream_id").on(table.streamId),
  index("IDX_payments_status").on(table.status),
  index("IDX_payments_created_at").on(table.createdAt),
]);

// Superchat donations (enhanced with payment tracking)
export const superchats = pgTable("superchats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").notNull().references(() => streams.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  paymentId: varchar("payment_id").references(() => payments.id),
  message: text("message").notNull(),
  amount: integer("amount").notNull(),
  currency: varchar("currency").default("KRW"),
  color: varchar("color").notNull(),
  displayDuration: integer("display_duration").default(120), // seconds
  isPinned: boolean("is_pinned").default(false),
  pinnedUntil: timestamp("pinned_until"), // when the pin expires
  isProcessed: boolean("is_processed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_superchats_stream_id").on(table.streamId),
  index("IDX_superchats_user_id").on(table.userId),
  index("IDX_superchats_amount").on(table.amount),
  index("IDX_superchats_created_at").on(table.createdAt),
  index("IDX_superchats_stream_created").on(table.streamId, table.createdAt),
]);

// Video thumbnails table for thumbnail selection
export const videoThumbnails = pgTable("video_thumbnails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  thumbnailUrl: varchar("thumbnail_url").notNull(),
  timecode: integer("timecode").notNull(), // seconds into video
  isSelected: boolean("is_selected").default(false),
  isGenerated: boolean("is_generated").default(true), // auto-generated vs uploaded
  createdAt: timestamp("created_at").defaultNow(),
});

// Creator monetization settings
export const creatorSettings = pgTable("creator_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  isMonetizationEnabled: boolean("is_monetization_enabled").default(false),
  isSuperchatEnabled: boolean("is_superchat_enabled").default(false),
  isLiveStreamingEnabled: boolean("is_live_streaming_enabled").default(false),
  isEligible: boolean("is_eligible").default(false), // 18+, approved country
  stripeAccountId: varchar("stripe_account_id"), // for payouts
  country: varchar("country").default("KR"),
  dateOfBirth: timestamp("date_of_birth"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Membership tiers for creators (YouTube-style channel memberships)
export const membershipTiers = pgTable("membership_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull().references(() => users.id),
  name: varchar("name").notNull(), // e.g., "Bronze", "Silver", "Gold"
  description: text("description"),
  monthlyPrice: integer("monthly_price").notNull(), // in won (KRW)
  yearlyPrice: integer("yearly_price"), // optional yearly discount
  color: varchar("color").default("#6366f1"), // hex color for the tier
  emoji: varchar("emoji"), // optional emoji for the tier
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_membership_tiers_channel_id").on(table.channelId),
  index("IDX_membership_tiers_price").on(table.monthlyPrice),
  index("IDX_membership_tiers_active").on(table.isActive),
  check("CHK_membership_tiers_price", sql`${table.monthlyPrice} >= 1000`), // minimum 1,000 KRW
]);

// Membership benefits for each tier
export const membershipBenefits = pgTable("membership_benefits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tierId: varchar("tier_id").notNull().references(() => membershipTiers.id),
  type: varchar("type").notNull(), // "emoji", "badge", "early_access", "exclusive_content", "chat_color", "live_chat_priority"
  title: varchar("title").notNull(),
  description: text("description"),
  value: text("value"), // JSON or text value for the benefit
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_membership_benefits_tier_id").on(table.tierId),
  index("IDX_membership_benefits_type").on(table.type),
  check("CHK_membership_benefits_type", 
    sql`${table.type} IN ('emoji', 'badge', 'early_access', 'exclusive_content', 'chat_color', 'live_chat_priority', 'custom')`),
]);

// User subscriptions/memberships (enhanced)
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  channelId: varchar("channel_id").notNull().references(() => users.id),
  tierId: varchar("tier_id").references(() => membershipTiers.id), // null for free follow
  type: varchar("type").default("follow"), // "follow", "member"
  billingPeriod: varchar("billing_period").default("monthly"), // "monthly", "yearly"
  isActive: boolean("is_active").default(true),
  // Payment integration
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  stripeCustomerId: varchar("stripe_customer_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  // Metadata
  totalPaid: integer("total_paid").default(0), // total amount paid
  giftedBy: varchar("gifted_by").references(() => users.id), // for gift memberships
  giftMessage: text("gift_message"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_subscriptions_user_id").on(table.userId),
  index("IDX_subscriptions_channel_id").on(table.channelId),
  index("IDX_subscriptions_tier_id").on(table.tierId),
  index("IDX_subscriptions_type").on(table.type),
  index("IDX_subscriptions_active").on(table.isActive),
  index("IDX_subscriptions_user_channel").on(table.userId, table.channelId),
  index("IDX_subscriptions_stripe_id").on(table.stripeSubscriptionId),
  unique("UQ_subscriptions_user_channel").on(table.userId, table.channelId),
  check("CHK_subscriptions_type", sql`${table.type} IN ('follow', 'member')`),
  check("CHK_subscriptions_billing", sql`${table.billingPeriod} IN ('monthly', 'yearly')`),
]);

// Subscription notification settings
export const subscriptionSettings = pgTable("subscription_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: varchar("subscription_id").notNull().references(() => subscriptions.id),
  newVideoNotifications: boolean("new_video_notifications").default(true),
  liveStreamNotifications: boolean("live_stream_notifications").default(true),
  communityPostNotifications: boolean("community_post_notifications").default(false),
  memberPostNotifications: boolean("member_post_notifications").default(true), // member-only posts
  emailNotifications: boolean("email_notifications").default(false),
  pushNotifications: boolean("push_notifications").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_subscription_settings_subscription_id").on(table.subscriptionId),
]);

// Membership exclusive content
export const memberContent = pgTable("member_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull().references(() => users.id),
  tierId: varchar("tier_id").references(() => membershipTiers.id), // null = all members
  type: varchar("type").notNull(), // "post", "video", "stream", "emoji", "badge"
  title: varchar("title").notNull(),
  content: text("content"),
  imageUrl: varchar("image_url"),
  videoId: varchar("video_id").references(() => videos.id),
  streamId: varchar("stream_id").references(() => streams.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_member_content_channel_id").on(table.channelId),
  index("IDX_member_content_tier_id").on(table.tierId),
  index("IDX_member_content_type").on(table.type),
  index("IDX_member_content_created_at").on(table.createdAt),
  check("CHK_member_content_type", 
    sql`${table.type} IN ('post', 'video', 'stream', 'emoji', 'badge')`),
]);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  videos: many(videos),
  streams: many(streams),
  comments: many(comments),
  chatMessages: many(chatMessages),
  videoLikes: many(videoLikes),
  commentLikes: many(commentLikes),
  superchats: many(superchats),
  payments: many(payments),
  subscriptions: many(subscriptions, { relationName: "subscriber" }),
  subscribers: many(subscriptions, { relationName: "channel" }),
  followers: many(follows, { relationName: "following" }),
  following: many(follows, { relationName: "follower" }),
  creatorSettings: one(creatorSettings),
  // Membership relations
  membershipTiers: many(membershipTiers),
  memberContent: many(memberContent),
  giftedSubscriptions: many(subscriptions, { relationName: "gifter" }),
}));

export const membershipTiersRelations = relations(membershipTiers, ({ one, many }) => ({
  channel: one(users, { fields: [membershipTiers.channelId], references: [users.id] }),
  benefits: many(membershipBenefits),
  subscriptions: many(subscriptions),
  memberContent: many(memberContent),
}));

export const membershipBenefitsRelations = relations(membershipBenefits, ({ one }) => ({
  tier: one(membershipTiers, { fields: [membershipBenefits.tierId], references: [membershipTiers.id] }),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  user: one(users, { fields: [videos.userId], references: [users.id] }),
  comments: many(comments),
  likes: many(videoLikes),
  thumbnails: many(videoThumbnails),
}));

export const streamsRelations = relations(streams, ({ one, many }) => ({
  user: one(users, { fields: [streams.userId], references: [users.id] }),
  chatMessages: many(chatMessages),
  superchats: many(superchats),
  payments: many(payments),
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

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, { fields: [payments.userId], references: [users.id] }),
  stream: one(streams, { fields: [payments.streamId], references: [streams.id] }),
}));

export const superchatsRelations = relations(superchats, ({ one }) => ({
  stream: one(streams, { fields: [superchats.streamId], references: [streams.id] }),
  user: one(users, { fields: [superchats.userId], references: [users.id] }),
  payment: one(payments, { fields: [superchats.paymentId], references: [payments.id] }),
}));

export const videoThumbnailsRelations = relations(videoThumbnails, ({ one }) => ({
  video: one(videos, { fields: [videoThumbnails.videoId], references: [videos.id] }),
}));

export const creatorSettingsRelations = relations(creatorSettings, ({ one }) => ({
  user: one(users, { fields: [creatorSettings.userId], references: [users.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id], relationName: "subscriber" }),
  channel: one(users, { fields: [subscriptions.channelId], references: [users.id], relationName: "channel" }),
  tier: one(membershipTiers, { fields: [subscriptions.tierId], references: [membershipTiers.id] }),
  settings: one(subscriptionSettings),
  gifter: one(users, { fields: [subscriptions.giftedBy], references: [users.id], relationName: "gifter" }),
}));

export const subscriptionSettingsRelations = relations(subscriptionSettings, ({ one }) => ({
  subscription: one(subscriptions, { fields: [subscriptionSettings.subscriptionId], references: [subscriptions.id] }),
}));

export const memberContentRelations = relations(memberContent, ({ one }) => ({
  channel: one(users, { fields: [memberContent.channelId], references: [users.id] }),
  tier: one(membershipTiers, { fields: [memberContent.tierId], references: [membershipTiers.id] }),
  video: one(videos, { fields: [memberContent.videoId], references: [videos.id] }),
  stream: one(streams, { fields: [memberContent.streamId], references: [streams.id] }),
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

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  creatorAmount: true,
  platformAmount: true,
});

export const insertSuperchatSchema = createInsertSchema(superchats).omit({
  id: true,
  createdAt: true,
  isProcessed: true,
  isPinned: true,
  pinnedUntil: true,
});

export const insertVideoThumbnailSchema = createInsertSchema(videoThumbnails).omit({
  id: true,
  createdAt: true,
});

export const insertCreatorSettingsSchema = createInsertSchema(creatorSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Membership schemas
export const insertMembershipTierSchema = createInsertSchema(membershipTiers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMembershipBenefitSchema = createInsertSchema(membershipBenefits).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalPaid: true,
});

export const insertSubscriptionSettingsSchema = createInsertSchema(subscriptionSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMemberContentSchema = createInsertSchema(memberContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


// Login schemas
export const loginSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
});

export const registerSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
  password: z.string()
    .min(8, "비밀번호는 8자 이상이어야 합니다")
    .regex(/[a-z]/, "비밀번호는 최소 1개 이상의 소문자를 포함해야 합니다")
    .regex(/[A-Z]/, "비밀번호는 최소 1개 이상의 대문자를 포함해야 합니다")
    .regex(/[0-9]/, "비밀번호는 최소 1개 이상의 숫자를 포함해야 합니다")
    .regex(/[^a-zA-Z0-9]/, "비밀번호는 최소 1개 이상의 특수문자를 포함해야 합니다"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string().min(3, "사용자명은 3자 이상이어야 합니다").max(30, "사용자명은 30자 이하여야 합니다"),
}).transform(data => ({
  ...data,
  firstName: data.firstName === '' ? undefined : data.firstName,
  lastName: data.lastName === '' ? undefined : data.lastName,
}));

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
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertSuperchat = z.infer<typeof insertSuperchatSchema>;
export type Superchat = typeof superchats.$inferSelect;
export type InsertVideoThumbnail = z.infer<typeof insertVideoThumbnailSchema>;
export type VideoThumbnail = typeof videoThumbnails.$inferSelect;
export type InsertCreatorSettings = z.infer<typeof insertCreatorSettingsSchema>;
export type CreatorSettings = typeof creatorSettings.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertMembershipTier = z.infer<typeof insertMembershipTierSchema>;
export type MembershipTier = typeof membershipTiers.$inferSelect;
export type InsertMembershipBenefit = z.infer<typeof insertMembershipBenefitSchema>;
export type MembershipBenefit = typeof membershipBenefits.$inferSelect;
export type InsertSubscriptionSettings = z.infer<typeof insertSubscriptionSettingsSchema>;
export type SubscriptionSettings = typeof subscriptionSettings.$inferSelect;
export type InsertMemberContent = z.infer<typeof insertMemberContentSchema>;
export type MemberContent = typeof memberContent.$inferSelect;
export type InsertAdvertiser = z.infer<typeof insertAdvertiserSchema>;
export type Advertiser = typeof advertisers.$inferSelect;
export type InsertAdCampaign = z.infer<typeof insertAdCampaignSchema>;
export type AdCampaign = typeof adCampaigns.$inferSelect;
export type InsertAdCreative = z.infer<typeof insertAdCreativeSchema>;
export type AdCreative = typeof adCreatives.$inferSelect;
export type InsertAdPlacement = z.infer<typeof insertAdPlacementSchema>;
export type AdPlacement = typeof adPlacements.$inferSelect;
export type InsertAdAuctionBid = z.infer<typeof insertAdAuctionBidSchema>;
export type AdAuctionBid = typeof adAuctionBids.$inferSelect;
export type InsertAdImpression = z.infer<typeof insertAdImpressionSchema>;
export type AdImpression = typeof adImpressions.$inferSelect;
export type InsertUserAdPreferences = z.infer<typeof insertUserAdPreferencesSchema>;
export type UserAdPreferences = typeof userAdPreferences.$inferSelect;

// ========== ADVERTISING SYSTEM ==========

// Advertisers table - 광고주 관리
export const advertisers = pgTable("advertisers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  companyName: varchar("company_name").notNull(),
  industry: varchar("industry"),
  contactEmail: varchar("contact_email").notNull(),
  contactPerson: varchar("contact_person"),
  website: varchar("website"),
  // 광고주 인증 및 상태
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  accountBalance: integer("account_balance").default(0), // in KRW
  totalSpent: integer("total_spent").default(0),
  // 타겟팅 제한사항
  allowedCategories: text("allowed_categories").array(), // 허용된 카테고리들
  blockedKeywords: text("blocked_keywords").array(),
  // 메타데이터
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_advertisers_user_id").on(table.userId),
  index("IDX_advertisers_industry").on(table.industry),
  index("IDX_advertisers_verified").on(table.isVerified),
  index("IDX_advertisers_active").on(table.isActive),
  index("IDX_advertisers_balance").on(table.accountBalance),
  unique("UQ_advertisers_user_id").on(table.userId),
  check("CHK_advertisers_balance", sql`${table.accountBalance} >= 0`),
  check("CHK_advertisers_spent", sql`${table.totalSpent} >= 0`),
]);

// Ad campaigns table - 광고 캠페인
export const adCampaigns = pgTable("ad_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advertiserId: varchar("advertiser_id").notNull().references(() => advertisers.id),
  name: varchar("name").notNull(),
  description: text("description"),
  
  // 캠페인 목표 및 타입
  objective: varchar("objective").notNull(), // 'brand_awareness', 'traffic', 'conversions', 'video_views'
  campaignType: varchar("campaign_type").notNull(), // 'display', 'video', 'overlay', 'sponsored_content'
  
  // 예산 및 입찰
  dailyBudget: integer("daily_budget").notNull(),
  totalBudget: integer("total_budget"),
  bidStrategy: varchar("bid_strategy").default("cpm"), // 'cpm', 'cpc', 'cpa', 'viewable_cpm'
  maxBid: integer("max_bid").notNull(), // 최대 입찰가
  
  // 타겟팅 설정
  targetAudience: jsonb("target_audience"), // 나이, 성별, 지역, 관심사 등
  targetCategories: text("target_categories").array(),
  targetKeywords: text("target_keywords").array(),
  excludeKeywords: text("exclude_keywords").array(),
  
  // 스케줄링
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  timeSlots: jsonb("time_slots"), // 시간대별 노출 설정
  
  // 상태 및 성과
  status: varchar("status").default("draft"), // 'draft', 'active', 'paused', 'completed', 'cancelled'
  isActive: boolean("is_active").default(false),
  totalSpent: integer("total_spent").default(0),
  totalImpressions: integer("total_impressions").default(0),
  totalClicks: integer("total_clicks").default(0),
  totalViews: integer("total_views").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_ad_campaigns_advertiser").on(table.advertiserId),
  index("IDX_ad_campaigns_objective").on(table.objective),
  index("IDX_ad_campaigns_type").on(table.campaignType),
  index("IDX_ad_campaigns_status").on(table.status),
  index("IDX_ad_campaigns_active").on(table.isActive),
  index("IDX_ad_campaigns_dates").on(table.startDate, table.endDate),
  index("IDX_ad_campaigns_budget").on(table.dailyBudget),
  check("CHK_ad_campaigns_objective", sql`${table.objective} IN ('brand_awareness', 'traffic', 'conversions', 'video_views')`),
  check("CHK_ad_campaigns_type", sql`${table.campaignType} IN ('display', 'video', 'overlay', 'sponsored_content')`),
  check("CHK_ad_campaigns_bid_strategy", sql`${table.bidStrategy} IN ('cpm', 'cpc', 'cpa', 'viewable_cpm')`),
  check("CHK_ad_campaigns_status", sql`${table.status} IN ('draft', 'active', 'paused', 'completed', 'cancelled')`),
  check("CHK_ad_campaigns_budget", sql`${table.dailyBudget} >= 1000 AND ${table.maxBid} >= 100`),
]);

// Ad creatives table - 광고 소재
export const adCreatives = pgTable("ad_creatives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => adCampaigns.id),
  name: varchar("name").notNull(),
  
  // 광고 소재 타입 및 내용
  creativeType: varchar("creative_type").notNull(), // 'image', 'video', 'text', 'rich_media'
  title: varchar("title"),
  description: text("description"),
  imageUrl: varchar("image_url"),
  videoUrl: varchar("video_url"),
  thumbnailUrl: varchar("thumbnail_url"),
  
  // 행동 유도 (CTA)
  ctaText: varchar("cta_text"),
  ctaUrl: varchar("cta_url"),
  
  // 크기 및 포맷
  dimensions: jsonb("dimensions"), // {width, height}
  aspectRatio: varchar("aspect_ratio"),
  fileSize: integer("file_size"),
  duration: integer("duration"), // 비디오 길이 (초)
  
  // 상태 및 승인
  status: varchar("status").default("pending"), // 'pending', 'approved', 'rejected', 'active', 'paused'
  isActive: boolean("is_active").default(false),
  moderationNotes: text("moderation_notes"),
  
  // 성과 추적
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  views: integer("views").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_ad_creatives_campaign").on(table.campaignId),
  index("IDX_ad_creatives_type").on(table.creativeType),
  index("IDX_ad_creatives_status").on(table.status),
  index("IDX_ad_creatives_active").on(table.isActive),
  check("CHK_ad_creatives_type", sql`${table.creativeType} IN ('image', 'video', 'text', 'rich_media')`),
  check("CHK_ad_creatives_status", sql`${table.status} IN ('pending', 'approved', 'rejected', 'active', 'paused')`),
]);

// Ad placements table - 광고 지면
export const adPlacements = pgTable("ad_placements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  
  // 지면 위치 및 타입
  placementType: varchar("placement_type").notNull(), // 'pre_roll', 'mid_roll', 'post_roll', 'banner', 'overlay', 'sidebar'
  position: varchar("position"), // 'top', 'bottom', 'left', 'right', 'center'
  
  // 지면별 설정
  pageTypes: text("page_types").array(), // ['home', 'video', 'live', 'profile']
  categories: text("categories").array(),
  
  // 크기 및 제약
  dimensions: jsonb("dimensions"),
  maxDuration: integer("max_duration"), // 최대 광고 길이 (초)
  
  // 가격 설정
  floorPrice: integer("floor_price").notNull(), // 최소 입찰가
  
  // 상태
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_ad_placements_type").on(table.placementType),
  index("IDX_ad_placements_position").on(table.position),
  index("IDX_ad_placements_active").on(table.isActive),
  index("IDX_ad_placements_floor_price").on(table.floorPrice),
  check("CHK_ad_placements_type", sql`${table.placementType} IN ('pre_roll', 'mid_roll', 'post_roll', 'banner', 'overlay', 'sidebar')`),
  check("CHK_ad_placements_floor_price", sql`${table.floorPrice} >= 50`),
]);

// Ad auction bids table - 실시간 경매 입찰
export const adAuctionBids = pgTable("ad_auction_bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auctionId: varchar("auction_id").notNull(), // 경매 세션 ID
  campaignId: varchar("campaign_id").notNull().references(() => adCampaigns.id),
  creativeId: varchar("creative_id").notNull().references(() => adCreatives.id),
  placementId: varchar("placement_id").notNull().references(() => adPlacements.id),
  
  // 입찰 정보
  bidAmount: integer("bid_amount").notNull(),
  bidStrategy: varchar("bid_strategy").notNull(),
  
  // 타겟팅 점수
  targetingScore: integer("targeting_score").default(0), // 0-100
  qualityScore: integer("quality_score").default(0), // 0-100
  
  // 경매 결과
  isWinning: boolean("is_winning").default(false),
  finalPrice: integer("final_price"),
  
  // 컨텍스트 정보
  userSegment: varchar("user_segment"),
  contentCategory: varchar("content_category"),
  pageType: varchar("page_type"),
  deviceType: varchar("device_type"),
  
  // 타이밍
  bidTimestamp: timestamp("bid_timestamp").defaultNow(),
  auctionDuration: integer("auction_duration"), // 밀리초
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_ad_auction_bids_auction").on(table.auctionId),
  index("IDX_ad_auction_bids_campaign").on(table.campaignId),
  index("IDX_ad_auction_bids_placement").on(table.placementId),
  index("IDX_ad_auction_bids_winning").on(table.isWinning),
  index("IDX_ad_auction_bids_timestamp").on(table.bidTimestamp),
  index("IDX_ad_auction_bids_user_segment").on(table.userSegment),
  check("CHK_ad_auction_bids_bid_amount", sql`${table.bidAmount} >= 50`),
  check("CHK_ad_auction_bids_scores", sql`${table.targetingScore} >= 0 AND ${table.targetingScore} <= 100 AND ${table.qualityScore} >= 0 AND ${table.qualityScore} <= 100`),
]);

// Ad impressions table - 광고 노출 추적
export const adImpressions = pgTable("ad_impressions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auctionId: varchar("auction_id").notNull(),
  campaignId: varchar("campaign_id").notNull().references(() => adCampaigns.id),
  creativeId: varchar("creative_id").notNull().references(() => adCreatives.id),
  placementId: varchar("placement_id").notNull().references(() => adPlacements.id),
  
  // 수익 정보
  cost: integer("cost").notNull(), // 광고주가 지불한 금액
  revenue: integer("revenue").notNull(), // 플랫폼 수익
  creatorRevenue: integer("creator_revenue").notNull(), // 크리에이터 수익
  
  // 컨텍스트 정보
  userId: varchar("user_id").references(() => users.id),
  videoId: varchar("video_id").references(() => videos.id),
  streamId: varchar("stream_id").references(() => streams.id),
  
  // 사용자 세그먼트 (익명화된 정보)
  userSegment: varchar("user_segment"),
  ageGroup: varchar("age_group"),
  location: varchar("location"), // 시/도 레벨
  deviceType: varchar("device_type"),
  browserType: varchar("browser_type"),
  
  // 노출 세부 정보
  impressionType: varchar("impression_type").notNull(), // 'view', 'skip', 'complete'
  viewDuration: integer("view_duration").default(0), // 실제 시청 시간 (초)
  isViewable: boolean("is_viewable").default(false), // 뷰어빌리티
  
  // 상호작용
  isClicked: boolean("is_clicked").default(false),
  clickTimestamp: timestamp("click_timestamp"),
  
  // IP 주소 해시 (중복 방지용)
  ipHash: varchar("ip_hash"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_ad_impressions_auction").on(table.auctionId),
  index("IDX_ad_impressions_campaign").on(table.campaignId),
  index("IDX_ad_impressions_creative").on(table.creativeId),
  index("IDX_ad_impressions_placement").on(table.placementId),
  index("IDX_ad_impressions_user").on(table.userId),
  index("IDX_ad_impressions_video").on(table.videoId),
  index("IDX_ad_impressions_stream").on(table.streamId),
  index("IDX_ad_impressions_type").on(table.impressionType),
  index("IDX_ad_impressions_clicked").on(table.isClicked),
  index("IDX_ad_impressions_created_at").on(table.createdAt),
  index("IDX_ad_impressions_user_segment").on(table.userSegment),
  index("IDX_ad_impressions_ip_hash").on(table.ipHash),
  check("CHK_ad_impressions_type", sql`${table.impressionType} IN ('view', 'skip', 'complete')`),
  check("CHK_ad_impressions_cost", sql`${table.cost} >= 0 AND ${table.revenue} >= 0 AND ${table.creatorRevenue} >= 0`),
  check("CHK_ad_impressions_view_duration", sql`${table.viewDuration} >= 0`),
]);

// User ad preferences table - 사용자 광고 선호도
export const userAdPreferences = pgTable("user_ad_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // 광고 설정
  allowPersonalizedAds: boolean("allow_personalized_ads").default(true),
  maxAdsPerSession: integer("max_ads_per_session").default(5),
  
  // 선호 광고 타입
  preferredAdTypes: text("preferred_ad_types").array(),
  blockedCategories: text("blocked_categories").array(),
  blockedAdvertisers: text("blocked_advertisers").array(),
  
  // 관심 카테고리 (타겟팅용)
  interests: text("interests").array(),
  recentCategories: text("recent_categories").array(),
  
  // 행동 패턴 (익명화된 정보)
  avgSessionDuration: integer("avg_session_duration").default(0),
  primaryWatchTime: varchar("primary_watch_time"), // 주요 시청 시간대
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_user_ad_preferences_user").on(table.userId),
  index("IDX_user_ad_preferences_personalized").on(table.allowPersonalizedAds),
  unique("UQ_user_ad_preferences_user").on(table.userId),
  check("CHK_user_ad_preferences_max_ads", sql`${table.maxAdsPerSession} >= 0 AND ${table.maxAdsPerSession} <= 20`),
]);

// Advertising insert schemas
export const insertAdvertiserSchema = createInsertSchema(advertisers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalSpent: true,
});

export const insertAdCampaignSchema = createInsertSchema(adCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalSpent: true,
  totalImpressions: true,
  totalClicks: true,
  totalViews: true,
});

export const insertAdCreativeSchema = createInsertSchema(adCreatives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  impressions: true,
  clicks: true,
  views: true,
});

export const insertAdPlacementSchema = createInsertSchema(adPlacements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdAuctionBidSchema = createInsertSchema(adAuctionBids).omit({
  id: true,
  createdAt: true,
});

export const insertAdImpressionSchema = createInsertSchema(adImpressions).omit({
  id: true,
  createdAt: true,
});

export const insertUserAdPreferencesSchema = createInsertSchema(userAdPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Playlists table for content management
export const playlists = pgTable("playlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: varchar("thumbnail_url"),
  isPublic: boolean("is_public").default(true),
  videoCount: integer("video_count").default(0),
  totalDuration: integer("total_duration").default(0), // in seconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_playlists_user_id").on(table.userId),
  index("IDX_playlists_is_public").on(table.isPublic),
  index("IDX_playlists_created_at").on(table.createdAt),
  index("IDX_playlists_user_public_created").on(table.userId, table.isPublic, table.createdAt),
  check("CHK_playlists_video_count", sql`${table.videoCount} >= 0`),
  check("CHK_playlists_total_duration", sql`${table.totalDuration} >= 0`),
]);

// Playlist-Video relationship table
export const playlistVideos = pgTable("playlist_videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playlistId: varchar("playlist_id").notNull().references(() => playlists.id),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  orderIndex: integer("order_index").notNull().default(0),
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => [
  index("IDX_playlist_videos_playlist_id").on(table.playlistId),
  index("IDX_playlist_videos_video_id").on(table.videoId),
  index("IDX_playlist_videos_order_index").on(table.orderIndex),
  index("IDX_playlist_videos_playlist_order").on(table.playlistId, table.orderIndex),
  index("IDX_playlist_videos_added_at").on(table.addedAt),
  unique("UQ_playlist_videos_playlist_video").on(table.playlistId, table.videoId),
  check("CHK_playlist_videos_order_index", sql`${table.orderIndex} >= 0`),
]);

// Channel Analytics table for dashboard metrics
export const channelAnalytics = pgTable("channel_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  // Subscriber metrics
  subscriberCount: integer("subscriber_count").default(0),
  subscriberChange: integer("subscriber_change").default(0),
  // View metrics
  totalViews: integer("total_views").default(0),
  dailyViews: integer("daily_views").default(0),
  // Watch time metrics (in seconds)
  totalWatchTime: integer("total_watch_time").default(0),
  dailyWatchTime: integer("daily_watch_time").default(0),
  averageViewDuration: integer("average_view_duration").default(0),
  // Engagement metrics
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  sharesCount: integer("shares_count").default(0),
  // Revenue metrics (in smallest currency unit - won)
  dailyRevenue: integer("daily_revenue").default(0),
  totalRevenue: integer("total_revenue").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_channel_analytics_user_id").on(table.userId),
  index("IDX_channel_analytics_date").on(table.date),
  index("IDX_channel_analytics_user_date").on(table.userId, table.date),
  index("IDX_channel_analytics_created_at").on(table.createdAt),
  unique("UQ_channel_analytics_user_date").on(table.userId, table.date),
  check("CHK_channel_analytics_subscriber_count", sql`${table.subscriberCount} >= 0`),
  check("CHK_channel_analytics_total_views", sql`${table.totalViews} >= 0`),
  check("CHK_channel_analytics_daily_views", sql`${table.dailyViews} >= 0`),
  check("CHK_channel_analytics_watch_time", sql`${table.totalWatchTime} >= 0 AND ${table.dailyWatchTime} >= 0`),
  check("CHK_channel_analytics_engagement", sql`${table.likesCount} >= 0 AND ${table.commentsCount} >= 0 AND ${table.sharesCount} >= 0`),
  check("CHK_channel_analytics_revenue", sql`${table.dailyRevenue} >= 0 AND ${table.totalRevenue} >= 0`),
]);

// View Sessions table for detailed analytics
export const viewSessions = pgTable("view_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").references(() => videos.id),
  streamId: varchar("stream_id").references(() => streams.id),
  userId: varchar("user_id").references(() => users.id), // null for anonymous
  sessionId: varchar("session_id").notNull(), // anonymous session tracking
  // Viewer demographics
  country: varchar("country"),
  region: varchar("region"),
  city: varchar("city"),
  deviceType: varchar("device_type"), // mobile, desktop, tablet, tv
  os: varchar("os"),
  browser: varchar("browser"),
  // View metrics
  watchTime: integer("watch_time").default(0), // in seconds
  viewDuration: integer("view_duration").default(0), // in seconds
  completionRate: integer("completion_rate").default(0), // percentage 0-100
  // Traffic source
  trafficSource: varchar("traffic_source"), // search, suggested, direct, external, etc.
  referrer: varchar("referrer"),
  searchKeyword: varchar("search_keyword"),
  // Engagement
  liked: boolean("liked").default(false),
  commented: boolean("commented").default(false),
  shared: boolean("shared").default(false),
  subscribedAfter: boolean("subscribed_after").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_view_sessions_video_id").on(table.videoId),
  index("IDX_view_sessions_stream_id").on(table.streamId),
  index("IDX_view_sessions_user_id").on(table.userId),
  index("IDX_view_sessions_session_id").on(table.sessionId),
  index("IDX_view_sessions_created_at").on(table.createdAt),
  index("IDX_view_sessions_country").on(table.country),
  index("IDX_view_sessions_device_type").on(table.deviceType),
  index("IDX_view_sessions_traffic_source").on(table.trafficSource),
  index("IDX_view_sessions_video_created").on(table.videoId, table.createdAt),
  index("IDX_view_sessions_stream_created").on(table.streamId, table.createdAt),
  check("CHK_view_sessions_watch_time", sql`${table.watchTime} >= 0`),
  check("CHK_view_sessions_view_duration", sql`${table.viewDuration} >= 0`),
  check("CHK_view_sessions_completion_rate", sql`${table.completionRate} >= 0 AND ${table.completionRate} <= 100`),
  check("CHK_view_sessions_content_exists", sql`(${table.videoId} IS NOT NULL) OR (${table.streamId} IS NOT NULL)`),
  check("CHK_view_sessions_device_type", sql`${table.deviceType} IN ('mobile', 'desktop', 'tablet', 'tv') OR ${table.deviceType} IS NULL`),
]);

// Channel Settings table for customization
export const channelSettings = pgTable("channel_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  // Channel branding
  channelName: varchar("channel_name"),
  channelDescription: text("channel_description"),
  bannerUrl: varchar("banner_url"),
  logoUrl: varchar("logo_url"),
  channelTrailerVideoId: varchar("channel_trailer_video_id").references(() => videos.id),
  // Channel links and social media
  websiteUrl: varchar("website_url"),
  twitterHandle: varchar("twitter_handle"),
  instagramHandle: varchar("instagram_handle"),
  facebookUrl: varchar("facebook_url"),
  // Content settings
  defaultCategory: varchar("default_category"),
  defaultPrivacy: varchar("default_privacy").default("public"),
  autoTranslate: boolean("auto_translate").default(false),
  // Monetization settings
  monetizationEnabled: boolean("monetization_enabled").default(false),
  superchatEnabled: boolean("superchat_enabled").default(false),
  membershipEnabled: boolean("membership_enabled").default(false),
  // Analytics settings
  publicStats: boolean("public_stats").default(true),
  commentsEnabled: boolean("comments_enabled").default(true),
  ratingsEnabled: boolean("ratings_enabled").default(true),
  // Notification settings
  emailNotifications: boolean("email_notifications").default(true),
  commentNotifications: boolean("comment_notifications").default(true),
  subscriptionNotifications: boolean("subscription_notifications").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_channel_settings_user_id").on(table.userId),
  index("IDX_channel_settings_channel_name").on(table.channelName),
  index("IDX_channel_settings_default_privacy").on(table.defaultPrivacy),
  index("IDX_channel_settings_monetization").on(table.monetizationEnabled),
  index("IDX_channel_settings_created_at").on(table.createdAt),
  unique("UQ_channel_settings_user_id").on(table.userId),
  check("CHK_channel_settings_default_privacy", sql`${table.defaultPrivacy} IN ('public', 'unlisted', 'private')`),
]);

// Revenue Reports table for monetization management
export const revenueReports = pgTable("revenue_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  reportMonth: varchar("report_month").notNull(), // YYYY-MM format
  // Revenue breakdown (in smallest currency unit - won)
  adRevenue: integer("ad_revenue").default(0),
  superchatRevenue: integer("superchat_revenue").default(0),
  membershipRevenue: integer("membership_revenue").default(0),
  otherRevenue: integer("other_revenue").default(0),
  totalRevenue: integer("total_revenue").default(0),
  // Platform fees and cuts
  platformFee: integer("platform_fee").default(0),
  processingFee: integer("processing_fee").default(0),
  netRevenue: integer("net_revenue").default(0),
  // Tax information
  taxWithheld: integer("tax_withheld").default(0),
  taxableAmount: integer("taxable_amount").default(0),
  // Payment status
  paymentStatus: varchar("payment_status").default("pending"), // pending, paid, failed
  paymentDate: timestamp("payment_date"),
  paymentMethod: varchar("payment_method"),
  // Metrics for the period
  totalViews: integer("total_views").default(0),
  monetizedViews: integer("monetized_views").default(0),
  rpm: integer("rpm").default(0), // Revenue per mille (per 1000 views)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_revenue_reports_user_id").on(table.userId),
  index("IDX_revenue_reports_report_month").on(table.reportMonth),
  index("IDX_revenue_reports_payment_status").on(table.paymentStatus),
  index("IDX_revenue_reports_payment_date").on(table.paymentDate),
  index("IDX_revenue_reports_created_at").on(table.createdAt),
  index("IDX_revenue_reports_user_month").on(table.userId, table.reportMonth),
  unique("UQ_revenue_reports_user_month").on(table.userId, table.reportMonth),
  check("CHK_revenue_reports_revenue", sql`${table.adRevenue} >= 0 AND ${table.superchatRevenue} >= 0 AND ${table.membershipRevenue} >= 0 AND ${table.otherRevenue} >= 0 AND ${table.totalRevenue} >= 0`),
  check("CHK_revenue_reports_fees", sql`${table.platformFee} >= 0 AND ${table.processingFee} >= 0`),
  check("CHK_revenue_reports_views", sql`${table.totalViews} >= 0 AND ${table.monetizedViews} >= 0 AND ${table.monetizedViews} <= ${table.totalViews}`),
  check("CHK_revenue_reports_payment_status", sql`${table.paymentStatus} IN ('pending', 'paid', 'failed')`),
  check("CHK_revenue_reports_rpm", sql`${table.rpm} >= 0`),
]);

// Content Performance table for detailed video analytics
export const contentPerformance = pgTable("content_performance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").references(() => videos.id),
  streamId: varchar("stream_id").references(() => streams.id),
  date: timestamp("date").notNull(),
  // Basic metrics
  views: integer("views").default(0),
  uniqueViews: integer("unique_views").default(0),
  watchTime: integer("watch_time").default(0), // in seconds
  averageViewDuration: integer("average_view_duration").default(0),
  // Engagement metrics
  likes: integer("likes").default(0),
  dislikes: integer("dislikes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  // Discovery metrics
  impressions: integer("impressions").default(0),
  clickThroughRate: integer("click_through_rate").default(0), // percentage * 100
  // Traffic sources
  searchTraffic: integer("search_traffic").default(0),
  suggestedTraffic: integer("suggested_traffic").default(0),
  directTraffic: integer("direct_traffic").default(0),
  externalTraffic: integer("external_traffic").default(0),
  // Audience retention
  retentionRate25: integer("retention_rate_25").default(0), // percentage * 100
  retentionRate50: integer("retention_rate_50").default(0),
  retentionRate75: integer("retention_rate_75").default(0),
  retentionRate100: integer("retention_rate_100").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_content_performance_video_id").on(table.videoId),
  index("IDX_content_performance_stream_id").on(table.streamId),
  index("IDX_content_performance_date").on(table.date),
  index("IDX_content_performance_created_at").on(table.createdAt),
  index("IDX_content_performance_video_date").on(table.videoId, table.date),
  index("IDX_content_performance_stream_date").on(table.streamId, table.date),
  index("IDX_content_performance_views").on(table.views),
  unique("UQ_content_performance_video_date").on(table.videoId, table.date),
  unique("UQ_content_performance_stream_date").on(table.streamId, table.date),
  check("CHK_content_performance_content_exists", sql`(${table.videoId} IS NOT NULL) OR (${table.streamId} IS NOT NULL)`),
  check("CHK_content_performance_views", sql`${table.views} >= 0 AND ${table.uniqueViews} >= 0 AND ${table.uniqueViews} <= ${table.views}`),
  check("CHK_content_performance_time_metrics", sql`${table.watchTime} >= 0 AND ${table.averageViewDuration} >= 0`),
  check("CHK_content_performance_engagement", sql`${table.likes} >= 0 AND ${table.dislikes} >= 0 AND ${table.comments} >= 0 AND ${table.shares} >= 0`),
  check("CHK_content_performance_impressions", sql`${table.impressions} >= 0`),
  check("CHK_content_performance_ctr", sql`${table.clickThroughRate} >= 0 AND ${table.clickThroughRate} <= 10000`),
  check("CHK_content_performance_traffic", sql`${table.searchTraffic} >= 0 AND ${table.suggestedTraffic} >= 0 AND ${table.directTraffic} >= 0 AND ${table.externalTraffic} >= 0`),
  check("CHK_content_performance_retention", sql`${table.retentionRate25} >= 0 AND ${table.retentionRate50} >= 0 AND ${table.retentionRate75} >= 0 AND ${table.retentionRate100} >= 0 AND ${table.retentionRate25} <= 10000 AND ${table.retentionRate50} <= 10000 AND ${table.retentionRate75} <= 10000 AND ${table.retentionRate100} <= 10000`),
]);

// Copyright reports table (일반 사용자가 제출하는 저작권 신고)
export const copyrightReports = pgTable("copyright_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").notNull().references(() => users.id), // 신고자
  videoId: varchar("video_id").references(() => videos.id), // 신고된 동영상
  streamId: varchar("stream_id").references(() => streams.id), // 신고된 스트림
  claimType: varchar("claim_type").notNull(), // music, video, image, other
  rightsOwnerType: varchar("rights_owner_type").notNull(), // myself, representative
  copyrightOwner: text("copyright_owner").notNull(), // 저작권자 정보
  description: text("description").notNull(), // 신고 사유
  evidence: text("evidence"), // 증거 자료 (링크 등)
  contactEmail: varchar("contact_email").notNull(), // 연락처
  status: varchar("status").default("pending"), // pending, reviewed, approved, rejected
  reviewedAt: timestamp("reviewed_at"),
  reviewerNotes: text("reviewer_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_copyright_reports_reporter_id").on(table.reporterId),
  index("IDX_copyright_reports_video_id").on(table.videoId),
  index("IDX_copyright_reports_stream_id").on(table.streamId),
  index("IDX_copyright_reports_status").on(table.status),
  index("IDX_copyright_reports_claim_type").on(table.claimType),
  index("IDX_copyright_reports_created_at").on(table.createdAt),
  index("IDX_copyright_reports_reviewed_at").on(table.reviewedAt),
  index("IDX_copyright_reports_video_status").on(table.videoId, table.status),
  index("IDX_copyright_reports_stream_status").on(table.streamId, table.status),
  check("CHK_copyright_reports_content_exists", sql`(${table.videoId} IS NOT NULL) OR (${table.streamId} IS NOT NULL)`),
  check("CHK_copyright_reports_claim_type", sql`${table.claimType} IN ('music', 'video', 'image', 'other')`),
  check("CHK_copyright_reports_rights_owner_type", sql`${table.rightsOwnerType} IN ('myself', 'representative')`),
  check("CHK_copyright_reports_status", sql`${table.status} IN ('pending', 'reviewed', 'approved', 'rejected')`),
]);

// Insert schemas for new tables
export const insertPlaylistSchema = createInsertSchema(playlists);
export const insertPlaylistVideoSchema = createInsertSchema(playlistVideos);
export const insertChannelAnalyticsSchema = createInsertSchema(channelAnalytics);
export const insertViewSessionSchema = createInsertSchema(viewSessions);
export const insertChannelSettingsSchema = createInsertSchema(channelSettings);
export const insertRevenueReportSchema = createInsertSchema(revenueReports);
export const insertContentPerformanceSchema = createInsertSchema(contentPerformance);
export const insertCopyrightReportSchema = createInsertSchema(copyrightReports);

// Types for new tables
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylistVideo = z.infer<typeof insertPlaylistVideoSchema>;
export type PlaylistVideo = typeof playlistVideos.$inferSelect;
export type InsertChannelAnalytics = z.infer<typeof insertChannelAnalyticsSchema>;
export type ChannelAnalytics = typeof channelAnalytics.$inferSelect;
export type InsertViewSession = z.infer<typeof insertViewSessionSchema>;
export type ViewSession = typeof viewSessions.$inferSelect;
export type InsertChannelSettings = z.infer<typeof insertChannelSettingsSchema>;
export type ChannelSettings = typeof channelSettings.$inferSelect;
export type InsertRevenueReport = z.infer<typeof insertRevenueReportSchema>;
export type RevenueReport = typeof revenueReports.$inferSelect;
export type InsertContentPerformance = z.infer<typeof insertContentPerformanceSchema>;
export type ContentPerformance = typeof contentPerformance.$inferSelect;
export type InsertCopyrightReport = z.infer<typeof insertCopyrightReportSchema>;
export type CopyrightReport = typeof copyrightReports.$inferSelect;
