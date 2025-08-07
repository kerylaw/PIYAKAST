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
  type Subscription,
  type InsertSubscription,
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
  
  // Superchat operations
  createSuperchat(superchat: InsertSuperchat): Promise<Superchat>;
  getSuperchats(streamId: string): Promise<Superchat[]>;
  
  // Subscription operations
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscription(userId: string, channelId: string): Promise<Subscription | undefined>;
  cancelSubscription(userId: string, channelId: string): Promise<void>;
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
      .where(eq(streams.isLive, true))
      .orderBy(desc(streams.viewerCount));
  }

  async updateStreamStatus(id: string, isLive: boolean, viewerCount?: number): Promise<void> {
    const updateData: any = { isLive };
    if (viewerCount !== undefined) {
      updateData.viewerCount = viewerCount;
    }
    if (isLive) {
      updateData.startedAt = new Date();
    } else {
      updateData.endedAt = new Date();
    }

    await db.update(streams).set(updateData).where(eq(streams.id, id));
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
    return createdComment;
  }

  async getCommentsByVideo(videoId: string): Promise<any[]> {
    return await db
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
    return await db
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
    return createdComment;
  }

  async getCommentReplies(commentId: string): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.parentId, commentId))
      .orderBy(comments.createdAt);
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

  // Superchat operations
  async createSuperchat(superchat: InsertSuperchat): Promise<Superchat> {
    const [created] = await db.insert(superchats).values(superchat).returning();
    return created;
  }

  async getSuperchats(streamId: string): Promise<Superchat[]> {
    return await db
      .select()
      .from(superchats)
      .where(eq(superchats.streamId, streamId))
      .orderBy(desc(superchats.createdAt));
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
}

export const storage = new DatabaseStorage();
