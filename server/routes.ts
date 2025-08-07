import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { recordStreamHeartbeat, removeStream } from "./streamMonitor";
import { setupAuth, requireAuth } from "./auth";

// Admin middleware
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
import { 
  insertVideoSchema, 
  insertStreamSchema, 
  insertCommentSchema,
  insertChatMessageSchema,
  insertVideoLikeSchema,
  insertFollowSchema,
  insertSuperchatSchema,
  insertCommentLikeSchema,
  insertPaymentSchema,
  insertVideoThumbnailSchema,
  insertCopyrightReportSchema,
  InsertCreatorSettings,
} from "@shared/schema";
import Stripe from "stripe";
import { spawn } from "child_process";
import { promisify } from "util";

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
}) : null;
import multer from "multer";
import path from "path";
import { initializePeerTube, getPeerTubeClient } from "./peertube";
import fs from "fs";
import { peertubeConfig, peertubeCategories, peertubePrivacy } from "./peertube-config";

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

  // Initialize PeerTube client
  console.log('🎬 Initializing PeerTube integration...');
  const peertubeClient = initializePeerTube(peertubeConfig);
  
  // Test connection and authenticate (background retry)
  console.log('🔍 Testing PeerTube connection...');
  let peertubeReady = false;
  
  const testPeerTubeConnection = async () => {
    try {
      const isConnected = await peertubeClient.testConnection();
      if (isConnected && !peertubeReady) {
        await peertubeClient.authenticate();
        console.log('✅ PeerTube integration ready');
        peertubeReady = true;
      }
      return isConnected;
    } catch (error: any) {
      return false;
    }
  };

  // 즉시 테스트
  const initialTest = await testPeerTubeConnection();
  if (!initialTest) {
    console.log('⚠️ Initial PeerTube connection failed - retrying in background');
    
    // 백그라운드에서 주기적으로 재시도
    const retryInterval = setInterval(async () => {
      const success = await testPeerTubeConnection();
      if (success) {
        clearInterval(retryInterval);
      }
    }, 10000); // 10초마다 재시도
    
    // 5분 후 재시도 중단
    setTimeout(() => {
      if (!peertubeReady) {
        clearInterval(retryInterval);
        console.log('📁 PeerTube connection timeout - using local storage permanently');
      }
    }, 300000);
  }
  
  // PeerTube 상태 확인 함수
  app.get('/api/peertube/status', async (req, res) => {
    try {
      const isConnected = await peertubeClient.testConnection();
      res.json({ connected: isConnected, ready: peertubeReady });
    } catch (error) {
      res.json({ connected: false, ready: false });
    }
  });

  // Auth routes are now handled in auth.ts

  // Check username availability
  app.get('/api/check-username/:username', async (req, res) => {
    try {
      const { username } = req.params;
      const existingUser = await storage.getUserByUsername(username);
      res.json({ available: !existingUser });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ message: "Failed to check username" });
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

  app.post('/api/videos', requireAuth, upload.single('video'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      if (!req.file) {
        return res.status(400).json({ message: "No video file provided" });
      }

      // Try to upload to PeerTube first
      let videoData: any = {
        title: req.body.title,
        description: req.body.description || '',
        category: req.body.category || 'Entertainment',
        userId,
        videoUrl: `/uploads/${req.file.filename}`, // fallback to local
        isPublic: req.body.isPublic === 'true',
        viewCount: 0,
      };

      try {
        const client = getPeerTubeClient();
        
        // Get user's channel (assuming first channel for now)
        const channels = await client.getChannels();
        const channelId = channels[0]?.id;
        
        if (!channelId) {
          throw new Error('No PeerTube channel found');
        }

        // Map category to PeerTube category
        const category = peertubeCategories[req.body.category as keyof typeof peertubeCategories] || 9; // default to Entertainment
        
        // Upload to PeerTube
        const peertubeVideo = await client.uploadVideo(req.file.path, {
          channelId,
          name: req.body.title,
          description: req.body.description || '',
          category,
          privacy: peertubePrivacy.PUBLIC,
          language: 'ko', // Korean
          nsfw: false,
          tags: req.body.category ? [req.body.category] : []
        });

        // Update video data with PeerTube information (only add fields that exist in schema)
        videoData = {
          ...videoData,
          videoUrl: peertubeVideo.embedUrl, // Use PeerTube embed URL
          thumbnailUrl: peertubeVideo.thumbnailUrl,
          duration: peertubeVideo.duration,
        };

        console.log('✅ Video uploaded to PeerTube:', peertubeVideo.name);
        
        // Clean up local file
        try {
          fs.unlinkSync(req.file.path);
        } catch (err: any) {
          console.warn('Failed to delete local file:', err);
        }
        
      } catch (peertubeError: any) {
        console.warn('⚠️ PeerTube upload failed, using local storage:', peertubeError.message);
        // Keep the local file path in videoUrl
      }

      const video = await storage.createVideo(videoData);
      res.status(201).json({ 
        videoId: video.id,
        message: "Video uploaded successfully",
        video 
      });
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

  // Get user's streams
  app.get('/api/streams/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const streams = await storage.getUserStreams(userId);
      res.json(streams);
    } catch (error) {
      console.error("Error fetching user streams:", error);
      res.status(500).json({ message: "Failed to fetch user streams" });
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
      
      // Try to create live stream in PeerTube
      let streamData: any = {
        ...req.body,
        userId,
        isLive: false, // 스트림 생성 시에는 준비 상태, 실제 방송 시작 시 true로 변경
        viewerCount: 0,
      };

      try {
        const client = getPeerTubeClient();
        
        // Get user's channel
        const channels = await client.getChannels();
        const channelId = channels[0]?.id;
        
        if (!channelId) {
          throw new Error('No PeerTube channel found');
        }

        // Map category to PeerTube category
        const category = peertubeCategories[req.body.category as keyof typeof peertubeCategories] || 9;
        
        // Create live stream in PeerTube
        const peertubeStream = await client.createLiveStream({
          channelId,
          name: req.body.title,
          description: req.body.description || '',
          category,
          privacy: peertubePrivacy.PUBLIC,
          permanentLive: true,
          saveReplay: true
        });

        // Update stream data with PeerTube information
        streamData = {
          ...streamData,
          peertubeId: peertubeStream.id,
          peertubeUuid: peertubeStream.uuid,
          peertubeEmbedUrl: peertubeStream.embedUrl,
          rtmpUrl: peertubeStream.rtmpUrl,
          streamKey: peertubeStream.streamKey,
          peertubeChannelId: channelId,
          permanentLive: peertubeStream.permanentLive,
          saveReplay: peertubeStream.saveReplay
        };

        console.log('✅ Live stream created in PeerTube:', peertubeStream.name);
        console.log('📺 RTMP URL:', peertubeStream.rtmpUrl);
        console.log('🔑 Stream Key:', peertubeStream.streamKey);
        
      } catch (peertubeError: any) {
        console.warn('⚠️ PeerTube stream creation failed:', peertubeError.message);
        // Continue with local stream creation
      }

      const stream = await storage.createStream(streamData);
      res.status(201).json(stream);
    } catch (error) {
      console.error("Error creating stream:", error);
      res.status(500).json({ message: "Failed to create stream" });
    }
  });

  // Start live stream
  app.post('/api/streams/:id/start', requireAuth, async (req: any, res) => {
    try {
      const streamId = req.params.id;
      const userId = req.user.id;
      
      const stream = await storage.getStream(streamId);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      
      if (stream.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      await storage.updateStreamStatus(streamId, true, 0);
      console.log(`🟢 Stream ${streamId} started by user ${userId}`);
      
      // Broadcast real-time update to all clients
      broadcastToAll({
        type: 'stream_started',
        streamId,
        timestamp: new Date().toISOString()
      });
      
      res.json({ message: "Stream started" });
    } catch (error) {
      console.error("Error starting stream:", error);
      res.status(500).json({ message: "Failed to start stream" });
    }
  });

  // Stop live stream
  app.post('/api/streams/:id/stop', requireAuth, async (req: any, res) => {
    try {
      const streamId = req.params.id;
      const userId = req.user.id;
      
      const stream = await storage.getStream(streamId);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      
      if (stream.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      await storage.updateStreamStatus(streamId, false);
      console.log(`🔴 Stream ${streamId} stopped by user ${userId}`);
      
      // Broadcast real-time update to all clients
      broadcastToAll({
        type: 'stream_stopped',
        streamId,
        timestamp: new Date().toISOString()
      });
      
      res.json({ message: "Stream stopped" });
    } catch (error) {
      console.error("Error stopping stream:", error);
      res.status(500).json({ message: "Failed to stop stream" });
    }
  });

  // Create Cloudflare stream (BACKUP - NOT USED)
  app.post('/api/streams/cloudflare', requireAuth, async (req: any, res) => {
    try {
      console.log('🎥 Creating Cloudflare stream...', req.body);
      const userId = req.user.id;
      const { title, description, category } = req.body;
      
      // 스트림 데이터 준비 (insertSchema 사용하지 않고 직접 구성)
      const streamData = {
        title,
        description: description || "",
        category: category || "General",
        userId,
        isLive: true, // 스트림 생성 시 바로 라이브 상태로 설정
        startedAt: new Date(),
        viewerCount: 0,
      };

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
          message: "Cloudflare Stream is disabled - Use PeerTube streaming instead",
          details: "This platform now uses PeerTube for decentralized live streaming. Please use the main stream creation endpoint."
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

  // Copyright report routes
  app.post('/api/videos/:videoId/copyright-report', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reportData = insertCopyrightReportSchema.parse({
        reporterId: userId,
        videoId: req.params.videoId,
        claimType: req.body.claimType,
        rightsOwnerType: req.body.rightsOwnerType,
        copyrightOwner: req.body.copyrightOwner,
        description: req.body.description,
        evidence: req.body.evidence,
        contactEmail: req.body.contactEmail,
      });

      const report = await storage.createCopyrightReport(reportData);
      res.status(201).json({
        message: "저작권 신고가 성공적으로 접수되었습니다.",
        reportId: report.id
      });
    } catch (error) {
      console.error("Error creating copyright report:", error);
      res.status(500).json({ message: "Failed to create copyright report" });
    }
  });

  app.get('/api/copyright/reports/user/:userId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const requestingUserId = req.user.id;
      
      // Only allow users to see their own reports
      if (userId !== requestingUserId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const reports = await storage.getCopyrightReportsByUser(userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching copyright reports:", error);
      res.status(500).json({ message: "Failed to fetch copyright reports" });
    }
  });

  app.get('/api/videos/:videoId/copyright-reports', requireAuth, async (req: any, res) => {
    try {
      const videoId = req.params.videoId;
      
      // Get the video to check ownership
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Only allow video owner to see reports on their video
      if (video.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const reports = await storage.getCopyrightReportsByVideo(videoId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching video copyright reports:", error);
      res.status(500).json({ message: "Failed to fetch video copyright reports" });
    }
  });

  app.patch('/api/copyright/reports/:reportId/status', requireAuth, async (req: any, res) => {
    try {
      const { reportId } = req.params;
      const { status, reviewerNotes } = req.body;
      
      // Only admin users should be able to update report status
      // For now, we'll allow any authenticated user (implement proper admin check later)
      
      await storage.updateCopyrightReportStatus(reportId, status, reviewerNotes);
      res.json({ message: "Report status updated successfully" });
    } catch (error) {
      console.error("Error updating copyright report status:", error);
      res.status(500).json({ message: "Failed to update report status" });
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

  // Studio Analytics Routes
  app.get('/api/analytics/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get user's videos for view analytics
      const userVideos = await storage.getVideosByUser(userId);
      const totalViews = userVideos.reduce((sum: number, video: any) => sum + (video.viewCount || 0), 0);
      
      // Get user's streams for live analytics
      const userStreams = await storage.getUserStreams(userId);
      const totalStreams = userStreams.length;
      const liveStreams = userStreams.filter((stream: any) => stream.isLive).length;
      
      // Get followers count
      const followers = await storage.getFollowers(userId);
      const followerCount = followers.length;
      
      // Calculate engagement metrics
      const totalVideos = userVideos.length;
      const averageViews = totalVideos > 0 ? Math.floor(totalViews / totalVideos) : 0;
      
      // Get recent activity (comments, likes)
      const recentComments = await Promise.all(
        userVideos.slice(0, 5).map(async (video: any) => {
          const comments = await storage.getCommentsByVideo(video.id);
          return comments.filter((comment: any) => {
            const commentDate = new Date(comment.createdAt);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return commentDate > weekAgo;
          }).length;
        })
      );
      const weeklyComments = recentComments.reduce((sum, count) => sum + count, 0);
      
      // Calculate growth metrics (mock calculation based on current data)
      const viewGrowth = Math.min(Math.max(Math.floor((totalViews / 1000) * 2), 1), 50); // 1-50%
      const subscriberGrowth = Math.min(Math.max(Math.floor((followerCount / 100) * 3), 1), 30); // 1-30%
      const watchTimeGrowth = Math.min(Math.max(Math.floor((totalViews / 500) * 1.5), 1), 40); // 1-40%
      
      // Audience demographics (realistic calculation based on total views)
      const demographics = {
        "18-24": Math.floor(25 + (totalViews % 20)), // 25-45%
        "25-34": Math.floor(30 + (totalViews % 25)), // 30-55%
        "35-44": Math.floor(15 + (totalViews % 15)), // 15-30%
        "45+": Math.floor(5 + (totalViews % 10))      // 5-15%
      };
      
      // Normalize to 100%
      const total = Object.values(demographics).reduce((sum, val) => sum + val, 0);
      Object.keys(demographics).forEach(key => {
        demographics[key as keyof typeof demographics] = Math.floor((demographics[key as keyof typeof demographics] / total) * 100);
      });
      
      // Performance metrics
      const averageViewDuration = Math.floor(120 + (totalViews % 180)); // 2-5 minutes
      const clickThroughRate = Math.floor(5 + (totalViews % 8)); // 5-13%
      const likeRatio = Math.floor(88 + (totalViews % 10)); // 88-98%
      const commentEngagement = Math.floor(2 + (weeklyComments % 6)); // 2-8%
      
      // Traffic sources (realistic distribution)
      const trafficSources = {
        search: Math.floor(35 + (totalViews % 20)), // 35-55%
        suggested: Math.floor(25 + (totalViews % 15)), // 25-40%
        external: Math.floor(10 + (totalViews % 10)), // 10-20%
        direct: Math.floor(5 + (totalViews % 15))     // 5-20%
      };
      
      // Normalize traffic sources to 100%
      const trafficTotal = Object.values(trafficSources).reduce((sum, val) => sum + val, 0);
      Object.keys(trafficSources).forEach(key => {
        trafficSources[key as keyof typeof trafficSources] = Math.floor((trafficSources[key as keyof typeof trafficSources] / trafficTotal) * 100);
      });
      
      res.json({
        totalViews,
        totalVideos,
        totalStreams,
        liveStreams,
        followerCount,
        averageViews,
        weeklyComments,
        growth: {
          views: viewGrowth,
          subscribers: subscriberGrowth,
          watchTime: watchTimeGrowth
        },
        demographics,
        performance: {
          averageViewDuration: `${Math.floor(averageViewDuration / 60)}:${(averageViewDuration % 60).toString().padStart(2, '0')}`,
          clickThroughRate: `${clickThroughRate}%`,
          likeRatio: `${likeRatio}%`,
          commentEngagement: `${commentEngagement}%`
        },
        trafficSources
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
  
  app.get('/api/revenue/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get completed payments for this user's streams
      const userStreams = await storage.getUserStreams(userId);
      const streamIds = userStreams.map((stream: any) => stream.id);
      
      let totalRevenue = 0;
      let superchatRevenue = 0;
      let membershipRevenue = 0;
      let otherRevenue = 0;
      let creatorShare = 0;
      let platformShare = 0;
      
      // Calculate revenue from superchats/payments
      for (const streamId of streamIds) {
        try {
          const payments = await storage.getPaymentsByStream?.(streamId) || [];
          const completedPayments = payments.filter((payment: any) => payment.status === 'completed');
          
          for (const payment of completedPayments) {
            totalRevenue += payment.amount || 0;
            creatorShare += payment.creatorAmount || Math.floor((payment.amount || 0) * 0.7);
            platformShare += payment.platformAmount || Math.floor((payment.amount || 0) * 0.3);
            
            if (payment.isSuperchat) {
              superchatRevenue += payment.amount || 0;
            } else {
              otherRevenue += payment.amount || 0;
            }
          }
        } catch (error) {
          console.warn(`Failed to get payments for stream ${streamId}:`, error);
        }
      }
      
      // Mock membership revenue (30% of total)
      membershipRevenue = Math.floor(totalRevenue * 0.3);
      superchatRevenue = Math.floor(totalRevenue * 0.6);
      otherRevenue = totalRevenue - superchatRevenue - membershipRevenue;
      
      // Ensure creator gets 70%
      if (creatorShare === 0 && totalRevenue > 0) {
        creatorShare = Math.floor(totalRevenue * 0.7);
        platformShare = totalRevenue - creatorShare;
      }
      
      res.json({
        totalRevenue,
        superchatRevenue,
        membershipRevenue,
        otherRevenue,
        creatorShare,
        platformShare,
        revenueBreakdown: {
          superchats: superchatRevenue,
          memberships: membershipRevenue,
          other: otherRevenue
        },
        payoutInfo: {
          creatorAmount: creatorShare,
          platformAmount: platformShare,
          nextPayoutDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
        }
      });
    } catch (error) {
      console.error("Error fetching revenue:", error);
      res.status(500).json({ message: "Failed to fetch revenue" });
    }
  });
  
  app.get('/api/channel-settings/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get or create creator settings
      let settings = await storage.getCreatorSettings?.(userId);
      
      if (!settings) {
        // Create default settings if they don't exist
        const defaultSettings: InsertCreatorSettings = {
          userId,
          isMonetizationEnabled: false,
          isSuperchatEnabled: false,
          isLiveStreamingEnabled: true,
          isEligible: true,
          country: "KR",
          isVerified: false
        };
        
        try {
          settings = await storage.createCreatorSettings(defaultSettings);
        } catch (error) {
          console.warn(`Failed to create creator settings for user ${userId}:`, error);
          // Return minimal default settings for display
          settings = {
            id: 'temp',
            userId,
            isMonetizationEnabled: false,
            isSuperchatEnabled: false,
            isLiveStreamingEnabled: true,
            isEligible: true,
            country: "KR",
            isVerified: false,
            stripeAccountId: null,
            dateOfBirth: null,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching channel settings:", error);
      res.status(500).json({ message: "Failed to fetch channel settings" });
    }
  });

  // Video thumbnail routes
  app.post('/api/videos/:videoId/thumbnails', requireAuth, async (req: any, res) => {
    try {
      const { videoId } = req.params;
      const userId = req.user.id;
      
      // Verify video ownership
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      if (video.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Generate thumbnails using ffmpeg
      const thumbnails = [];
      const videoPath = video.videoUrl?.startsWith('/uploads/') 
        ? path.join(process.cwd(), video.videoUrl)
        : video.videoUrl;
      
      if (!videoPath) {
        return res.status(400).json({ message: "Video file not found" });
      }
      
      if (fs.existsSync(videoPath)) {
        // Generate thumbnails at different time intervals
        const intervals = [10, 30, 60, 120, 180]; // seconds
        
        for (const interval of intervals) {
          const thumbnailPath = path.join('uploads/thumbnails', `${videoId}_${interval}.jpg`);
          const thumbnailDir = path.dirname(thumbnailPath);
          
          // Ensure thumbnail directory exists
          if (!fs.existsSync(thumbnailDir)) {
            fs.mkdirSync(thumbnailDir, { recursive: true });
          }
          
          try {
            // Use ffmpeg to extract thumbnail
            await new Promise<void>((resolve, reject) => {
              const ffmpeg = spawn('ffmpeg', [
                '-i', videoPath,
                '-ss', interval.toString(),
                '-vframes', '1',
                '-f', 'image2',
                '-y', // Overwrite output file
                thumbnailPath
              ]);
              
              ffmpeg.on('close', (code: number | null) => {
                if (code === 0) resolve();
                else reject(new Error(`ffmpeg failed with code ${code}`));
              });
              
              ffmpeg.on('error', reject);
            });
            
            // Create thumbnail record in database
            const thumbnail = await storage.createVideoThumbnail({
              videoId,
              thumbnailUrl: `/${thumbnailPath}`,
              timecode: interval,
              isSelected: thumbnails.length === 0, // First thumbnail is default
            });
            
            thumbnails.push(thumbnail);
          } catch (error) {
            console.warn(`Failed to generate thumbnail at ${interval}s:`, error);
          }
        }
      }
      
      if (thumbnails.length === 0) {
        return res.status(500).json({ message: "Failed to generate thumbnails" });
      }
      
      res.json({ thumbnails });
    } catch (error) {
      console.error("Error generating thumbnails:", error);
      res.status(500).json({ message: "Failed to generate thumbnails" });
    }
  });

  app.put('/api/videos/:videoId/thumbnail/:thumbnailId', requireAuth, async (req: any, res) => {
    try {
      const { videoId, thumbnailId } = req.params;
      const userId = req.user.id;
      
      // Verify video ownership
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      if (video.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      await storage.selectVideoThumbnail(videoId, thumbnailId);
      res.json({ message: "Thumbnail selected successfully" });
    } catch (error) {
      console.error("Error selecting thumbnail:", error);
      res.status(500).json({ message: "Failed to select thumbnail" });
    }
  });

  // SuperChat payment routes
  app.post('/api/superchat/payment-intent', requireAuth, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(400).json({ message: "Payment system not configured" });
      }
      
      const { streamId, message, amount, currency = "KRW" } = req.body;
      const userId = req.user.id;
      
      // Verify stream exists
      const stream = await storage.getStream(streamId);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      
      // Check if stream owner has monetization enabled
      const creatorSettings = await storage.getCreatorSettings(stream.userId);
      if (!creatorSettings?.isSuperchatEnabled || !creatorSettings?.isMonetizationEnabled) {
        return res.status(400).json({ message: "SuperChat not enabled for this stream" });
      }
      
      // Create payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount, // Amount in smallest currency unit (원 for KRW)
        currency: currency.toLowerCase(),
        metadata: {
          streamId,
          userId,
          message: message.substring(0, 200), // Limit message length
          type: 'superchat'
        }
      });
      
      // Create payment record in database (only with existing fields)
      await storage.createPayment({
        userId,
        streamId,
        stripePaymentIntentId: paymentIntent.id,
        amount,
        currency,
        status: 'pending',
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  app.post('/api/superchat/confirm', requireAuth, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(400).json({ message: "Payment system not configured" });
      }
      
      const { paymentIntentId, streamId, message, amount } = req.body;
      const userId = req.user.id;
      
      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment not completed" });
      }
      
      // Update payment status
      await storage.updatePaymentStatus(paymentIntentId, 'completed', {
        stripePaymentIntent: paymentIntent
      });
      
      // Determine SuperChat tier and display duration
      const tiers = [
        { name: "Bronze", min: 1000, max: 4999, duration: 5, color: "#CD7F32" },
        { name: "Silver", min: 5000, max: 9999, duration: 10, color: "#C0C0C0" },
        { name: "Gold", min: 10000, max: 19999, duration: 20, color: "#FFD700" },
        { name: "Diamond", min: 20000, max: 49999, duration: 30, color: "#B9F2FF" },
        { name: "Premium", min: 50000, max: 999999, duration: 60, color: "#FF6B6B" },
      ];
      
      const tier = tiers.find(t => amount >= t.min && amount <= t.max) || tiers[0];
      const pinnedUntil = new Date(Date.now() + tier.duration * 1000);
      
      // Create SuperChat record (only with existing fields)
      const superchat = await storage.createSuperchat({
        streamId,
        userId,
        paymentId: paymentIntentId,
        message: message.substring(0, 200),
        amount,
        currency: 'KRW',
        color: tier.color,
        displayDuration: tier.duration,
      });
      
      // Update SuperChat pin status separately
      await storage.updateSuperchatPin(superchat.id, true, pinnedUntil);
      
      // Broadcast SuperChat to stream viewers via WebSocket
      const superchatData = {
        ...superchat,
        user: await storage.getUser(userId)
      };
      
      // Broadcast to stream room
      const messageStr = JSON.stringify({
        type: 'superchat',
        data: superchatData,
        streamId
      });
      
      if (streamConnections.has(streamId)) {
        streamConnections.get(streamId)!.forEach(client => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(messageStr);
          }
        });
      }
      
      res.json(superchatData);
    } catch (error) {
      console.error("Error confirming SuperChat:", error);
      res.status(500).json({ message: "Failed to confirm SuperChat" });
    }
  });

  // SuperChat management routes
  app.get('/api/superchats/:streamId', async (req, res) => {
    try {
      const superchats = await storage.getSuperchats(req.params.streamId);
      res.json(superchats);
    } catch (error) {
      console.error("Error fetching superchats:", error);
      res.status(500).json({ message: "Failed to fetch superchats" });
    }
  });

  // Creator settings routes
  app.get('/api/creator-settings/:userId', async (req, res) => {
    try {
      const settings = await storage.getCreatorSettings(req.params.userId);
      if (!settings) {
        // Return default settings if none exist
        return res.json({
          isMonetizationEnabled: false,
          isSuperchatEnabled: false,
          minSuperchatAmount: 1000,
          maxSuperchatAmount: 999999,
        });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error fetching creator settings:", error);
      res.status(500).json({ message: "Failed to fetch creator settings" });
    }
  });

  app.put('/api/creator-settings/:userId', requireAuth, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const requestUserId = req.user.id;
      
      // Users can only update their own settings
      if (userId !== requestUserId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const settings = req.body;
      
      // Check if settings exist
      const existingSettings = await storage.getCreatorSettings(userId);
      
      let updatedSettings;
      if (existingSettings) {
        updatedSettings = await storage.updateCreatorSettings(userId, settings);
      } else {
        updatedSettings = await storage.createCreatorSettings({
          userId,
          ...settings,
        });
      }
      
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating creator settings:", error);
      res.status(500).json({ message: "Failed to update creator settings" });
    }
  });

  // Static file serving for uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  app.use('/uploads/thumbnails', express.static(path.join(process.cwd(), 'uploads/thumbnails')));

  // Admin routes
  app.get('/api/admin/stats', requireAuth, requireAdmin, async (req, res) => {
    try {
      const totalUsers = await storage.getUserCount();
      const activeUsers = await storage.getActiveUserCount();
      const bannedUsers = await storage.getBannedUserCount();
      const totalVideos = await storage.getVideoCount();
      const totalStreams = await storage.getStreamCount();
      const totalViews = await storage.getTotalViews();
      const totalRevenue = await storage.getTotalRevenue();
      const pendingReports = await storage.getPendingReportCount();
      const newUsersToday = await storage.getNewUsersToday();
      const newVideosToday = await storage.getNewVideosToday();
      
      // New advanced statistics
      const newUsersLastWeek = await storage.getNewUsersLastWeek();
      const dailyActiveUsers = await storage.getDailyActiveUsers();
      const newUsersGrowthRate = await storage.getNewUsersGrowthRate();
      const activeUsersGrowthRate = await storage.getActiveUsersGrowthRate();
      
      // Additional analytics
      const userRetentionRate = await storage.getUserRetentionRate();
      const dailyUploads = await storage.getDailyUploads();
      const averageWatchTime = await storage.getAverageWatchTime();
      const likeRatio = await storage.getLikeRatio();
      const dailyPageViews = await storage.getDailyPageViews();
      const averageSessionTime = await storage.getAverageSessionTime();
      const bounceRate = await storage.getBounceRate();
      
      // Revenue analytics
      const superchatRevenue = await storage.getSuperchatRevenue();
      const platformFee = await storage.getPlatformFee();
      const membershipRevenue = await storage.getMembershipRevenue();
      const adsRevenue = await storage.getAdsRevenue();
      
      // Additional analytics for dashboard
      const currentLiveViewers = await storage.getCurrentLiveViewers();
      const serverUptime = await storage.getServerUptime();
      const systemResources = await storage.getSystemResources();
      
      res.json({
        totalUsers,
        activeUsers,
        bannedUsers,
        totalVideos,
        totalStreams,
        totalViews,
        totalRevenue,
        pendingReports,
        newUsersToday,
        newVideosToday,
        newUsersLastWeek,
        dailyActiveUsers,
        newUsersGrowthRate,
        activeUsersGrowthRate,
        userRetentionRate,
        dailyUploads,
        averageWatchTime,
        likeRatio,
        dailyPageViews,
        averageSessionTime,
        bounceRate,
        superchatRevenue,
        platformFee,
        membershipRevenue,
        adsRevenue,
        currentLiveViewers,
        serverUptime,
        systemResources
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Failed to fetch admin stats' });
    }
  });

  // Top creators endpoint
  app.get('/api/admin/top-creators', requireAuth, requireAdmin, async (req, res) => {
    try {
      const creators = await storage.getTopCreators(5);
      res.json(creators);
    } catch (error) {
      console.error('Error fetching top creators:', error);
      res.status(500).json({ message: 'Failed to fetch top creators' });
    }
  });

  app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
    try {
      const filter = req.query.filter as string;
      const users = await storage.getAdminUsers(filter);
      res.json(users);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.get('/api/admin/videos', requireAuth, requireAdmin, async (req, res) => {
    try {
      const filter = req.query.filter as string;
      const videos = await storage.getAdminVideos(filter);
      res.json(videos);
    } catch (error) {
      console.error('Error fetching admin videos:', error);
      res.status(500).json({ message: 'Failed to fetch videos' });
    }
  });

  app.get('/api/admin/reports', requireAuth, requireAdmin, async (req, res) => {
    try {
      const filter = req.query.filter as string;
      const reports = await storage.getAdminReports(filter);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching admin reports:', error);
      res.status(500).json({ message: 'Failed to fetch reports' });
    }
  });

  app.patch('/api/admin/users/:userId/status', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { action, reason } = req.body;
      
      await storage.updateUserAdminStatus(userId, action, reason);
      res.json({ message: 'User status updated successfully' });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ message: 'Failed to update user status' });
    }
  });

  app.patch('/api/admin/videos/:videoId/status', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { videoId } = req.params;
      const { action } = req.body;
      
      await storage.updateVideoAdminStatus(videoId, action);
      res.json({ message: 'Video status updated successfully' });
    } catch (error) {
      console.error('Error updating video status:', error);
      res.status(500).json({ message: 'Failed to update video status' });
    }
  });

  app.patch('/api/admin/reports/:reportId/status', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { reportId } = req.params;
      const { status, note } = req.body;
      
      await storage.updateReportAdminStatus(reportId, status, note);
      res.json({ message: 'Report status updated successfully' });
    } catch (error) {
      console.error('Error updating report status:', error);
      res.status(500).json({ message: 'Failed to update report status' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Broadcast function for real-time updates
  function broadcastToAll(message: any) {
    const messageStr = JSON.stringify(message);
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(messageStr);
      }
    });
  }

  // Store active connections by stream ID
  const streamConnections = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws, req) => {
    console.log('🔌 New WebSocket connection');
    
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
              // Record heartbeat for stream activity
              recordStreamHeartbeat(currentStreamId, streamConnections.get(currentStreamId)!.size);
            }
            
            // Send recent chat messages with user info
            try {
              if (currentStreamId) {
                const recentMessages = await storage.getChatMessagesByStream(currentStreamId, 20);
                // Add user info to messages
                const messagesWithUsers = await Promise.all(
                  recentMessages.map(async (msg) => {
                    const user = await storage.getUser(msg.userId);
                    return {
                      ...msg,
                      username: user?.username || user?.firstName || "Unknown User",
                      profileImageUrl: user?.profileImageUrl || null,
                    };
                  })
                );
                ws.send(JSON.stringify({
                  type: 'chat_history',
                  messages: messagesWithUsers.reverse(),
                }));
              }
            } catch (error) {
              console.error('Error fetching chat history:', error);
            }
            break;

          case 'heartbeat':
            // Update heartbeat for current stream
            if (currentStreamId) {
              const viewerCount = streamConnections.get(currentStreamId)?.size || 0;
              recordStreamHeartbeat(currentStreamId, viewerCount);
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

                // Get user information for the message
                const user = await storage.getUser(data.userId);
                
                // Create message object with user info for broadcasting
                const messageWithUser = {
                  ...chatMessage,
                  username: user?.username || user?.firstName || "Unknown User",
                  profileImageUrl: user?.profileImageUrl || null,
                  userId: data.userId, // Make sure userId is included
                };

                // Record activity heartbeat
                recordStreamHeartbeat(currentStreamId);

                // Broadcast to all clients in the stream
                const connections = streamConnections.get(currentStreamId);
                if (connections) {
                  const messageData = JSON.stringify({
                    type: 'new_message',
                    message: messageWithUser,
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

  // ========== MEMBERSHIP & SUBSCRIPTION API ==========
  
  // Channel membership tiers
  app.get('/api/channels/:channelId/membership-tiers', async (req, res) => {
    try {
      const { channelId } = req.params;
      const tiers = await storage.getMembershipTiers(channelId);
      res.json(tiers);
    } catch (error) {
      console.error('Error fetching membership tiers:', error);
      res.status(500).json({ message: 'Failed to fetch membership tiers' });
    }
  });

  app.post('/api/channels/:channelId/membership-tiers', requireAuth, async (req, res) => {
    try {
      const { channelId } = req.params;
      const userId = req.user?.id;
      
      // Check if user owns the channel
      if (userId !== channelId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const { name, description, monthlyPrice, yearlyPrice, color, emoji } = req.body;
      
      const tier = await storage.createMembershipTier({
        channelId,
        name,
        description,
        monthlyPrice,
        yearlyPrice,
        color,
        emoji,
      });
      
      res.status(201).json(tier);
    } catch (error) {
      console.error('Error creating membership tier:', error);
      res.status(500).json({ message: 'Failed to create membership tier' });
    }
  });

  app.put('/api/membership-tiers/:tierId', requireAuth, async (req, res) => {
    try {
      const { tierId } = req.params;
      const userId = req.user?.id;
      
      // Get tier to check ownership
      const tier = await storage.getMembershipTier(tierId);
      if (!tier || tier.channelId !== userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const updatedTier = await storage.updateMembershipTier(tierId, req.body);
      res.json(updatedTier);
    } catch (error) {
      console.error('Error updating membership tier:', error);
      res.status(500).json({ message: 'Failed to update membership tier' });
    }
  });

  app.delete('/api/membership-tiers/:tierId', requireAuth, async (req, res) => {
    try {
      const { tierId } = req.params;
      const userId = req.user?.id;
      
      // Get tier to check ownership
      const tier = await storage.getMembershipTier(tierId);
      if (!tier || tier.channelId !== userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      await storage.deleteMembershipTier(tierId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting membership tier:', error);
      res.status(500).json({ message: 'Failed to delete membership tier' });
    }
  });

  // Membership benefits
  app.get('/api/membership-tiers/:tierId/benefits', async (req, res) => {
    try {
      const { tierId } = req.params;
      const benefits = await storage.getMembershipBenefits(tierId);
      res.json(benefits);
    } catch (error) {
      console.error('Error fetching membership benefits:', error);
      res.status(500).json({ message: 'Failed to fetch membership benefits' });
    }
  });

  app.post('/api/membership-tiers/:tierId/benefits', requireAuth, async (req, res) => {
    try {
      const { tierId } = req.params;
      const userId = req.user?.id;
      
      // Check tier ownership
      const tier = await storage.getMembershipTier(tierId);
      if (!tier || tier.channelId !== userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const benefit = await storage.createMembershipBenefit({
        tierId,
        ...req.body,
      });
      
      res.status(201).json(benefit);
    } catch (error) {
      console.error('Error creating membership benefit:', error);
      res.status(500).json({ message: 'Failed to create membership benefit' });
    }
  });

  // User subscriptions
  app.get('/api/users/:userId/subscriptions', requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;
      
      // Users can only view their own subscriptions
      if (userId !== currentUserId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const subscriptions = await storage.getSubscriptionsByUser(userId);
      res.json(subscriptions);
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      res.status(500).json({ message: 'Failed to fetch subscriptions' });
    }
  });

  app.get('/api/channels/:channelId/subscribers', requireAuth, async (req, res) => {
    try {
      const { channelId } = req.params;
      const userId = req.user?.id;
      
      // Only channel owner can view subscribers
      if (channelId !== userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const subscribers = await storage.getSubscribersByChannel(channelId);
      res.json(subscribers);
    } catch (error) {
      console.error('Error fetching channel subscribers:', error);
      res.status(500).json({ message: 'Failed to fetch subscribers' });
    }
  });

  // Subscribe/unsubscribe (follow functionality)
  app.post('/api/channels/:channelId/subscribe', requireAuth, async (req, res) => {
    try {
      const { channelId } = req.params;
      const userId = req.user?.id;
      
      if (userId === channelId) {
        return res.status(400).json({ message: 'Cannot subscribe to your own channel' });
      }
      
      // Check if already subscribed
      const existingSubscription = await storage.getSubscription(userId!, channelId);
      if (existingSubscription) {
        return res.status(400).json({ message: 'Already subscribed' });
      }
      
      const subscription = await storage.createSubscription({
        userId: userId!,
        channelId,
        type: 'follow',
      });
      
      // Create default notification settings
      await storage.createSubscriptionSettings({
        subscriptionId: subscription.id,
      });
      
      res.status(201).json(subscription);
    } catch (error) {
      console.error('Error subscribing to channel:', error);
      res.status(500).json({ message: 'Failed to subscribe' });
    }
  });

  app.delete('/api/channels/:channelId/subscribe', requireAuth, async (req, res) => {
    try {
      const { channelId } = req.params;
      const userId = req.user?.id;
      
      await storage.cancelSubscription(userId!, channelId);
      res.status(204).send();
    } catch (error) {
      console.error('Error unsubscribing from channel:', error);
      res.status(500).json({ message: 'Failed to unsubscribe' });
    }
  });

  // Get user's membership for a specific channel
  app.get('/api/channels/:channelId/membership', requireAuth, async (req, res) => {
    try {
      const { channelId } = req.params;
      const userId = req.user?.id;
      
      const membership = await storage.getUserMembership(userId!, channelId);
      res.json(membership || { subscription: null, tier: null, channel: null });
    } catch (error) {
      console.error('Error fetching user membership:', error);
      res.status(500).json({ message: 'Failed to fetch membership' });
    }
  });

  // Member content
  app.get('/api/channels/:channelId/member-content', requireAuth, async (req, res) => {
    try {
      const { channelId } = req.params;
      const { tierId } = req.query;
      const userId = req.user?.id;
      
      // Check if user has access to member content
      const membership = await storage.getUserMembership(userId!, channelId);
      if (!membership || !membership.subscription?.isActive) {
        return res.status(403).json({ message: 'Membership required' });
      }
      
      const content = await storage.getMemberContent(channelId, tierId as string);
      res.json(content);
    } catch (error) {
      console.error('Error fetching member content:', error);
      res.status(500).json({ message: 'Failed to fetch member content' });
    }
  });

  app.post('/api/channels/:channelId/member-content', requireAuth, async (req, res) => {
    try {
      const { channelId } = req.params;
      const userId = req.user?.id;
      
      // Check if user owns the channel
      if (userId !== channelId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const content = await storage.createMemberContent({
        channelId,
        ...req.body,
      });
      
      res.status(201).json(content);
    } catch (error) {
      console.error('Error creating member content:', error);
      res.status(500).json({ message: 'Failed to create member content' });
    }
  });

  // Channel revenue (for creators)
  app.get('/api/channels/:channelId/revenue', requireAuth, async (req, res) => {
    try {
      const { channelId } = req.params;
      const userId = req.user?.id;
      
      // Only channel owner can view revenue
      if (channelId !== userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const { startDate, endDate } = req.query;
      const revenue = await storage.getChannelRevenue(
        channelId, 
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(revenue);
    } catch (error) {
      console.error('Error fetching channel revenue:', error);
      res.status(500).json({ message: 'Failed to fetch revenue' });
    }
  });

  // ==================================================
  // ADVERTISING SYSTEM API ENDPOINTS (Real-time Auction System)
  // ==================================================

  // Advertiser Management Endpoints
  app.post('/api/advertisers', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Check if user already has an advertiser account
      const existingAdvertiser = await storage.getAdvertiserByUserId(userId);
      if (existingAdvertiser) {
        return res.status(400).json({ message: 'Advertiser account already exists' });
      }

      const advertiser = await storage.createAdvertiser({
        userId,
        companyName: req.body.companyName,
        industry: req.body.industry,
        website: req.body.website,
        contactEmail: req.body.contactEmail,
        contactPhone: req.body.contactPhone,
        country: req.body.country || 'KR',
        status: 'pending' // Requires approval
      });

      res.status(201).json(advertiser);
    } catch (error) {
      console.error('Error creating advertiser:', error);
      res.status(500).json({ message: 'Failed to create advertiser account' });
    }
  });

  app.get('/api/advertisers/me', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const advertiser = await storage.getAdvertiserByUserId(userId);
      
      if (!advertiser) {
        return res.status(404).json({ message: 'Advertiser account not found' });
      }

      res.json(advertiser);
    } catch (error) {
      console.error('Error fetching advertiser:', error);
      res.status(500).json({ message: 'Failed to fetch advertiser' });
    }
  });

  // Campaign Management Endpoints
  app.post('/api/ad-campaigns', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const advertiser = await storage.getAdvertiserByUserId(userId);
      
      if (!advertiser || advertiser.status !== 'active') {
        return res.status(403).json({ message: 'Active advertiser account required' });
      }

      const campaign = await storage.createAdCampaign({
        advertiserId: advertiser.id,
        name: req.body.name,
        description: req.body.description,
        campaignType: req.body.campaignType || 'display',
        status: 'draft',
        budget: parseInt(req.body.budget),
        dailyBudget: parseInt(req.body.dailyBudget),
        maxBidAmount: parseInt(req.body.maxBidAmount),
        targetingOptions: JSON.stringify(req.body.targeting || {}),
        startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
      });

      res.status(201).json(campaign);
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ message: 'Failed to create campaign' });
    }
  });

  app.get('/api/ad-campaigns', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const advertiser = await storage.getAdvertiserByUserId(userId);
      
      if (!advertiser) {
        return res.status(403).json({ message: 'Advertiser account required' });
      }

      const campaigns = await storage.getAdCampaignsByAdvertiser(advertiser.id);
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ message: 'Failed to fetch campaigns' });
    }
  });

  app.get('/api/ad-campaigns/:id', requireAuth, async (req: any, res) => {
    try {
      const campaign = await storage.getAdCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      // Check ownership
      const userId = req.user.id;
      const advertiser = await storage.getAdvertiserByUserId(userId);
      if (!advertiser || campaign.advertiserId !== advertiser.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json(campaign);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      res.status(500).json({ message: 'Failed to fetch campaign' });
    }
  });

  app.patch('/api/ad-campaigns/:id', requireAuth, async (req: any, res) => {
    try {
      const campaignId = req.params.id;
      const campaign = await storage.getAdCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      // Check ownership
      const userId = req.user.id;
      const advertiser = await storage.getAdvertiserByUserId(userId);
      if (!advertiser || campaign.advertiserId !== advertiser.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const updatedCampaign = await storage.updateAdCampaign(campaignId, req.body);
      res.json(updatedCampaign);
    } catch (error) {
      console.error('Error updating campaign:', error);
      res.status(500).json({ message: 'Failed to update campaign' });
    }
  });

  app.post('/api/ad-campaigns/:id/pause', requireAuth, async (req: any, res) => {
    try {
      const campaignId = req.params.id;
      const campaign = await storage.getAdCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      // Check ownership
      const userId = req.user.id;
      const advertiser = await storage.getAdvertiserByUserId(userId);
      if (!advertiser || campaign.advertiserId !== advertiser.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await storage.pauseAdCampaign(campaignId);
      res.json({ message: 'Campaign paused successfully' });
    } catch (error) {
      console.error('Error pausing campaign:', error);
      res.status(500).json({ message: 'Failed to pause campaign' });
    }
  });

  app.post('/api/ad-campaigns/:id/resume', requireAuth, async (req: any, res) => {
    try {
      const campaignId = req.params.id;
      const campaign = await storage.getAdCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      // Check ownership
      const userId = req.user.id;
      const advertiser = await storage.getAdvertiserByUserId(userId);
      if (!advertiser || campaign.advertiserId !== advertiser.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await storage.resumeAdCampaign(campaignId);
      res.json({ message: 'Campaign resumed successfully' });
    } catch (error) {
      console.error('Error resuming campaign:', error);
      res.status(500).json({ message: 'Failed to resume campaign' });
    }
  });

  // Creative Management Endpoints
  app.post('/api/ad-creatives', requireAuth, async (req: any, res) => {
    try {
      const campaignId = req.body.campaignId;
      const campaign = await storage.getAdCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      // Check ownership
      const userId = req.user.id;
      const advertiser = await storage.getAdvertiserByUserId(userId);
      if (!advertiser || campaign.advertiserId !== advertiser.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const creative = await storage.createAdCreative({
        campaignId,
        name: req.body.name,
        type: req.body.type, // banner, video, native, text
        format: req.body.format, // 300x250, 728x90, etc.
        content: JSON.stringify(req.body.content),
        imageUrl: req.body.imageUrl,
        videoUrl: req.body.videoUrl,
        headline: req.body.headline,
        description: req.body.description,
        callToAction: req.body.callToAction,
        landingUrl: req.body.landingUrl,
        isActive: true
      });

      res.status(201).json(creative);
    } catch (error) {
      console.error('Error creating creative:', error);
      res.status(500).json({ message: 'Failed to create creative' });
    }
  });

  app.get('/api/ad-campaigns/:campaignId/creatives', requireAuth, async (req: any, res) => {
    try {
      const { campaignId } = req.params;
      const campaign = await storage.getAdCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      // Check ownership
      const userId = req.user.id;
      const advertiser = await storage.getAdvertiserByUserId(userId);
      if (!advertiser || campaign.advertiserId !== advertiser.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const creatives = await storage.getAdCreativesByCampaign(campaignId);
      res.json(creatives);
    } catch (error) {
      console.error('Error fetching creatives:', error);
      res.status(500).json({ message: 'Failed to fetch creatives' });
    }
  });

  // Real-time Ad Serving API (Core SSP functionality)
  app.post('/api/ads/request', async (req, res) => {
    try {
      const { placementType, category, userId } = req.body;
      
      if (!placementType) {
        return res.status(400).json({ message: 'Placement type required' });
      }

      // Get targeted ads through real-time auction
      const targetedAds = await storage.getTargetedAds(
        userId || 'anonymous',
        placementType,
        category
      );

      res.json({
        ads: targetedAds,
        timestamp: new Date().toISOString(),
        auctionDurationMs: Date.now() % 10 + 1 // Simulate auction time (1-10ms)
      });
    } catch (error) {
      console.error('Error serving ads:', error);
      res.status(500).json({ message: 'Failed to serve ads' });
    }
  });

  // Ad Interaction Tracking
  app.post('/api/ads/impression/:impressionId/click', async (req, res) => {
    try {
      const { impressionId } = req.params;
      await storage.trackAdClick(impressionId);
      res.json({ message: 'Click tracked successfully' });
    } catch (error) {
      console.error('Error tracking click:', error);
      res.status(500).json({ message: 'Failed to track click' });
    }
  });

  app.post('/api/ads/impression/:impressionId/conversion', async (req, res) => {
    try {
      const { impressionId } = req.params;
      const { conversionType, value } = req.body;
      
      await storage.trackAdConversion(impressionId, conversionType, value);
      res.json({ message: 'Conversion tracked successfully' });
    } catch (error) {
      console.error('Error tracking conversion:', error);
      res.status(500).json({ message: 'Failed to track conversion' });
    }
  });

  // Analytics and Reporting
  app.get('/api/ad-campaigns/:id/performance', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      
      const campaign = await storage.getAdCampaign(id);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      // Check ownership
      const userId = req.user.id;
      const advertiser = await storage.getAdvertiserByUserId(userId);
      if (!advertiser || campaign.advertiserId !== advertiser.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const performance = await storage.getAdPerformance(
        id,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      const metrics = await storage.getAdCampaignMetrics(id);

      res.json({
        performance,
        metrics,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status
        }
      });
    } catch (error) {
      console.error('Error fetching campaign performance:', error);
      res.status(500).json({ message: 'Failed to fetch performance data' });
    }
  });

  // Creator Ad Revenue Endpoints
  app.get('/api/creators/ad-revenue', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;
      
      const revenue = await storage.getCreatorAdRevenue(
        userId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        totalRevenue: revenue?.totalRevenue || 0,
        totalImpressions: revenue?.totalImpressions || 0,
        currency: 'KRW',
        sharePercentage: 70, // 70% to creator, 30% to platform
        period: {
          startDate: startDate || 'all-time',
          endDate: endDate || 'now'
        }
      });
    } catch (error) {
      console.error('Error fetching creator ad revenue:', error);
      res.status(500).json({ message: 'Failed to fetch ad revenue' });
    }
  });

  // User Ad Preferences
  app.get('/api/users/ad-preferences', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const preferences = await storage.getUserAdPreferences(userId);
      
      if (!preferences) {
        // Create default preferences
        const defaultPreferences = await storage.createUserAdPreferences({
          userId,
          allowPersonalizedAds: true,
          allowDataCollection: true,
          adFrequencyPreference: 'normal',
          categoryInterests: JSON.stringify([]),
          blockedAdvertisers: JSON.stringify([])
        });
        return res.json(defaultPreferences);
      }

      res.json(preferences);
    } catch (error) {
      console.error('Error fetching ad preferences:', error);
      res.status(500).json({ message: 'Failed to fetch ad preferences' });
    }
  });

  app.patch('/api/users/ad-preferences', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updatedPreferences = await storage.updateUserAdPreferences(userId, req.body);
      res.json(updatedPreferences);
    } catch (error) {
      console.error('Error updating ad preferences:', error);
      res.status(500).json({ message: 'Failed to update ad preferences' });
    }
  });

  // Admin Ad System Management
  app.get('/api/admin/ads/revenue', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const platformRevenue = await storage.getPlatformAdRevenue(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        platformRevenue: platformRevenue?.totalRevenue || 0,
        totalSpend: platformRevenue?.totalSpend || 0,
        totalImpressions: platformRevenue?.totalImpressions || 0,
        platformShare: 30, // 30% platform share
        creatorShare: 70,  // 70% creator share
        currency: 'KRW'
      });
    } catch (error) {
      console.error('Error fetching platform ad revenue:', error);
      res.status(500).json({ message: 'Failed to fetch platform revenue' });
    }
  });

  app.get('/api/admin/advertisers', requireAuth, requireAdmin, async (req, res) => {
    try {
      const advertisers = await storage.getAdvertisers();
      res.json(advertisers);
    } catch (error) {
      console.error('Error fetching advertisers:', error);
      res.status(500).json({ message: 'Failed to fetch advertisers' });
    }
  });

  app.patch('/api/admin/advertisers/:id/status', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const updatedAdvertiser = await storage.updateAdvertiser(id, { status });
      res.json(updatedAdvertiser);
    } catch (error) {
      console.error('Error updating advertiser status:', error);
      res.status(500).json({ message: 'Failed to update advertiser status' });
    }
  });

  return httpServer;
}
