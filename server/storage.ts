import {
  users,
  videos,
  streams,
  comments,
  chatMessages,
  videoLikes,
  follows,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;

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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
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

  async getPopularVideos(limit = 12): Promise<Video[]> {
    return await db
      .select()
      .from(videos)
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

  async getLiveStreams(): Promise<Stream[]> {
    return await db
      .select()
      .from(streams)
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

  // Comment operations
  async createComment(comment: InsertComment): Promise<Comment> {
    const [createdComment] = await db.insert(comments).values(comment).returning();
    return createdComment;
  }

  async getCommentsByVideo(videoId: string): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
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

  async getChatMessagesByStream(streamId: string, limit = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
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
}

export const storage = new DatabaseStorage();
