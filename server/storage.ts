import {
  users,
  videos,
  streams,
  comments,
  chatMessages,
  videoLikes,
  follows,
  commentLikes,
  superchats,
  subscriptions,
  payments,
  videoThumbnails,
  creatorSettings,
  copyrightReports,
  type User,
  type UpsertUser,
  type Video,
  type InsertVideo,
  type Stream,
  type InsertStream,
  type Comment,
  type InsertComment,
  type ChatMessage,
  type InsertChatMessage,
  type VideoLike,
  type InsertVideoLike,
  type Follow,
  type InsertFollow,
  type CommentLike,
  type InsertCommentLike,
  type Superchat,
  type InsertSuperchat,
  type Payment,
  type InsertPayment,
  type VideoThumbnail,
  type InsertVideoThumbnail,
  type CreatorSettings,
  type InsertCreatorSettings,
  type Subscription,
  type InsertSubscription,
  type CopyrightReport,
  type InsertCopyrightReport,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByProviderId(provider: string, providerId: string): Promise<User | undefined>;

  // Video operations
  createVideo(video: InsertVideo): Promise<Video>;
  getVideo(id: string): Promise<Video | undefined>;
  getVideosByUser(userId: string): Promise<Video[]>;
  getPopularVideos(limit?: number): Promise<Video[]>;
  updateVideoViews(id: string): Promise<void>;
  deleteVideo(id: string): Promise<void>;

  // Stream operations
  createStream(stream: InsertStream): Promise<Stream>;
  getStream(id: string): Promise<Stream | undefined>;
  getLiveStreams(): Promise<Stream[]>;
  getUserStreams(userId: string): Promise<Stream[]>;
  updateStreamStatus(id: string, isLive: boolean, viewerCount?: number): Promise<void>;
  getStreamsByUser(userId: string): Promise<Stream[]>;
  deleteStream(id: string): Promise<void>;

  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByVideo(videoId: string): Promise<Comment[]>;
  deleteComment(id: string): Promise<void>;

  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesByStream(streamId: string, limit?: number): Promise<ChatMessage[]>;

  // Video likes operations
  toggleVideoLike(like: InsertVideoLike): Promise<VideoLike | null>;
  getVideoLikes(videoId: string): Promise<{ likes: number; dislikes: number }>;

  // Follow operations
  followUser(follow: InsertFollow): Promise<Follow>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  getFollowing(userId: string): Promise<User[]>;
  getFollowers(userId: string): Promise<User[]>;
  
  // Comment operations (enhanced)
  createCommentWithParent(comment: InsertComment): Promise<Comment>;
  getCommentReplies(commentId: string): Promise<Comment[]>;
  toggleCommentLike(like: InsertCommentLike): Promise<CommentLike | null>;
  updateCommentCounts(commentId: string): Promise<void>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: string, status: string, metadata?: any): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByUser(userId: string): Promise<Payment[]>;
  getPaymentsByStream(streamId: string): Promise<Payment[]>;
  
  // Superchat operations
  createSuperchat(superchat: InsertSuperchat): Promise<Superchat>;
  getSuperchats(streamId: string): Promise<Superchat[]>;
  updateSuperchatPin(id: string, isPinned: boolean, pinnedUntil?: Date): Promise<void>;
  
  // Video thumbnail operations
  createVideoThumbnail(thumbnail: InsertVideoThumbnail): Promise<VideoThumbnail>;
  getVideoThumbnails(videoId: string): Promise<VideoThumbnail[]>;
  selectVideoThumbnail(videoId: string, thumbnailId: string): Promise<void>;
  
  // Creator settings operations
  createCreatorSettings(settings: InsertCreatorSettings): Promise<CreatorSettings>;
  getCreatorSettings(userId: string): Promise<CreatorSettings | undefined>;
  updateCreatorSettings(userId: string, settings: Partial<CreatorSettings>): Promise<CreatorSettings>;
  
  // Subscription operations
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscription(userId: string, channelId: string): Promise<Subscription | undefined>;
  cancelSubscription(userId: string, channelId: string): Promise<void>;

  // Copyright report operations
  createCopyrightReport(report: InsertCopyrightReport): Promise<CopyrightReport>;
  getCopyrightReportsByUser(reporterId: string): Promise<CopyrightReport[]>;
  getCopyrightReportsByVideo(videoId: string): Promise<CopyrightReport[]>;
  updateCopyrightReportStatus(id: string, status: string, reviewerNotes?: string): Promise<void>;
  
  // Admin operations
  getUserCount(): Promise<number>;
  getActiveUserCount(): Promise<number>;
  getBannedUserCount(): Promise<number>;
  getVideoCount(): Promise<number>;
  getStreamCount(): Promise<number>;
  getTotalViews(): Promise<number>;
  getTotalRevenue(): Promise<number>;
  getPendingReportCount(): Promise<number>;
  getNewUsersToday(): Promise<number>;
  getNewVideosToday(): Promise<number>;
  getAdminUsers(filter?: string): Promise<any[]>;
  getAdminVideos(filter?: string): Promise<any[]>;
  getAdminReports(filter?: string): Promise<any[]>;
  updateUserAdminStatus(userId: string, action: string, reason?: string): Promise<void>;
  updateVideoAdminStatus(videoId: string, action: string): Promise<void>;
  updateReportAdminStatus(reportId: string, status: string, note?: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByProviderId(provider: string, providerId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.provider, provider), eq(users.providerId, providerId)));
    return user;
  }

  // Video operations
  async createVideo(video: InsertVideo): Promise<Video> {
    const [createdVideo] = await db.insert(videos).values(video).returning();
    return createdVideo;
  }

  async getVideo(id: string): Promise<Video | undefined> {
    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, id), eq(videos.isPublic, true)));
    return video;
  }

  async getVideosByUser(userId: string): Promise<Video[]> {
    return await db
      .select()
      .from(videos)
      .where(and(eq(videos.userId, userId), eq(videos.isPublic, true)))
      .orderBy(desc(videos.createdAt));
  }

  async getPopularVideos(limit = 12): Promise<any[]> {
    return await db
      .select({
        id: videos.id,
        userId: videos.userId,
        title: videos.title,
        description: videos.description,
        thumbnailUrl: videos.thumbnailUrl,
        videoUrl: videos.videoUrl,
        duration: videos.duration,
        viewCount: videos.viewCount,
        category: videos.category,
        isPublic: videos.isPublic,
        createdAt: videos.createdAt,
        updatedAt: videos.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(videos)
      .leftJoin(users, eq(videos.userId, users.id))
      .where(eq(videos.isPublic, true))
      .orderBy(desc(videos.viewCount), desc(videos.createdAt))
      .limit(limit);
  }

  async updateVideoViews(id: string): Promise<void> {
    await db
      .update(videos)
      .set({ viewCount: sql`${videos.viewCount} + 1` })
      .where(eq(videos.id, id));
  }

  async deleteVideo(id: string): Promise<void> {
    await db.delete(videos).where(eq(videos.id, id));
  }

  // Stream operations
  async createStream(stream: InsertStream): Promise<Stream> {
    const [createdStream] = await db.insert(streams).values(stream).returning();
    return createdStream;
  }

  async getStream(id: string): Promise<Stream | undefined> {
    const [stream] = await db.select().from(streams).where(eq(streams.id, id));
    return stream;
  }

  async getLiveStreams(): Promise<any[]> {
    return await db
      .select({
        id: streams.id,
        userId: streams.userId,
        title: streams.title,
        description: streams.description,
        category: streams.category,
        isLive: streams.isLive,
        isPublic: streams.isPublic,
        viewerCount: streams.viewerCount,
        startedAt: streams.startedAt,
        endedAt: streams.endedAt,
        createdAt: streams.createdAt,
        user: {
          id: users.id,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(streams)
      .leftJoin(users, eq(streams.userId, users.id))
      .where(and(eq(streams.isLive, true), eq(streams.isPublic, true)))
      .orderBy(desc(streams.viewerCount));
  }

  async updateStreamStatus(id: string, isLive: boolean, viewerCount?: number): Promise<void> {
    const updateData: any = { isLive };
    if (viewerCount !== undefined) {
      updateData.viewerCount = viewerCount;
    }
    if (isLive) {
      updateData.startedAt = new Date();
      updateData.isPublic = true; // 방송 시작 시 다른 사용자들에게 보이도록 설정
    } else {
      updateData.endedAt = new Date();
      updateData.isPublic = false; // 방송 종료 시 숨김
    }

    await db.update(streams).set(updateData).where(eq(streams.id, id));
  }

  async getUserStreams(userId: string): Promise<Stream[]> {
    return await db
      .select()
      .from(streams)
      .where(eq(streams.userId, userId))
      .orderBy(desc(streams.createdAt));
  }

  async getStreamsByUser(userId: string): Promise<Stream[]> {
    return await db
      .select()
      .from(streams)
      .where(eq(streams.userId, userId))
      .orderBy(desc(streams.createdAt));
  }

  async deleteStream(id: string): Promise<void> {
    await db.delete(streams).where(eq(streams.id, id));
  }

  // Comment operations
  async createComment(comment: InsertComment): Promise<Comment> {
    const [createdComment] = await db.insert(comments).values(comment).returning();
    return createdComment as Comment;
  }

  async getCommentsByVideo(videoId: string): Promise<any[]> {
    const result = await db
      .select({
        id: comments.id,
        videoId: comments.videoId,
        userId: comments.userId,
        content: comments.content,
        createdAt: comments.createdAt,
        user: {
          id: users.id,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.videoId, videoId))
      .orderBy(desc(comments.createdAt));
    return Array.isArray(result) ? result : [];
  }

  async deleteComment(id: string): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  // Chat operations
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [createdMessage] = await db.insert(chatMessages).values(message).returning();
    return createdMessage;
  }

  async getChatMessagesByStream(streamId: string, limit = 50): Promise<any[]> {
    const result = await db
      .select({
        id: chatMessages.id,
        streamId: chatMessages.streamId,
        userId: chatMessages.userId,
        message: chatMessages.message,
        createdAt: chatMessages.createdAt,
        user: {
          id: users.id,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.userId, users.id))
      .where(eq(chatMessages.streamId, streamId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
    return Array.isArray(result) ? result : [];
  }

  // Video likes operations
  async toggleVideoLike(like: InsertVideoLike): Promise<VideoLike | null> {
    // Check if user already liked/disliked this video
    const [existing] = await db
      .select()
      .from(videoLikes)
      .where(and(eq(videoLikes.videoId, like.videoId), eq(videoLikes.userId, like.userId)));

    if (existing) {
      if (existing.isLike === like.isLike) {
        // Remove the like/dislike if it's the same
        await db.delete(videoLikes).where(eq(videoLikes.id, existing.id));
        return null;
      } else {
        // Update the like/dislike if it's different
        const [updated] = await db
          .update(videoLikes)
          .set({ isLike: like.isLike })
          .where(eq(videoLikes.id, existing.id))
          .returning();
        return updated;
      }
    } else {
      // Create new like/dislike
      const [created] = await db.insert(videoLikes).values(like).returning();
      return created;
    }
  }

  async getVideoLikes(videoId: string): Promise<{ likes: number; dislikes: number }> {
    const likesResult = await db
      .select({ count: count() })
      .from(videoLikes)
      .where(and(eq(videoLikes.videoId, videoId), eq(videoLikes.isLike, true)));

    const dislikesResult = await db
      .select({ count: count() })
      .from(videoLikes)
      .where(and(eq(videoLikes.videoId, videoId), eq(videoLikes.isLike, false)));

    return {
      likes: likesResult[0]?.count || 0,
      dislikes: dislikesResult[0]?.count || 0,
    };
  }

  // Follow operations
  async followUser(follow: InsertFollow): Promise<Follow> {
    const [created] = await db.insert(follows).values(follow).returning();
    return created;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
  }

  async getFollowing(userId: string): Promise<User[]> {
    const following = await db
      .select({ user: users })
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));

    return following.map(f => f.user);
  }

  async getFollowers(userId: string): Promise<User[]> {
    const followers = await db
      .select({ user: users })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));

    return followers.map(f => f.user);
  }
  
  // Enhanced Comment operations
  async createCommentWithParent(comment: InsertComment): Promise<Comment> {
    const [createdComment] = await db.insert(comments).values(comment).returning();
    return createdComment as Comment;
  }

  async getCommentReplies(commentId: string): Promise<Comment[]> {
    const result = await db
      .select()
      .from(comments)
      .where(eq(comments.parentId, commentId))
      .orderBy(comments.createdAt);
    return Array.isArray(result) ? result : [];
  }

  async toggleCommentLike(like: InsertCommentLike): Promise<CommentLike | null> {
    const existing = await db
      .select()
      .from(commentLikes)
      .where(and(
        eq(commentLikes.commentId, like.commentId),
        eq(commentLikes.userId, like.userId)
      ));

    if (existing.length > 0) {
      const existingLike = existing[0];
      if (existingLike.isLike === like.isLike) {
        // Remove like/dislike
        await db
          .delete(commentLikes)
          .where(eq(commentLikes.id, existingLike.id));
        return null;
      } else {
        // Toggle like/dislike
        const [updated] = await db
          .update(commentLikes)
          .set({ isLike: like.isLike })
          .where(eq(commentLikes.id, existingLike.id))
          .returning();
        return updated;
      }
    } else {
      // Create new like/dislike
      const [created] = await db.insert(commentLikes).values(like).returning();
      return created;
    }
  }

  async updateCommentCounts(commentId: string): Promise<void> {
    const likes = await db
      .select({ count: count() })
      .from(commentLikes)
      .where(and(
        eq(commentLikes.commentId, commentId),
        eq(commentLikes.isLike, true)
      ));

    const dislikes = await db
      .select({ count: count() })
      .from(commentLikes)
      .where(and(
        eq(commentLikes.commentId, commentId),
        eq(commentLikes.isLike, false)
      ));

    await db
      .update(comments)
      .set({
        likeCount: likes[0]?.count || 0,
        dislikeCount: dislikes[0]?.count || 0,
      })
      .where(eq(comments.id, commentId));
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    // Calculate revenue split (70% creator, 30% platform)
    const creatorAmount = Math.floor(payment.amount * 0.7);
    const platformAmount = payment.amount - creatorAmount;
    
    const [created] = await db.insert(payments).values({
      ...payment,
      creatorAmount,
      platformAmount,
    }).returning();
    return created;
  }

  async updatePaymentStatus(id: string, status: string, metadata?: any): Promise<Payment> {
    const [updated] = await db
      .update(payments)
      .set({ status, metadata, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async getPaymentsByStream(streamId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.streamId, streamId))
      .orderBy(desc(payments.createdAt));
  }

  // Superchat operations
  async createSuperchat(superchat: InsertSuperchat): Promise<Superchat> {
    const [created] = await db.insert(superchats).values(superchat).returning();
    return created;
  }

  async getSuperchats(streamId: string): Promise<any[]> {
    return await db
      .select({
        id: superchats.id,
        streamId: superchats.streamId,
        userId: superchats.userId,
        paymentId: superchats.paymentId,
        message: superchats.message,
        amount: superchats.amount,
        currency: superchats.currency,
        color: superchats.color,
        displayDuration: superchats.displayDuration,
        isPinned: superchats.isPinned,
        pinnedUntil: superchats.pinnedUntil,
        isProcessed: superchats.isProcessed,
        createdAt: superchats.createdAt,
        user: {
          id: users.id,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(superchats)
      .leftJoin(users, eq(superchats.userId, users.id))
      .where(eq(superchats.streamId, streamId))
      .orderBy(desc(superchats.createdAt));
  }

  async updateSuperchatPin(id: string, isPinned: boolean, pinnedUntil?: Date): Promise<void> {
    await db
      .update(superchats)
      .set({ isPinned, pinnedUntil })
      .where(eq(superchats.id, id));
  }

  // Video thumbnail operations
  async createVideoThumbnail(thumbnail: InsertVideoThumbnail): Promise<VideoThumbnail> {
    const [created] = await db.insert(videoThumbnails).values(thumbnail).returning();
    return created;
  }

  async getVideoThumbnails(videoId: string): Promise<VideoThumbnail[]> {
    return await db
      .select()
      .from(videoThumbnails)
      .where(eq(videoThumbnails.videoId, videoId))
      .orderBy(videoThumbnails.timecode);
  }

  async selectVideoThumbnail(videoId: string, thumbnailId: string): Promise<void> {
    // First, unselect all thumbnails for this video
    await db
      .update(videoThumbnails)
      .set({ isSelected: false })
      .where(eq(videoThumbnails.videoId, videoId));
    
    // Then select the chosen thumbnail
    await db
      .update(videoThumbnails)
      .set({ isSelected: true })
      .where(eq(videoThumbnails.id, thumbnailId));
    
    // Update the video's thumbnail URL
    const [selectedThumbnail] = await db
      .select()
      .from(videoThumbnails)
      .where(eq(videoThumbnails.id, thumbnailId));
    
    if (selectedThumbnail) {
      await db
        .update(videos)
        .set({ thumbnailUrl: selectedThumbnail.thumbnailUrl })
        .where(eq(videos.id, videoId));
    }
  }

  // Creator settings operations
  async createCreatorSettings(settings: InsertCreatorSettings): Promise<CreatorSettings> {
    const [created] = await db.insert(creatorSettings).values(settings).returning();
    return created;
  }

  async getCreatorSettings(userId: string): Promise<CreatorSettings | undefined> {
    const [settings] = await db
      .select()
      .from(creatorSettings)
      .where(eq(creatorSettings.userId, userId));
    return settings;
  }

  async updateCreatorSettings(userId: string, settings: Partial<CreatorSettings>): Promise<CreatorSettings> {
    const [updated] = await db
      .update(creatorSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(creatorSettings.userId, userId))
      .returning();
    return updated;
  }

  // Subscription operations
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [created] = await db.insert(subscriptions).values(subscription).returning();
    return created;
  }

  async getSubscription(userId: string, channelId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.channelId, channelId),
        eq(subscriptions.isActive, true)
      ));
    return subscription;
  }

  async cancelSubscription(userId: string, channelId: string): Promise<void> {
    await db
      .update(subscriptions)
      .set({ isActive: false, endDate: new Date() })
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.channelId, channelId)
      ));
  }

  // Copyright report operations
  async createCopyrightReport(report: InsertCopyrightReport): Promise<CopyrightReport> {
    const [created] = await db.insert(copyrightReports).values(report).returning();
    return created;
  }

  async getCopyrightReportsByUser(reporterId: string): Promise<CopyrightReport[]> {
    return await db
      .select()
      .from(copyrightReports)
      .where(eq(copyrightReports.reporterId, reporterId))
      .orderBy(desc(copyrightReports.createdAt));
  }

  async getCopyrightReportsByVideo(videoId: string): Promise<CopyrightReport[]> {
    return await db
      .select()
      .from(copyrightReports)
      .where(eq(copyrightReports.videoId, videoId))
      .orderBy(desc(copyrightReports.createdAt));
  }

  async updateCopyrightReportStatus(id: string, status: string, reviewerNotes?: string): Promise<void> {
    const updateData: any = { 
      status, 
      reviewedAt: new Date(),
      updatedAt: new Date()
    };
    if (reviewerNotes) {
      updateData.reviewerNotes = reviewerNotes;
    }
    await db
      .update(copyrightReports)
      .set(updateData)
      .where(eq(copyrightReports.id, id));
  }

  // Admin operations
  async getUserCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(users);
    return result.count;
  }

  async getActiveUserCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(users).where(eq(users.role, 'user'));
    return result.count;
  }

  async getBannedUserCount(): Promise<number> {
    // For now, return 0 since we don't have a banned field
    return 0;
  }

  async getVideoCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(videos);
    return result.count;
  }

  async getStreamCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(streams);
    return result.count;
  }

  async getTotalViews(): Promise<number> {
    const [result] = await db.select({ 
      total: sql<number>`COALESCE(SUM(${videos.viewCount}), 0)` 
    }).from(videos);
    return result.total;
  }

  async getTotalRevenue(): Promise<number> {
    const [result] = await db.select({ 
      total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` 
    }).from(payments);
    return result.total;
  }

  async getPendingReportCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(copyrightReports)
      .where(eq(copyrightReports.status, 'pending'));
    return result.count;
  }

  async getNewUsersToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [result] = await db.select({ count: count() }).from(users)
      .where(sql`${users.createdAt} >= ${today}`);
    return result.count;
  }

  async getNewVideosToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [result] = await db.select({ count: count() }).from(videos)
      .where(sql`${videos.createdAt} >= ${today}`);
    return result.count;
  }

  async getAdminUsers(filter?: string): Promise<any[]> {
    let query = db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      isActive: sql<boolean>`true`,
      createdAt: users.createdAt,
      videoCount: sql<number>`0`,
      totalViews: sql<number>`0`
    }).from(users);

    if (filter && filter !== 'all') {
      switch (filter) {
        case 'active':
          query = query.where(eq(users.role, 'user'));
          break;
        case 'banned':
          // No banned users implementation yet
          break;
        case 'creators':
          query = query.where(eq(users.role, 'creator'));
          break;
        case 'admins':
          query = query.where(eq(users.role, 'admin'));
          break;
      }
    }

    return await query.orderBy(desc(users.createdAt));
  }

  async getAdminVideos(filter?: string): Promise<any[]> {
    let query = db.select({
      id: videos.id,
      title: videos.title,
      userId: videos.userId,
      user: {
        username: users.username
      },
      viewCount: videos.viewCount,
      isPublic: videos.isPublic,
      createdAt: videos.createdAt,
      reportCount: sql<number>`0`
    }).from(videos)
    .leftJoin(users, eq(videos.userId, users.id));

    if (filter && filter !== 'all') {
      switch (filter) {
        case 'public':
          query = query.where(eq(videos.isPublic, true));
          break;
        case 'private':
          query = query.where(eq(videos.isPublic, false));
          break;
      }
    }

    return await query.orderBy(desc(videos.createdAt));
  }

  async getAdminReports(filter?: string): Promise<any[]> {
    let query = db.select({
      id: copyrightReports.id,
      type: sql<string>`'copyright'`,
      targetId: copyrightReports.videoId,
      reporterId: copyrightReports.reporterId,
      reason: copyrightReports.claimType,
      description: copyrightReports.description,
      status: copyrightReports.status,
      createdAt: copyrightReports.createdAt,
      reporter: {
        username: users.username
      }
    }).from(copyrightReports)
    .leftJoin(users, eq(copyrightReports.reporterId, users.id));

    if (filter && filter !== 'all') {
      query = query.where(eq(copyrightReports.status, filter));
    }

    return await query.orderBy(desc(copyrightReports.createdAt));
  }

  async updateUserAdminStatus(userId: string, action: string, reason?: string): Promise<void> {
    // For now, just update role or active status
    const updateData: any = {};
    
    switch (action) {
      case 'ban':
        // Would need to add banned fields to schema
        break;
      case 'unban':
        // Would need to add banned fields to schema
        break;
      case 'activate':
        // Could update a status field if we had one
        break;
      case 'deactivate':
        // Could update a status field if we had one
        break;
    }

    if (Object.keys(updateData).length > 0) {
      await db.update(users).set(updateData).where(eq(users.id, userId));
    }
  }

  async updateVideoAdminStatus(videoId: string, action: string): Promise<void> {
    const updateData: any = {};
    
    switch (action) {
      case 'hide':
        updateData.isPublic = false;
        break;
      case 'show':
        updateData.isPublic = true;
        break;
      case 'delete':
        await db.delete(videos).where(eq(videos.id, videoId));
        return;
    }

    if (Object.keys(updateData).length > 0) {
      await db.update(videos).set(updateData).where(eq(videos.id, videoId));
    }
  }

  async updateReportAdminStatus(reportId: string, status: string, note?: string): Promise<void> {
    const updateData: any = { 
      status,
      reviewedAt: new Date(),
      updatedAt: new Date()
    };
    
    if (note) {
      updateData.reviewerNotes = note;
    }

    await db.update(copyrightReports).set(updateData).where(eq(copyrightReports.id, reportId));
  }
}

export const storage = new DatabaseStorage();
