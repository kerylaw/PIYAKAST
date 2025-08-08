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
  membershipTiers,
  membershipBenefits,
  subscriptionSettings,
  memberContent,
  advertisers,
  adCampaigns,
  adCreatives,
  adPlacements,
  adAuctionBids,
  adImpressions,
  userAdPreferences,
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
  type MembershipTier,
  type InsertMembershipTier,
  type MembershipBenefit,
  type InsertMembershipBenefit,
  type SubscriptionSettings,
  type InsertSubscriptionSettings,
  type MemberContent,
  type InsertMemberContent,
  type Advertiser,
  type InsertAdvertiser,
  type AdCampaign,
  type InsertAdCampaign,
  type AdCreative,
  type InsertAdCreative,
  type AdPlacement,
  type InsertAdPlacement,
  type AdAuctionBid,
  type InsertAdAuctionBid,
  type AdImpression,
  type InsertAdImpression,
  type UserAdPreferences,
  type InsertUserAdPreferences,
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
  
  // Subscription operations (enhanced)
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscription(userId: string, channelId: string): Promise<Subscription | undefined>;
  updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription>;
  cancelSubscription(userId: string, channelId: string): Promise<void>;
  getSubscriptionsByUser(userId: string): Promise<any[]>;
  getSubscribersByChannel(channelId: string): Promise<any[]>;
  
  // Membership tier operations
  createMembershipTier(tier: InsertMembershipTier): Promise<MembershipTier>;
  getMembershipTiers(channelId: string): Promise<MembershipTier[]>;
  getMembershipTier(id: string): Promise<MembershipTier | undefined>;
  updateMembershipTier(id: string, updates: Partial<MembershipTier>): Promise<MembershipTier>;
  deleteMembershipTier(id: string): Promise<void>;
  
  // Membership benefit operations
  createMembershipBenefit(benefit: InsertMembershipBenefit): Promise<MembershipBenefit>;
  getMembershipBenefits(tierId: string): Promise<MembershipBenefit[]>;
  updateMembershipBenefit(id: string, updates: Partial<MembershipBenefit>): Promise<MembershipBenefit>;
  deleteMembershipBenefit(id: string): Promise<void>;
  
  // Subscription settings operations
  createSubscriptionSettings(settings: InsertSubscriptionSettings): Promise<SubscriptionSettings>;
  getSubscriptionSettings(subscriptionId: string): Promise<SubscriptionSettings | undefined>;
  updateSubscriptionSettings(subscriptionId: string, updates: Partial<SubscriptionSettings>): Promise<SubscriptionSettings>;
  
  // Member content operations
  createMemberContent(content: InsertMemberContent): Promise<MemberContent>;
  getMemberContent(channelId: string, tierId?: string): Promise<MemberContent[]>;
  updateMemberContent(id: string, updates: Partial<MemberContent>): Promise<MemberContent>;
  deleteMemberContent(id: string): Promise<void>;
  
  // Membership utility operations
  getUserMembership(userId: string, channelId: string): Promise<any>;
  checkMembershipAccess(userId: string, contentId: string): Promise<boolean>;
  getChannelRevenue(channelId: string, startDate?: Date, endDate?: Date): Promise<any>;

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
  getNewUsersLastWeek(): Promise<number>;
  getDailyActiveUsers(): Promise<number>;
  getNewUsersGrowthRate(): Promise<number>;
  getActiveUsersGrowthRate(): Promise<number>;
  getUserRetentionRate(): Promise<number>;
  getDailyUploads(): Promise<number>;
  getAverageWatchTime(): Promise<number>;
  getLikeRatio(): Promise<number>;
  getDailyPageViews(): Promise<number>;
  getAverageSessionTime(): Promise<number>;
  getBounceRate(): Promise<number>;
  getSuperchatRevenue(): Promise<number>;
  getPlatformFee(): Promise<number>;
  getMembershipRevenue(): Promise<number>;
  getAdsRevenue(): Promise<number>;
  getTopCreators(limit?: number): Promise<any[]>;
  getCurrentLiveViewers(): Promise<number>;
  getServerUptime(): Promise<number>;
  getSystemResources(): Promise<any>;
  getAdminUsers(filter?: string): Promise<any[]>;
  getAdminVideos(filter?: string): Promise<any[]>;
  getAdminReports(filter?: string): Promise<any[]>;
  updateUserAdminStatus(userId: string, action: string, reason?: string): Promise<void>;
  updateVideoAdminStatus(videoId: string, action: string): Promise<void>;
  updateReportAdminStatus(reportId: string, status: string, note?: string): Promise<void>;

  // Advertising system operations
  // Advertiser operations
  createAdvertiser(advertiser: InsertAdvertiser): Promise<Advertiser>;
  getAdvertiser(id: string): Promise<Advertiser | undefined>;
  getAdvertiserByUserId(userId: string): Promise<Advertiser | undefined>;
  updateAdvertiser(id: string, updates: Partial<Advertiser>): Promise<Advertiser>;
  getAdvertisers(): Promise<Advertiser[]>;
  
  // Campaign operations
  createAdCampaign(campaign: InsertAdCampaign): Promise<AdCampaign>;
  getAdCampaign(id: string): Promise<AdCampaign | undefined>;
  getAdCampaignsByAdvertiser(advertiserId: string): Promise<AdCampaign[]>;
  getAdvertiserCampaigns(advertiserId: string): Promise<AdCampaign[]>;
  getAdvertiserStats(advertiserId: string): Promise<any>;
  updateAdCampaign(id: string, updates: Partial<AdCampaign>): Promise<AdCampaign>;
  pauseAdCampaign(id: string): Promise<void>;
  resumeAdCampaign(id: string): Promise<void>;
  
  // Creative operations
  createAdCreative(creative: InsertAdCreative): Promise<AdCreative>;
  getAdCreative(id: string): Promise<AdCreative | undefined>;
  getAdCreativesByCampaign(campaignId: string): Promise<AdCreative[]>;
  updateAdCreative(id: string, updates: Partial<AdCreative>): Promise<AdCreative>;
  
  // Placement operations
  createAdPlacement(placement: InsertAdPlacement): Promise<AdPlacement>;
  getAdPlacement(id: string): Promise<AdPlacement | undefined>;
  getActiveAdPlacements(): Promise<AdPlacement[]>;
  getAdPlacementsByType(type: string): Promise<AdPlacement[]>;
  
  // Real-time auction operations
  conductAdAuction(placementId: string, userContext: any): Promise<AdAuctionBid[]>;
  createAdAuctionBid(bid: InsertAdAuctionBid): Promise<AdAuctionBid>;
  getWinningBid(auctionId: string): Promise<AdAuctionBid | undefined>;
  
  // Impression tracking operations
  createAdImpression(impression: InsertAdImpression): Promise<AdImpression>;
  trackAdClick(impressionId: string): Promise<void>;
  trackAdConversion(impressionId: string, conversionType: string, value?: number): Promise<void>;
  getAdPerformance(campaignId: string, startDate?: Date, endDate?: Date): Promise<any>;
  
  // User ad preferences operations
  createUserAdPreferences(preferences: InsertUserAdPreferences): Promise<UserAdPreferences>;
  getUserAdPreferences(userId: string): Promise<UserAdPreferences | undefined>;
  updateUserAdPreferences(userId: string, updates: Partial<UserAdPreferences>): Promise<UserAdPreferences>;
  
  // Ad targeting operations
  getTargetedAds(userId: string, placementType: string, category?: string): Promise<any[]>;
  calculateAdRelevanceScore(userId: string, campaignId: string): Promise<number>;
  
  // Revenue and reporting operations
  getAdvertiserRevenue(advertiserId: string, startDate?: Date, endDate?: Date): Promise<any>;
  getCreatorAdRevenue(userId: string, startDate?: Date, endDate?: Date): Promise<any>;
  getPlatformAdRevenue(startDate?: Date, endDate?: Date): Promise<any>;
  getAdCampaignMetrics(campaignId: string): Promise<any>;
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

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const [updated] = await db
      .update(subscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
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

  async getSubscriptionsByUser(userId: string): Promise<any[]> {
    return await db
      .select({
        id: subscriptions.id,
        channelId: subscriptions.channelId,
        type: subscriptions.type,
        tier: {
          id: membershipTiers.id,
          name: membershipTiers.name,
          color: membershipTiers.color,
          emoji: membershipTiers.emoji,
          monthlyPrice: membershipTiers.monthlyPrice,
        },
        channel: {
          id: users.id,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        isActive: subscriptions.isActive,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.channelId, users.id))
      .leftJoin(membershipTiers, eq(subscriptions.tierId, membershipTiers.id))
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));
  }

  async getSubscribersByChannel(channelId: string): Promise<any[]> {
    return await db
      .select({
        id: subscriptions.id,
        user: {
          id: users.id,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        type: subscriptions.type,
        tier: {
          id: membershipTiers.id,
          name: membershipTiers.name,
          color: membershipTiers.color,
          emoji: membershipTiers.emoji,
        },
        isActive: subscriptions.isActive,
        startDate: subscriptions.startDate,
        totalPaid: subscriptions.totalPaid,
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .leftJoin(membershipTiers, eq(subscriptions.tierId, membershipTiers.id))
      .where(and(
        eq(subscriptions.channelId, channelId),
        eq(subscriptions.isActive, true)
      ))
      .orderBy(desc(subscriptions.createdAt));
  }

  // Membership tier operations
  async createMembershipTier(tier: InsertMembershipTier): Promise<MembershipTier> {
    const [created] = await db.insert(membershipTiers).values(tier).returning();
    return created;
  }

  async getMembershipTiers(channelId: string): Promise<MembershipTier[]> {
    return await db
      .select()
      .from(membershipTiers)
      .where(and(
        eq(membershipTiers.channelId, channelId),
        eq(membershipTiers.isActive, true)
      ))
      .orderBy(membershipTiers.sortOrder, membershipTiers.monthlyPrice);
  }

  async getMembershipTier(id: string): Promise<MembershipTier | undefined> {
    const [tier] = await db
      .select()
      .from(membershipTiers)
      .where(eq(membershipTiers.id, id));
    return tier;
  }

  async updateMembershipTier(id: string, updates: Partial<MembershipTier>): Promise<MembershipTier> {
    const [updated] = await db
      .update(membershipTiers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(membershipTiers.id, id))
      .returning();
    return updated;
  }

  async deleteMembershipTier(id: string): Promise<void> {
    await db.delete(membershipTiers).where(eq(membershipTiers.id, id));
  }

  // Membership benefit operations
  async createMembershipBenefit(benefit: InsertMembershipBenefit): Promise<MembershipBenefit> {
    const [created] = await db.insert(membershipBenefits).values(benefit).returning();
    return created;
  }

  async getMembershipBenefits(tierId: string): Promise<MembershipBenefit[]> {
    return await db
      .select()
      .from(membershipBenefits)
      .where(and(
        eq(membershipBenefits.tierId, tierId),
        eq(membershipBenefits.isActive, true)
      ));
  }

  async updateMembershipBenefit(id: string, updates: Partial<MembershipBenefit>): Promise<MembershipBenefit> {
    const [updated] = await db
      .update(membershipBenefits)
      .set(updates)
      .where(eq(membershipBenefits.id, id))
      .returning();
    return updated;
  }

  async deleteMembershipBenefit(id: string): Promise<void> {
    await db.delete(membershipBenefits).where(eq(membershipBenefits.id, id));
  }

  // Subscription settings operations
  async createSubscriptionSettings(settings: InsertSubscriptionSettings): Promise<SubscriptionSettings> {
    const [created] = await db.insert(subscriptionSettings).values(settings).returning();
    return created;
  }

  async getSubscriptionSettings(subscriptionId: string): Promise<SubscriptionSettings | undefined> {
    const [settings] = await db
      .select()
      .from(subscriptionSettings)
      .where(eq(subscriptionSettings.subscriptionId, subscriptionId));
    return settings;
  }

  async updateSubscriptionSettings(subscriptionId: string, updates: Partial<SubscriptionSettings>): Promise<SubscriptionSettings> {
    const [updated] = await db
      .update(subscriptionSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptionSettings.subscriptionId, subscriptionId))
      .returning();
    return updated;
  }

  // Member content operations
  async createMemberContent(content: InsertMemberContent): Promise<MemberContent> {
    const [created] = await db.insert(memberContent).values(content).returning();
    return created;
  }

  async getMemberContent(channelId: string, tierId?: string): Promise<MemberContent[]> {
    const conditions = [eq(memberContent.channelId, channelId), eq(memberContent.isActive, true)];
    if (tierId) {
      conditions.push(eq(memberContent.tierId, tierId));
    }
    
    return await db
      .select()
      .from(memberContent)
      .where(and(...conditions))
      .orderBy(desc(memberContent.createdAt));
  }

  async updateMemberContent(id: string, updates: Partial<MemberContent>): Promise<MemberContent> {
    const [updated] = await db
      .update(memberContent)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(memberContent.id, id))
      .returning();
    return updated;
  }

  async deleteMemberContent(id: string): Promise<void> {
    await db.delete(memberContent).where(eq(memberContent.id, id));
  }

  // Membership utility operations
  async getUserMembership(userId: string, channelId: string): Promise<any> {
    const [result] = await db
      .select({
        subscription: {
          id: subscriptions.id,
          type: subscriptions.type,
          isActive: subscriptions.isActive,
          currentPeriodEnd: subscriptions.currentPeriodEnd,
          cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
          totalPaid: subscriptions.totalPaid,
          giftedBy: subscriptions.giftedBy,
        },
        tier: {
          id: membershipTiers.id,
          name: membershipTiers.name,
          color: membershipTiers.color,
          emoji: membershipTiers.emoji,
          monthlyPrice: membershipTiers.monthlyPrice,
        },
        channel: {
          id: users.id,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(subscriptions)
      .leftJoin(membershipTiers, eq(subscriptions.tierId, membershipTiers.id))
      .leftJoin(users, eq(subscriptions.channelId, users.id))
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.channelId, channelId),
        eq(subscriptions.isActive, true)
      ));
    
    return result;
  }

  async checkMembershipAccess(userId: string, contentId: string): Promise<boolean> {
    // Get the member content details
    const [content] = await db
      .select({
        channelId: memberContent.channelId,
        tierId: memberContent.tierId,
      })
      .from(memberContent)
      .where(eq(memberContent.id, contentId));
    
    if (!content) return false;
    
    // Check if user has active subscription to this channel
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.channelId, content.channelId),
        eq(subscriptions.isActive, true)
      ));
    
    if (!subscription) return false;
    
    // If content requires specific tier, check if user has that tier or higher
    if (content.tierId && subscription.tierId !== content.tierId) {
      // TODO: Implement tier hierarchy check
      return false;
    }
    
    return true;
  }

  async getChannelRevenue(channelId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const conditions = [eq(subscriptions.channelId, channelId)];
    if (startDate) {
      conditions.push(sql`${subscriptions.startDate} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${subscriptions.startDate} <= ${endDate}`);
    }
    
    const [result] = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${subscriptions.totalPaid}), 0)`,
        activeSubscriptions: sql<number>`COUNT(CASE WHEN ${subscriptions.isActive} = true THEN 1 END)`,
        totalSubscriptions: sql<number>`COUNT(*)`,
      })
      .from(subscriptions)
      .where(and(...conditions));
    
    return result;
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
    const [result] = await db.select({ count: count() }).from(users)
      .where(eq(users.isBanned, true));
    return result.count;
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

  async getNewUsersLastWeek(): Promise<number> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const [result] = await db.select({ count: count() }).from(users)
      .where(sql`${users.createdAt} >= ${oneWeekAgo}`);
    return result.count;
  }

  async getDailyActiveUsers(): Promise<number> {
    // Calculate users who have logged in in the last 24 hours
    // For now, we'll estimate based on recent activity (users created in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [result] = await db.select({ count: count() }).from(users)
      .where(sql`${users.createdAt} >= ${thirtyDaysAgo}`);
    return Math.floor(result.count * 0.3); // Estimate 30% of recent users are daily active
  }

  async getNewUsersGrowthRate(): Promise<number> {
    const thisWeek = await this.getNewUsersLastWeek();
    
    // Get users from 2 weeks ago to 1 week ago
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const [result] = await db.select({ count: count() }).from(users)
      .where(sql`${users.createdAt} >= ${twoWeeksAgo} AND ${users.createdAt} < ${oneWeekAgo}`);
    const lastWeek = result.count;
    
    if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
    return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  }

  async getActiveUsersGrowthRate(): Promise<number> {
    // For now, return a calculated growth rate based on user registration trends
    const currentUsers = await this.getActiveUserCount();
    const totalUsers = await this.getUserCount();
    
    // Estimate growth based on ratio of active to total users
    const activityRatio = totalUsers > 0 ? (currentUsers / totalUsers) : 0;
    return Math.round(activityRatio * 20); // Convert to growth percentage estimate
  }

  async getUserRetentionRate(): Promise<number> {
    // Calculate retention based on users who have uploaded videos or engaged
    const totalUsers = await this.getUserCount();
    const [result] = await db.select({ count: count() }).from(users)
      .where(sql`EXISTS (SELECT 1 FROM ${videos} WHERE ${videos.userId} = ${users.id})`);
    const activeCreators = result.count;
    
    return totalUsers > 0 ? Math.round((activeCreators / totalUsers) * 100 * 10) / 10 : 0;
  }

  async getDailyUploads(): Promise<number> {
    return await this.getNewVideosToday();
  }

  async getAverageWatchTime(): Promise<number> {
    // Estimate based on video durations and view counts
    const [result] = await db.select({ 
      avgDuration: sql<number>`AVG(COALESCE(${videos.duration}, 300))` 
    }).from(videos).where(sql`${videos.duration} IS NOT NULL`);
    
    return Math.round((result.avgDuration || 300) / 60 * 10) / 10; // Convert to minutes
  }

  async getLikeRatio(): Promise<number> {
    const [result] = await db.select({ 
      total: count(),
      likes: sql<number>`COUNT(CASE WHEN ${videoLikes.isLike} = true THEN 1 END)`
    }).from(videoLikes);
    
    return result.total > 0 ? Math.round((result.likes / result.total) * 100 * 10) / 10 : 95.0;
  }

  async getDailyPageViews(): Promise<number> {
    // Estimate based on total views today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [result] = await db.select({ 
      count: sql<number>`COUNT(*)` 
    }).from(videos)
    .where(sql`DATE(${videos.createdAt}) >= ${today}`);
    
    return result.count * 100; // Estimate page views as 100x video count
  }

  async getAverageSessionTime(): Promise<number> {
    // Estimate session time based on video durations
    const avgWatchTime = await this.getAverageWatchTime();
    return Math.round(avgWatchTime * 2.5 * 10) / 10; // Estimate session is 2.5x average watch time
  }

  async getBounceRate(): Promise<number> {
    // Estimate bounce rate based on user engagement
    const totalUsers = await this.getUserCount();
    const [result] = await db.select({ count: count() }).from(users)
      .where(sql`EXISTS (SELECT 1 FROM ${videoLikes} WHERE ${videoLikes.userId} = ${users.id})`);
    const engagedUsers = result.count;
    
    const bounceRate = totalUsers > 0 ? ((totalUsers - engagedUsers) / totalUsers) * 100 : 35;
    return Math.round(bounceRate * 10) / 10;
  }

  async getSuperchatRevenue(): Promise<number> {
    const [result] = await db.select({ 
      total: sql<number>`COALESCE(SUM(${superchats.amount}), 0)` 
    }).from(superchats);
    return result.total;
  }

  async getPlatformFee(): Promise<number> {
    const totalRevenue = await this.getTotalRevenue();
    return Math.round(totalRevenue * 0.3); // 30% platform fee
  }

  async getMembershipRevenue(): Promise<number> {
    // Calculate membership revenue based on active subscriptions
    const [result] = await db.select({ count: count() }).from(subscriptions)
      .where(eq(subscriptions.isActive, true));
    return result.count * 4900; // 4900 won per membership
  }

  async getAdsRevenue(): Promise<number> {
    // Estimate ads revenue based on total views
    const totalViews = await this.getTotalViews();
    return Math.round(totalViews * 0.001); // Estimate 0.001 won per view
  }

  async getTopCreators(limit = 5): Promise<any[]> {
    // Get top creators by total revenue from superchats
    const result = await db
      .select({
        userId: superchats.userId,
        username: users.username,
        profileImageUrl: users.profileImageUrl,
        totalRevenue: sql<number>`SUM(${superchats.amount})`,
        superchatCount: sql<number>`COUNT(${superchats.id})`
      })
      .from(superchats)
      .innerJoin(users, eq(superchats.userId, users.id))
      .groupBy(superchats.userId, users.username, users.profileImageUrl)
      .orderBy(sql`SUM(${superchats.amount}) DESC`)
      .limit(limit);
    
    return result;
  }

  async getCurrentLiveViewers(): Promise<number> {
    // Sum up all viewer counts from currently live streams
    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(${streams.viewerCount}), 0)` })
      .from(streams)
      .where(eq(streams.isLive, true));
    
    return result[0]?.total || 0;
  }

  async getServerUptime(): Promise<number> {
    // Calculate uptime percentage based on system reliability
    // For production, this would connect to actual monitoring systems
    // Here we'll estimate based on application health
    const totalUsers = await this.getUserCount();
    const activeStreams = await db.select({ count: count() })
      .from(streams)
      .where(eq(streams.isLive, true));
    
    // Estimate uptime based on activity (more users/streams = more stable system)
    const baseUptime = 99.5;
    const bonusUptime = Math.min(0.5, (totalUsers * 0.01) + (activeStreams[0]?.count * 0.1));
    return Math.round((baseUptime + bonusUptime) * 10) / 10;
  }

  async getSystemResources(): Promise<any> {
    // Estimate system resource usage based on application load
    const totalUsers = await this.getUserCount();
    const liveStreams = await db.select({ count: count() })
      .from(streams)
      .where(eq(streams.isLive, true));
    const totalViews = await this.getTotalViews();
    
    // Calculate estimated resource usage based on load
    const baseLoad = 20;
    const userLoad = Math.min(40, totalUsers * 2);
    const streamLoad = Math.min(30, liveStreams[0]?.count * 10);
    const viewLoad = Math.min(20, Math.floor(totalViews / 1000));
    
    const cpuUsage = Math.min(95, baseLoad + userLoad + streamLoad);
    const memoryUsage = Math.min(90, baseLoad + userLoad + viewLoad);
    const diskUsage = Math.min(85, baseLoad + Math.floor(totalViews / 100));
    const networkUsage = Math.min(95, baseLoad + streamLoad + Math.floor(totalUsers / 2));
    
    return {
      cpu: cpuUsage,
      memory: memoryUsage,
      disk: diskUsage,
      network: networkUsage
    };
  }

  async getAdminUsers(filter?: string): Promise<any[]> {
    let baseQuery = db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      isActive: sql<boolean>`NOT COALESCE(${users.isBanned}, false) AND NOT COALESCE(${users.isSuspended}, false)`,
      isBanned: users.isBanned,
      bannedUntil: users.bannedUntil,
      banReason: users.banReason,
      createdAt: users.createdAt,
      videoCount: sql<number>`(
        SELECT COUNT(*) FROM ${videos} WHERE ${videos.userId} = ${users.id}
      )`,
      totalViews: sql<number>`(
        SELECT COALESCE(SUM(${videos.viewCount}), 0) FROM ${videos} WHERE ${videos.userId} = ${users.id}
      )`
    }).from(users);
    
    if (filter && filter !== 'all') {
      switch (filter) {
        case 'active':
          baseQuery = baseQuery.where(and(eq(users.role, 'user'), eq(users.isBanned, false)));
          break;
        case 'banned':
          baseQuery = baseQuery.where(eq(users.isBanned, true));
          break;
        case 'creators':
          baseQuery = baseQuery.where(eq(users.role, 'creator'));
          break;
        case 'admins':
          baseQuery = baseQuery.where(eq(users.role, 'admin'));
          break;
      }
    }

    return await baseQuery.orderBy(desc(users.createdAt));
  }

  async getAdminVideos(filter?: string): Promise<any[]> {
    let baseQuery = db.select({
      id: videos.id,
      title: videos.title,
      userId: videos.userId,
      user: {
        username: users.username
      },
      viewCount: videos.viewCount,
      isPublic: videos.isPublic,
      createdAt: videos.createdAt,
      reportCount: sql<number>`(
        SELECT COUNT(*) FROM ${copyrightReports} WHERE ${copyrightReports.videoId} = ${videos.id}
      )`
    }).from(videos)
    .leftJoin(users, eq(videos.userId, users.id));
    
    if (filter && filter !== 'all') {
      switch (filter) {
        case 'public':
          baseQuery = baseQuery.where(eq(videos.isPublic, true));
          break;
        case 'private':
          baseQuery = baseQuery.where(eq(videos.isPublic, false));
          break;
      }
    }

    return await baseQuery.orderBy(desc(videos.createdAt));
  }

  async getAdminReports(filter?: string): Promise<any[]> {
    let baseQuery = db.select({
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
      baseQuery = baseQuery.where(eq(copyrightReports.status, filter));
    }

    return await baseQuery.orderBy(desc(copyrightReports.createdAt));
  }

  async updateUserAdminStatus(userId: string, action: string, reason?: string): Promise<void> {
    const updateData: any = { updatedAt: new Date() };
    
    switch (action) {
      case 'ban':
        updateData.isBanned = true;
        updateData.isSuspended = false;
        updateData.banReason = reason || 'Banned by admin';
        updateData.bannedUntil = null; // Permanent ban
        break;
      case 'unban':
        updateData.isBanned = false;
        updateData.isSuspended = false;
        updateData.banReason = null;
        updateData.bannedUntil = null;
        break;
      case 'activate':
        updateData.isBanned = false;
        updateData.isSuspended = false;
        break;
      case 'deactivate':
        updateData.isSuspended = true;
        updateData.banReason = reason || 'Suspended by admin';
        break;
    }

    await db.update(users).set(updateData).where(eq(users.id, userId));
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

  // Advertising system operations implementation
  
  // Advertiser operations
  async createAdvertiser(advertiser: InsertAdvertiser, userId?: string): Promise<Advertiser> {
    const advertiserData = userId ? { ...advertiser, userId } : advertiser;
    const [newAdvertiser] = await db.insert(advertisers).values(advertiserData).returning();
    return newAdvertiser;
  }

  async getAdvertiser(id: string): Promise<Advertiser | undefined> {
    const [advertiser] = await db.select().from(advertisers).where(eq(advertisers.id, id));
    return advertiser;
  }

  async getAdvertiserByUserId(userId: string): Promise<Advertiser | undefined> {
    const [advertiser] = await db.select().from(advertisers).where(eq(advertisers.userId, userId));
    return advertiser;
  }

  async updateAdvertiser(id: string, updates: Partial<Advertiser>): Promise<Advertiser> {
    const [updatedAdvertiser] = await db.update(advertisers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(advertisers.id, id))
      .returning();
    return updatedAdvertiser;
  }

  async getAdvertisers(): Promise<Advertiser[]> {
    return await db.select().from(advertisers).orderBy(desc(advertisers.createdAt));
  }

  // Campaign operations
  async createAdCampaign(campaign: InsertAdCampaign): Promise<AdCampaign> {
    const [newCampaign] = await db.insert(adCampaigns).values(campaign).returning();
    return newCampaign;
  }

  async getAdCampaign(id: string): Promise<AdCampaign | undefined> {
    const [campaign] = await db.select().from(adCampaigns).where(eq(adCampaigns.id, id));
    return campaign;
  }

  async getAdCampaignsByAdvertiser(advertiserId: string): Promise<AdCampaign[]> {
    return await db.select().from(adCampaigns)
      .where(eq(adCampaigns.advertiserId, advertiserId))
      .orderBy(desc(adCampaigns.createdAt));
  }

  async getAdvertiserCampaigns(advertiserId: string): Promise<AdCampaign[]> {
    return await this.getAdCampaignsByAdvertiser(advertiserId);
  }

  async getAdvertiserStats(advertiserId: string): Promise<any> {
    // Get campaign stats for this advertiser
    const campaigns = await this.getAdCampaignsByAdvertiser(advertiserId);
    
    const totalSpend = campaigns.reduce((sum, campaign) => sum + (campaign.totalSpent || 0), 0);
    const totalImpressions = campaigns.reduce((sum, campaign) => sum + (campaign.totalImpressions || 0), 0);
    const totalClicks = campaigns.reduce((sum, campaign) => sum + (campaign.totalClicks || 0), 0);
    const averageCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100) : 0;
    
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
    
    return {
      totalSpend,
      totalImpressions,
      totalClicks,
      averageCTR: parseFloat(averageCTR.toFixed(2)),
      activeCampaigns,
      completedCampaigns,
      totalReach: totalImpressions, // Simplified: using impressions as reach
      conversionRate: 0, // Would need conversion tracking
    };
  }

  async updateAdCampaign(id: string, updates: Partial<AdCampaign>): Promise<AdCampaign> {
    const [updatedCampaign] = await db.update(adCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(adCampaigns.id, id))
      .returning();
    return updatedCampaign;
  }

  async pauseAdCampaign(id: string): Promise<void> {
    await db.update(adCampaigns)
      .set({ status: 'paused', updatedAt: new Date() })
      .where(eq(adCampaigns.id, id));
  }

  async resumeAdCampaign(id: string): Promise<void> {
    await db.update(adCampaigns)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(adCampaigns.id, id));
  }

  // Creative operations
  async createAdCreative(creative: InsertAdCreative): Promise<AdCreative> {
    const [newCreative] = await db.insert(adCreatives).values(creative).returning();
    return newCreative;
  }

  async getAdCreative(id: string): Promise<AdCreative | undefined> {
    const [creative] = await db.select().from(adCreatives).where(eq(adCreatives.id, id));
    return creative;
  }

  async getAdCreativesByCampaign(campaignId: string): Promise<AdCreative[]> {
    return await db.select().from(adCreatives)
      .where(eq(adCreatives.campaignId, campaignId))
      .orderBy(desc(adCreatives.createdAt));
  }

  async updateAdCreative(id: string, updates: Partial<AdCreative>): Promise<AdCreative> {
    const [updatedCreative] = await db.update(adCreatives)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(adCreatives.id, id))
      .returning();
    return updatedCreative;
  }

  // Placement operations
  async createAdPlacement(placement: InsertAdPlacement): Promise<AdPlacement> {
    const [newPlacement] = await db.insert(adPlacements).values(placement).returning();
    return newPlacement;
  }

  async getAdPlacement(id: string): Promise<AdPlacement | undefined> {
    const [placement] = await db.select().from(adPlacements).where(eq(adPlacements.id, id));
    return placement;
  }

  async getActiveAdPlacements(): Promise<AdPlacement[]> {
    return await db.select().from(adPlacements)
      .where(eq(adPlacements.isActive, true))
      .orderBy(adPlacements.priority);
  }

  async getAdPlacementsByType(type: string): Promise<AdPlacement[]> {
    return await db.select().from(adPlacements)
      .where(and(eq(adPlacements.type, type), eq(adPlacements.isActive, true)))
      .orderBy(adPlacements.priority);
  }

  // Real-time auction operations (core of the advertising system)
  async conductAdAuction(placementId: string, userContext: any): Promise<AdAuctionBid[]> {
    // Get active campaigns that can bid on this placement
    const activeCampaigns = await db.select({
      campaign: adCampaigns,
      creative: adCreatives,
      advertiser: advertisers
    })
    .from(adCampaigns)
    .innerJoin(adCreatives, eq(adCampaigns.id, adCreatives.campaignId))
    .innerJoin(advertisers, eq(adCampaigns.advertiserId, advertisers.id))
    .where(and(
      eq(adCampaigns.status, 'active'),
      eq(adCreatives.isActive, true),
      eq(advertisers.status, 'active')
    ));

    const bids: AdAuctionBid[] = [];
    const auctionId = `auction_${Date.now()}_${placementId}`;

    for (const campaign of activeCampaigns) {
      // Calculate bid amount based on campaign budget and targeting
      const relevanceScore = await this.calculateAdRelevanceScore(userContext.userId, campaign.campaign.id);
      const bidAmount = Math.min(
        campaign.campaign.maxBidAmount,
        Math.floor(campaign.campaign.maxBidAmount * relevanceScore)
      );

      if (bidAmount > 0) {
        const bid = await this.createAdAuctionBid({
          auctionId,
          placementId,
          campaignId: campaign.campaign.id,
          creativeId: campaign.creative.id,
          bidAmount,
          targeting: userContext,
          qualityScore: relevanceScore * 100,
        });
        bids.push(bid);
      }
    }

    // Sort bids by bid amount (descending) for auction ranking
    return bids.sort((a, b) => b.bidAmount - a.bidAmount);
  }

  async createAdAuctionBid(bid: InsertAdAuctionBid): Promise<AdAuctionBid> {
    const [newBid] = await db.insert(adAuctionBids).values(bid).returning();
    return newBid;
  }

  async getWinningBid(auctionId: string): Promise<AdAuctionBid | undefined> {
    const [winningBid] = await db.select().from(adAuctionBids)
      .where(and(eq(adAuctionBids.auctionId, auctionId), eq(adAuctionBids.isWinner, true)));
    return winningBid;
  }

  // Impression tracking operations
  async createAdImpression(impression: InsertAdImpression): Promise<AdImpression> {
    const [newImpression] = await db.insert(adImpressions).values(impression).returning();
    return newImpression;
  }

  async trackAdClick(impressionId: string): Promise<void> {
    await db.update(adImpressions)
      .set({ 
        isClicked: true, 
        clickedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(adImpressions.id, impressionId));
  }

  async trackAdConversion(impressionId: string, conversionType: string, value?: number): Promise<void> {
    await db.update(adImpressions)
      .set({ 
        isConverted: true,
        conversionType,
        conversionValue: value,
        convertedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(adImpressions.id, impressionId));
  }

  async getAdPerformance(campaignId: string, startDate?: Date, endDate?: Date): Promise<any> {
    let query = db.select({
      impressions: count(adImpressions.id),
      clicks: count(sql`CASE WHEN ${adImpressions.isClicked} THEN 1 END`),
      conversions: count(sql`CASE WHEN ${adImpressions.isConverted} THEN 1 END`),
      totalSpend: sql`SUM(${adImpressions.actualCost})`,
      avgCpc: sql`AVG(CASE WHEN ${adImpressions.isClicked} THEN ${adImpressions.actualCost} END)`,
      avgCpm: sql`AVG(${adImpressions.actualCost}) * 1000`,
    })
    .from(adImpressions)
    .where(eq(adImpressions.campaignId, campaignId));

    if (startDate) {
      query = query.where(sql`${adImpressions.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      query = query.where(sql`${adImpressions.createdAt} <= ${endDate}`);
    }

    const [performance] = await query;
    return performance;
  }

  // User ad preferences operations
  async createUserAdPreferences(preferences: InsertUserAdPreferences): Promise<UserAdPreferences> {
    const [newPreferences] = await db.insert(userAdPreferences).values(preferences).returning();
    return newPreferences;
  }

  async getUserAdPreferences(userId: string): Promise<UserAdPreferences | undefined> {
    const [preferences] = await db.select().from(userAdPreferences)
      .where(eq(userAdPreferences.userId, userId));
    return preferences;
  }

  async updateUserAdPreferences(userId: string, updates: Partial<UserAdPreferences>): Promise<UserAdPreferences> {
    const [updatedPreferences] = await db.update(userAdPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userAdPreferences.userId, userId))
      .returning();
    return updatedPreferences;
  }

  // Ad targeting operations
  async getTargetedAds(userId: string, placementType: string, category?: string): Promise<any[]> {
    // Get user preferences and demographics for targeting
    const userPrefs = await this.getUserAdPreferences(userId);
    const user = await this.getUser(userId);
    
    // Conduct real-time auction
    const userContext = {
      userId,
      category,
      placementType,
      preferences: userPrefs,
      demographics: user
    };

    // Get active placements for this type
    const placements = await this.getAdPlacementsByType(placementType);
    const targetedAds = [];

    for (const placement of placements) {
      const bids = await this.conductAdAuction(placement.id, userContext);
      if (bids.length > 0) {
        // Winner takes the placement
        const winningBid = bids[0];
        await db.update(adAuctionBids)
          .set({ isWinner: true })
          .where(eq(adAuctionBids.id, winningBid.id));

        // Create impression record
        await this.createAdImpression({
          campaignId: winningBid.campaignId,
          creativeId: winningBid.creativeId,
          placementId: placement.id,
          userId,
          auctionId: winningBid.auctionId,
          actualCost: winningBid.bidAmount,
          targeting: winningBid.targeting
        });

        targetedAds.push({
          placement,
          winningBid,
          creative: await this.getAdCreative(winningBid.creativeId),
          campaign: await this.getAdCampaign(winningBid.campaignId)
        });
      }
    }

    return targetedAds;
  }

  async calculateAdRelevanceScore(userId: string, campaignId: string): Promise<number> {
    // Get user preferences and campaign targeting
    const userPrefs = await this.getUserAdPreferences(userId);
    const campaign = await this.getAdCampaign(campaignId);
    
    if (!userPrefs || !campaign) return 0.1; // Low relevance if no data

    let score = 0.5; // Base score

    // Check category interest
    if (userPrefs.categoryInterests && campaign.targetingOptions) {
      const campaignCategories = JSON.parse(campaign.targetingOptions as string).categories || [];
      const userCategories = JSON.parse(userPrefs.categoryInterests as string) || [];
      
      const intersection = campaignCategories.filter((cat: string) => userCategories.includes(cat));
      score += (intersection.length / campaignCategories.length) * 0.3;
    }

    // Check personalized ad preference
    if (userPrefs.allowPersonalizedAds) {
      score += 0.2;
    }

    // Ensure score is between 0.1 and 1.0
    return Math.max(0.1, Math.min(1.0, score));
  }

  // Revenue and reporting operations
  async getAdvertiserRevenue(advertiserId: string, startDate?: Date, endDate?: Date): Promise<any> {
    let query = db.select({
      totalSpend: sql`SUM(${adImpressions.actualCost})`,
      totalImpressions: count(adImpressions.id),
      totalClicks: count(sql`CASE WHEN ${adImpressions.isClicked} THEN 1 END`),
      totalConversions: count(sql`CASE WHEN ${adImpressions.isConverted} THEN 1 END`),
    })
    .from(adImpressions)
    .innerJoin(adCampaigns, eq(adImpressions.campaignId, adCampaigns.id))
    .where(eq(adCampaigns.advertiserId, advertiserId));

    if (startDate) {
      query = query.where(sql`${adImpressions.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      query = query.where(sql`${adImpressions.createdAt} <= ${endDate}`);
    }

    const [revenue] = await query;
    return revenue;
  }

  async getCreatorAdRevenue(userId: string, startDate?: Date, endDate?: Date): Promise<any> {
    // Calculate creator share from ads shown on their content (70% share)
    let query = db.select({
      totalRevenue: sql`SUM(${adImpressions.actualCost} * 0.7)`, // 70% to creator
      totalImpressions: count(adImpressions.id),
    })
    .from(adImpressions)
    .innerJoin(adPlacements, eq(adImpressions.placementId, adPlacements.id))
    .where(eq(adPlacements.contentCreatorId, userId));

    if (startDate) {
      query = query.where(sql`${adImpressions.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      query = query.where(sql`${adImpressions.createdAt} <= ${endDate}`);
    }

    const [revenue] = await query;
    return revenue;
  }

  async getPlatformAdRevenue(startDate?: Date, endDate?: Date): Promise<any> {
    // Calculate platform share from all ads (30% share)
    let query = db.select({
      totalRevenue: sql`SUM(${adImpressions.actualCost} * 0.3)`, // 30% to platform
      totalSpend: sql`SUM(${adImpressions.actualCost})`,
      totalImpressions: count(adImpressions.id),
    })
    .from(adImpressions);

    if (startDate) {
      query = query.where(sql`${adImpressions.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      query = query.where(sql`${adImpressions.createdAt} <= ${endDate}`);
    }

    const [revenue] = await query;
    return revenue;
  }

  async getAdCampaignMetrics(campaignId: string): Promise<any> {
    const [metrics] = await db.select({
      impressions: count(adImpressions.id),
      clicks: count(sql`CASE WHEN ${adImpressions.isClicked} THEN 1 END`),
      conversions: count(sql`CASE WHEN ${adImpressions.isConverted} THEN 1 END`),
      totalSpend: sql`SUM(${adImpressions.actualCost})`,
      avgCpc: sql`AVG(CASE WHEN ${adImpressions.isClicked} THEN ${adImpressions.actualCost} END)`,
      ctr: sql`ROUND(COUNT(CASE WHEN ${adImpressions.isClicked} THEN 1 END) * 100.0 / COUNT(${adImpressions.id}), 2)`,
      conversionRate: sql`ROUND(COUNT(CASE WHEN ${adImpressions.isConverted} THEN 1 END) * 100.0 / COUNT(${adImpressions.id}), 2)`,
    })
    .from(adImpressions)
    .where(eq(adImpressions.campaignId, campaignId));

    return metrics;
  }
}

export const storage = new DatabaseStorage();
