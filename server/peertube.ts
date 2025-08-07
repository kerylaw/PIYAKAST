import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { AxiosResponse } from 'axios';

export interface PeerTubeConfig {
  url: string;
  username: string;
  password: string;
}

export interface PeerTubeChannel {
  id: number;
  name: string;
  displayName: string;
}

export interface PeerTubeVideo {
  id: number;
  uuid: string;
  name: string;
  description: string;
  embedUrl: string;
  downloadUrl: string;
  thumbnailUrl: string;
  duration: number;
  views: number;
  category: {
    id: number;
    label: string;
  };
  channel: {
    id: number;
    name: string;
    displayName: string;
  };
}

export interface PeerTubeLiveStream {
  id: number;
  uuid: string;
  name: string;
  description: string;
  rtmpUrl: string;
  streamKey: string;
  embedUrl: string;
  permanentLive: boolean;
  saveReplay: boolean;
}

export class PeerTubeClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private clientId: string | null = null;
  private clientSecret: string | null = null;

  constructor(private config: PeerTubeConfig) {
    this.baseUrl = config.url.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Authenticate with PeerTube and get access token
   */
  async authenticate(): Promise<void> {
    try {
      // Step 1: Get OAuth client credentials
      const clientResponse = await axios.get(`${this.baseUrl}/api/v1/oauth-clients/local`);
      this.clientId = clientResponse.data.client_id;
      this.clientSecret = clientResponse.data.client_secret;

      // Step 2: Get access token
      if (!this.clientId || !this.clientSecret) {
        throw new Error('Failed to get OAuth client credentials');
      }

      const tokenData = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'password',
        response_type: 'code',
        username: this.config.username,
        password: this.config.password
      });

      const tokenResponse = await axios.post(
        `${this.baseUrl}/api/v1/users/token`,
        tokenData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = tokenResponse.data.access_token;
      console.log('✅ PeerTube authentication successful');
    } catch (error: any) {
      console.error('❌ PeerTube authentication failed:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with PeerTube');
    }
  }

  /**
   * Get authenticated request headers
   */
  private getHeaders(): Record<string, string> {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get user's channels
   */
  async getChannels(): Promise<PeerTubeChannel[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/video-channels`,
        { headers: this.getHeaders() }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get channels:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Upload a video to PeerTube
   */
  async uploadVideo(
    filePath: string,
    metadata: {
      channelId: number;
      name: string;
      description?: string;
      category?: number;
      tags?: string[];
      privacy?: number; // 1=public, 2=unlisted, 3=private
      language?: string;
      licence?: number;
      nsfw?: boolean;
    }
  ): Promise<PeerTubeVideo> {
    try {
      const formData = new FormData();
      formData.append('videofile', fs.createReadStream(filePath));
      formData.append('channelId', metadata.channelId.toString());
      formData.append('name', metadata.name);
      
      if (metadata.description) formData.append('description', metadata.description);
      if (metadata.category) formData.append('category', metadata.category.toString());
      if (metadata.privacy) formData.append('privacy', metadata.privacy.toString());
      if (metadata.language) formData.append('language', metadata.language);
      if (metadata.licence) formData.append('licence', metadata.licence.toString());
      if (metadata.nsfw !== undefined) formData.append('nsfw', metadata.nsfw.toString());
      
      if (metadata.tags && metadata.tags.length > 0) {
        metadata.tags.forEach(tag => formData.append('tags[]', tag));
      }

      const response = await axios.post(
        `${this.baseUrl}/api/v1/videos/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            ...formData.getHeaders()
          },
          timeout: 300000 // 5 minutes timeout for large files
        }
      );

      const video = response.data.video;
      console.log('✅ Video uploaded successfully:', video.name);
      
      return {
        id: video.id,
        uuid: video.uuid,
        name: video.name,
        description: video.description,
        embedUrl: `${this.baseUrl}/videos/embed/${video.uuid}`,
        downloadUrl: `${this.baseUrl}/api/v1/videos/${video.uuid}/download`,
        thumbnailUrl: video.thumbnailUrl || `${this.baseUrl}${video.thumbnailPath}`,
        duration: video.duration,
        views: video.views,
        category: video.category,
        channel: video.channel
      };
    } catch (error: any) {
      console.error('Failed to upload video:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a live stream
   */
  async createLiveStream(metadata: {
    channelId: number;
    name: string;
    description?: string;
    category?: number;
    privacy?: number;
    permanentLive?: boolean;
    saveReplay?: boolean;
  }): Promise<PeerTubeLiveStream> {
    try {
      const liveData = {
        channelId: metadata.channelId,
        name: metadata.name,
        description: metadata.description || '',
        category: metadata.category,
        privacy: metadata.privacy || 1,
        permanentLive: metadata.permanentLive || false,
        saveReplay: metadata.saveReplay || true
      };

      const response = await axios.post(
        `${this.baseUrl}/api/v1/videos/live`,
        liveData,
        { headers: this.getHeaders() }
      );

      const live = response.data.video;
      console.log('✅ Live stream created successfully:', live.name);

      return {
        id: live.id,
        uuid: live.uuid,
        name: live.name,
        description: live.description,
        rtmpUrl: live.rtmpUrl || `rtmp://cast.piyak.kr:1935/live`,
        streamKey: live.streamKey,
        embedUrl: `${this.baseUrl}/videos/embed/${live.uuid}`,
        permanentLive: liveData.permanentLive,
        saveReplay: liveData.saveReplay
      };
    } catch (error: any) {
      console.error('Failed to create live stream:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get video information
   */
  async getVideo(videoId: string): Promise<PeerTubeVideo | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/videos/${videoId}`);
      const video = response.data;
      
      return {
        id: video.id,
        uuid: video.uuid,
        name: video.name,
        description: video.description,
        embedUrl: `${this.baseUrl}/videos/embed/${video.uuid}`,
        downloadUrl: `${this.baseUrl}/api/v1/videos/${video.uuid}/download`,
        thumbnailUrl: video.thumbnailUrl || `${this.baseUrl}${video.thumbnailPath}`,
        duration: video.duration,
        views: video.views,
        category: video.category,
        channel: video.channel
      };
    } catch (error) {
      if ((error as any).response?.status === 404) {
        return null;
      }
      console.error('Failed to get video:', (error as any).response?.data || (error as any).message);
      throw error;
    }
  }

  /**
   * Delete a video
   */
  async deleteVideo(videoId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.baseUrl}/api/v1/videos/${videoId}`,
        { headers: this.getHeaders() }
      );
      console.log('✅ Video deleted successfully:', videoId);
    } catch (error: any) {
      console.error('Failed to delete video:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update video metadata
   */
  async updateVideo(videoId: string, updates: Partial<{
    name: string;
    description: string;
    category: number;
    tags: string[];
    privacy: number;
    language: string;
    licence: number;
    nsfw: boolean;
  }>): Promise<void> {
    try {
      await axios.put(
        `${this.baseUrl}/api/v1/videos/${videoId}`,
        updates,
        { headers: this.getHeaders() }
      );
      console.log('✅ Video updated successfully:', videoId);
    } catch (error: any) {
      console.error('Failed to update video:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get live stream information
   */
  async getLiveStream(videoId: string): Promise<PeerTubeLiveStream | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/videos/live/${videoId}`,
        { headers: this.getHeaders() }
      );
      
      const live = response.data;
      return {
        id: live.id,
        uuid: live.uuid,
        name: live.name,
        description: live.description,
        rtmpUrl: live.rtmpUrl || `rtmp://cast.piyak.kr:1935/live`,
        streamKey: live.streamKey,
        embedUrl: `${this.baseUrl}/videos/embed/${live.uuid}`,
        permanentLive: live.permanentLive,
        saveReplay: live.saveReplay
      };
    } catch (error) {
      if ((error as any).response?.status === 404) {
        return null;
      }
      console.error('Failed to get live stream:', (error as any).response?.data || (error as any).message);
      throw error;
    }
  }

  /**
   * Test connection to PeerTube instance
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/config`, {
        timeout: 10000, // 10초 타임아웃
        headers: {
          'User-Agent': 'PIYAKast/1.0'
        }
      });
      console.log('✅ PeerTube connection successful');
      console.log('Instance:', response.data.instance.name);
      return true;
    } catch (error: any) {
      console.error('❌ PeerTube connection failed:', error.message);
      return false;
    }
  }
}

// Singleton instance
let peertubeClient: PeerTubeClient | null = null;

export function initializePeerTube(config: PeerTubeConfig): PeerTubeClient {
  peertubeClient = new PeerTubeClient(config);
  return peertubeClient;
}

export function getPeerTubeClient(): PeerTubeClient {
  if (!peertubeClient) {
    throw new Error('PeerTube client not initialized. Call initializePeerTube() first.');
  }
  return peertubeClient;
}