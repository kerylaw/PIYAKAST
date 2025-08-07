import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { recordStreamHeartbeat, removeStream } from "./streamMonitor";
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
  insertPaymentSchema,
  insertVideoThumbnailSchema,
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

  return httpServer;
}
