// YouTube RTMP 대안 코드 (재활용용)
// 나중에 필요시 사용할 수 있도록 보관

// YouTube Live RTMP 서버 설정
const youtubeRtmpConfig = {
  rtmpUrl: "rtmp://a.rtmp.youtube.com/live2",
  generateStreamKey: () => `yt_${Math.random().toString(36).substring(2, 15)}`,
  
  // 응답 객체
  createResponse: (streamId, streamKey) => ({
    streamId,
    streamKey,
    rtmpUrl: "rtmp://a.rtmp.youtube.com/live2",
    rtmpStreamKey: streamKey,
    playbackUrl: `/stream/${streamId}`,
    note: "Demo mode - use your actual YouTube stream key for testing",
    setupNote: "YouTube Live alternative for testing"
  })
};

// Nginx RTMP 서버 설정 (nginx-rtmp.conf에 저장됨)
const nginxRtmpConfig = {
  rtmpUrl: "rtmp://localhost:1935/live",
  generateStreamKey: () => `stream_${Math.random().toString(36).substring(2, 15)}`,
  
  createResponse: (streamId, streamKey) => ({
    streamId,
    streamKey,
    rtmpUrl: "rtmp://localhost:1935/live",
    rtmpStreamKey: streamKey,
    playbackUrl: `/stream/${streamId}`,
    note: "Development mode - using local RTMP server"
  })
};

module.exports = { youtubeRtmpConfig, nginxRtmpConfig };