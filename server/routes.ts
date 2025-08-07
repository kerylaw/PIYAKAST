import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { 
  insertVideoSchema, 
  insertStreamSchema, 
  insertCommentSchema,
  insertChatMessageSchema,
  insertVideoLikeSchema,
  insertFollowSchema,
  insertSuperchatSchema,
  insertCommentLikeSchema,
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
  setupAuth(app);

  // Auth routes are now handled in auth.ts

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

  app.post('/api/videos', requireAuth, upload.single('video'), async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.post('/api/streams', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
  app.post('/api/streams/cloudflare', requireAuth, async (req: any, res) => {
    try {
      console.log('🎥 Creating Cloudflare stream...', req.body);
      const userId = req.user.id;
      const { title, description, category } = req.body;
      
      const streamData = insertStreamSchema.parse({
        title,
        description: description || "",
        category: category || "General",
        userId,
      });

      const stream = await storage.createStream(streamData);
      console.log('✅ Database stream created:', stream.id);

      // Create actual Cloudflare Live Input
      if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID) {
        try {
          const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                meta: {
                  name: title
                },
                recording: {
                  mode: 'automatic',
                  timeoutSeconds: 10
                }
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Cloudflare Live Input created:', data);
            const liveInput = data.result;
            
            res.json({
              streamId: stream.id,
              streamKey: liveInput.uid,
              rtmpUrl: liveInput.rtmps.url,
              rtmpStreamKey: liveInput.rtmps.streamKey,
              playbackUrl: `/stream/${stream.id}`,
              cloudflareStreamId: liveInput.uid,
            });
          } else {
            const errorData = await response.json();
            console.error('❌ Cloudflare API Error Response:', errorData);
            throw new Error(`Failed to create Cloudflare Live Input: ${JSON.stringify(errorData)}`);
          }
        } catch (cloudflareError) {
          console.error("Cloudflare API Error:", cloudflareError);
          
          // Delete the created stream since Cloudflare failed
          try {
            await storage.deleteStream(stream.id);
          } catch (deleteError) {
            console.error("Failed to cleanup stream:", deleteError);
          }
          
          return res.status(400).json({ 
            message: "Cloudflare Stream service is not enabled",
            details: "Please enable Cloudflare Stream in your account dashboard first. Visit https://dash.cloudflare.com and navigate to Stream to activate the service.",
            error: cloudflareError instanceof Error ? cloudflareError.message : 'Unknown error'
          });
        }
      } else {
        return res.status(400).json({
          message: "Cloudflare API credentials not configured",
          details: "Please provide CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID to create live streams"
        });
      }
    } catch (error) {
      console.error("Error creating Cloudflare stream:", error);
      res.status(500).json({ message: "Failed to create Cloudflare stream" });
    }
  });

  app.patch('/api/streams/:id/status', requireAuth, async (req: any, res) => {
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

  app.post('/api/videos/:videoId/comments', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
  app.post('/api/videos/:videoId/like', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
  app.post('/api/users/:userId/follow', requireAuth, async (req: any, res) => {
    try {
      const followerId = req.user.id;
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

  app.delete('/api/users/:userId/follow', requireAuth, async (req: any, res) => {
    try {
      const followerId = req.user.id;
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
