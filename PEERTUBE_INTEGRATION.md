# PeerTube Integration Guide

PIYAKast has been integrated with PeerTube for decentralized video hosting and live streaming.

## Architecture Overview

### Hybrid System
- **Primary**: PeerTube for video hosting and streaming
- **Fallback**: Local storage for reliability
- **Auto-failover**: Seamless fallback when PeerTube is unavailable

### Database Schema Extensions

#### Videos Table
```sql
-- PeerTube integration fields
peertube_id INTEGER,
peertube_uuid VARCHAR,
peertube_embed_url VARCHAR,
peertube_download_url VARCHAR,
peertube_channel_id INTEGER
```

#### Streams Table
```sql
-- PeerTube live streaming fields
peertube_id INTEGER,
peertube_uuid VARCHAR,
peertube_embed_url VARCHAR,
rtmp_url VARCHAR,
stream_key VARCHAR,
peertube_channel_id INTEGER,
permanent_live BOOLEAN DEFAULT FALSE,
save_replay BOOLEAN DEFAULT TRUE
```

## PeerTube Configuration

### Server Configuration
```typescript
// server/peertube-config.ts
export const peertubeConfig = {
  url: 'http://127.0.0.1:9000',  // Your PeerTube instance
  username: 'kery73',            // PeerTube admin username
  password: 'Yoyeom75!'          // PeerTube admin password
};
```

### Category Mapping
```typescript
export const peertubeCategories = {
  'K-Beauty': 1,
  'K-Pop': 2,
  'K-Drama': 3,
  'K-Movie': 4,
  'K-Food': 5,
  'Gaming': 6,
  'Technology': 7,
  'Education': 8,
  'Entertainment': 9,
  'Music': 10
};
```

## Video Upload Flow

### 1. PIYAKast Upload Process
1. User uploads video file via PIYAKast interface
2. File temporarily stored locally with Multer
3. PeerTube API upload initiated
4. If successful:
   - PeerTube metadata stored in database
   - Local file deleted
   - Video URL points to PeerTube embed
5. If failed:
   - Local file kept as fallback
   - Video URL points to local file

### 2. PeerTube API Integration
```typescript
// Upload to PeerTube
const peertubeVideo = await client.uploadVideo(filePath, {
  channelId,
  name: title,
  description: description || '',
  category: peertubeCategories[category] || 9,
  privacy: peertubePrivacy.PUBLIC,
  language: 'ko',
  nsfw: false,
  tags: [category]
});
```

## Live Streaming Flow

### 1. Stream Creation
1. User creates stream via PIYAKast interface
2. PeerTube live stream created via API
3. RTMP URL and stream key generated
4. OBS Studio configuration provided to user

### 2. OBS Studio Integration
```
Server URL: rtmp://your-peertube-instance/live
Stream Key: [auto-generated unique key]
```

### 3. Stream Management
- Real-time viewer count updates
- Stream status monitoring
- Automatic replay saving (configurable)
- Permanent live streaming support

## Frontend Components

### PeerTubeEmbed Component
- Renders PeerTube embedded videos
- Supports JavaScript API for player control
- Fallback to HTML5 video for local files
- Responsive design with dark/light theme support

### LiveStreamSetup Component
- Stream creation interface
- OBS configuration display
- Stream key management (show/hide)
- Real-time stream monitoring
- Copy-to-clipboard functionality

### VideoPlayer Component
- Universal player component
- Auto-detects PeerTube vs local videos
- Consistent UI across video types

## Error Handling

### Connection Failures
- Graceful fallback to local storage
- User notification of service status
- Automatic retry mechanisms

### Upload Failures
- Local file preservation on PeerTube failure
- Clear error messaging to users
- Retry options for failed uploads

### Authentication Issues
- OAuth token refresh handling
- Re-authentication prompts
- Service availability checking

## Monitoring & Logging

### Server Logs
```
✅ PeerTube integration ready
⚠️ PeerTube connection failed - uploads will use local storage
✅ Video uploaded to PeerTube: [title]
✅ Live stream created in PeerTube: [title]
📺 RTMP URL: [url]
🔑 Stream Key: [key]
```

### Database Tracking
- PeerTube upload success rates
- Fallback usage statistics
- Stream creation metrics

## Security Considerations

### Authentication
- OAuth 2.0 secure token management
- Automatic token refresh
- Secure credential storage

### File Handling
- Temporary local file cleanup
- Upload size restrictions (2GB)
- File type validation

### Stream Security
- Unique stream keys per session
- RTMP connection authentication
- User permission validation

## Performance Optimizations

### Caching
- PeerTube API response caching
- Channel information memoization
- Token refresh rate limiting

### File Management
- Immediate local file cleanup after successful uploads
- Background processing for large uploads
- Progressive upload status updates

## Troubleshooting

### Common Issues

#### PeerTube Connection Failed
- Check PeerTube server status
- Verify network connectivity
- Confirm credentials in config

#### Upload Failures
- Check file size (max 2GB)
- Verify file format (MP4, AVI, MOV)
- Ensure sufficient PeerTube storage

#### Stream Creation Issues
- Verify user channel exists
- Check PeerTube live streaming enabled
- Confirm admin permissions

### Debug Commands
```bash
# Test PeerTube connection
curl http://127.0.0.1:9000/api/v1/config

# Check server logs
tail -f server/logs/peertube.log

# Verify database schema
npm run db:push
```

## Migration Notes

### From Local to PeerTube
- Existing local videos remain functional
- New uploads automatically use PeerTube
- Manual migration tools available

### Backup Strategy
- Original code backed up in `/backup/` directory
- Database schema migrations reversible
- Local files preserved during transition

## Future Enhancements

### Planned Features
- Batch video migration tools
- Advanced stream analytics
- Multi-instance PeerTube support
- Automatic quality transcoding
- Federation with other PeerTube instances

### Performance Improvements
- Chunked upload support for large files
- Background processing queue
- CDN integration options
- Advanced caching strategies

## Support

### Documentation
- PeerTube API: https://docs.joinpeertube.org/api-rest-reference.html
- PIYAKast Integration: This document

### Configuration Help
1. Ensure PeerTube instance is running on port 9000
2. Create admin user with credentials in config
3. Enable live streaming in PeerTube settings
4. Configure RTMP endpoint for OBS integration

### Contact
For integration issues or questions, refer to the project documentation or create an issue in the repository.