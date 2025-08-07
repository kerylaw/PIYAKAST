import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertVideoSchema, 
  insertStreamSchema, 
  insertCommentSchema,
  insertChatMessageSchema,
  insertVideoLikeSchema,
  insertFollowSchema,
} from "@shared/schema";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, AVI, and MOV files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Video routes
  app.get('/api/videos', async (req, res) => {
    try {
      const videos = await storage.getPopularVideos();
      res.json(videos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  app.get('/api/videos/:id', async (req, res) => {
    try {
      const video = await storage.getVideo(req.params.id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Increment view count
      await storage.updateVideoViews(req.params.id);
      
      res.json(video);
    } catch (error) {
      console.error("Error fetching video:", error);
      res.status(500).json({ message: "Failed to fetch video" });
    }
  });

  app.post('/api/videos', isAuthenticated, upload.single('video'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const videoData = insertVideoSchema.parse({
        ...req.body,
        userId,
        videoUrl: req.file ? `/uploads/${req.file.filename}` : null,
      });

      const video = await storage.createVideo(videoData);
      res.status(201).json(video);
    } catch (error) {
      console.error("Error creating video:", error);
      res.status(500).json({ message: "Failed to create video" });
    }
  });

  app.get('/api/users/:userId/videos', async (req, res) => {
    try {
      const videos = await storage.getVideosByUser(req.params.userId);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching user videos:", error);
      res.status(500).json({ message: "Failed to fetch user videos" });
    }
  });

  // Stream routes
  app.get('/api/streams/live', async (req, res) => {
    try {
      const streams = await storage.getLiveStreams();
      res.json(streams);
    } catch (error) {
      console.error("Error fetching live streams:", error);
      res.status(500).json({ message: "Failed to fetch live streams" });
    }
  });

  app.get('/api/streams/:id', async (req, res) => {
    try {
      const stream = await storage.getStream(req.params.id);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      res.json(stream);
    } catch (error) {
      console.error("Error fetching stream:", error);
      res.status(500).json({ message: "Failed to fetch stream" });
    }
  });

  app.post('/api/streams', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const streamData = insertStreamSchema.parse({
        ...req.body,
        userId,
      });

      const stream = await storage.createStream(streamData);
      res.status(201).json(stream);
    } catch (error) {
      console.error("Error creating stream:", error);
      res.status(500).json({ message: "Failed to create stream" });
    }
  });

  // Create Cloudflare stream
  app.post('/api/streams/cloudflare', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, description, category } = req.body;
      
      const streamData = insertStreamSchema.parse({
        title,
        description: description || "",
        category: category || "General",
        userId,
      });

      const stream = await storage.createStream(streamData);

      // Generate mock Cloudflare RTMP credentials
      // In production, use actual Cloudflare Stream API
      const streamKey = `cf_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      const rtmpUrl = `rtmps://live.cloudflarestream.com/live/`;

      res.json({
        streamId: stream.id,
        streamKey,
        rtmpUrl,
        playbackUrl: `/stream/${stream.id}`,
      });
    } catch (error) {
      console.error("Error creating Cloudflare stream:", error);
      res.status(500).json({ message: "Failed to create Cloudflare stream" });
    }
  });

  app.patch('/api/streams/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { isLive, viewerCount } = req.body;
      await storage.updateStreamStatus(req.params.id, isLive, viewerCount);
      res.json({ message: "Stream status updated" });
    } catch (error) {
      console.error("Error updating stream status:", error);
      res.status(500).json({ message: "Failed to update stream status" });
    }
  });

  // Comment routes
  app.get('/api/videos/:videoId/comments', async (req, res) => {
    try {
      const comments = await storage.getCommentsByVideo(req.params.videoId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/videos/:videoId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commentData = insertCommentSchema.parse({
        videoId: req.params.videoId,
        userId,
        content: req.body.content,
      });

      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Video likes routes
  app.post('/api/videos/:videoId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const likeData = insertVideoLikeSchema.parse({
        videoId: req.params.videoId,
        userId,
        isLike: req.body.isLike,
      });

      const result = await storage.toggleVideoLike(likeData);
      res.json(result);
    } catch (error) {
      console.error("Error toggling video like:", error);
      res.status(500).json({ message: "Failed to toggle video like" });
    }
  });

  app.get('/api/videos/:videoId/likes', async (req, res) => {
    try {
      const likes = await storage.getVideoLikes(req.params.videoId);
      res.json(likes);
    } catch (error) {
      console.error("Error fetching video likes:", error);
      res.status(500).json({ message: "Failed to fetch video likes" });
    }
  });

  // Follow routes
  app.post('/api/users/:userId/follow', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.userId;

      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }

      const followData = insertFollowSchema.parse({
        followerId,
        followingId,
      });

      const follow = await storage.followUser(followData);
      res.status(201).json(follow);
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete('/api/users/:userId/follow', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.userId;

      await storage.unfollowUser(followerId, followingId);
      res.json({ message: "Unfollowed successfully" });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  app.get('/api/users/:userId/following', async (req, res) => {
    try {
      const following = await storage.getFollowing(req.params.userId);
      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  app.get('/api/users/:userId/followers', async (req, res) => {
    try {
      const followers = await storage.getFollowers(req.params.userId);
      res.json(followers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store active connections by stream ID
  const streamConnections = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');
    
    let currentStreamId: string | null = null;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'join_stream':
            // Join a stream room
            currentStreamId = data.streamId;
            if (currentStreamId && !streamConnections.has(currentStreamId)) {
              streamConnections.set(currentStreamId, new Set());
            }
            if (currentStreamId) {
              streamConnections.get(currentStreamId)!.add(ws);
            }
            
            // Send recent chat messages
            try {
              if (currentStreamId) {
                const recentMessages = await storage.getChatMessagesByStream(currentStreamId, 20);
                ws.send(JSON.stringify({
                  type: 'chat_history',
                  messages: recentMessages.reverse(),
                }));
              }
            } catch (error) {
              console.error('Error fetching chat history:', error);
            }
            break;

          case 'chat_message':
            if (currentStreamId && data.userId && data.message) {
              try {
                // Save message to database
                const chatMessage = await storage.createChatMessage({
                  streamId: currentStreamId,
                  userId: data.userId,
                  message: data.message,
                });

                // Broadcast to all clients in the stream
                const connections = streamConnections.get(currentStreamId);
                if (connections) {
                  const messageData = JSON.stringify({
                    type: 'new_message',
                    message: chatMessage,
                  });

                  connections.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                      client.send(messageData);
                    }
                  });
                }
              } catch (error) {
                console.error('Error saving chat message:', error);
              }
            }
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      // Remove connection from stream room
      if (currentStreamId && streamConnections.has(currentStreamId)) {
        streamConnections.get(currentStreamId)!.delete(ws);
        if (streamConnections.get(currentStreamId)!.size === 0) {
          streamConnections.delete(currentStreamId);
        }
      }
    });
  });

  return httpServer;
}
