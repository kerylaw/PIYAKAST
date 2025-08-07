import React, { useEffect, useRef } from 'react';

interface PeerTubeEmbedProps {
  embedUrl: string;
  title: string;
  className?: string;
  autoplay?: boolean;
  controls?: boolean;
  width?: string | number;
  height?: string | number;
}

export function PeerTubeEmbed({
  embedUrl,
  title,
  className = "",
  autoplay = false,
  controls = true,
  width = "100%",
  height = "400"
}: PeerTubeEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Construct embed URL with parameters
  const getEmbedUrlWithParams = () => {
    const url = new URL(embedUrl);
    url.searchParams.set('api', '1'); // Enable JavaScript API
    if (autoplay) url.searchParams.set('autoplay', '1');
    if (!controls) url.searchParams.set('controls', '0');
    return url.toString();
  };

  useEffect(() => {
    // Load PeerTube Player API if not already loaded
    if (typeof window !== 'undefined' && !(window as any).PeerTubePlayer) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@peertube/embed-api/build/player.min.js';
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        console.log('PeerTube Player API loaded');
      };
    }
  }, []);

  return (
    <div className={`peertube-embed-container ${className}`}>
      <iframe
        ref={iframeRef}
        src={getEmbedUrlWithParams()}
        title={title}
        width={width}
        height={height}
        frameBorder="0"
        allowFullScreen
        sandbox="allow-same-origin allow-scripts allow-popups"
        style={{
          border: 'none',
          borderRadius: '8px',
          backgroundColor: '#000'
        }}
        data-testid="peertube-video-player"
      />
    </div>
  );
}

// Legacy video player wrapper that supports both PeerTube and local videos
interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  className?: string;
  isPeerTube?: boolean;
}

export function VideoPlayer({ videoUrl, title, className, isPeerTube }: VideoPlayerProps) {
  // Check if it's a PeerTube embed URL
  const isEmbedUrl = videoUrl.includes('/videos/embed/') || isPeerTube;

  if (isEmbedUrl) {
    return (
      <PeerTubeEmbed
        embedUrl={videoUrl}
        title={title}
        className={className}
        controls={true}
        autoplay={false}
      />
    );
  }

  // Fallback to regular HTML5 video for local files
  return (
    <div className={`video-player-container ${className}`}>
      <video
        src={videoUrl}
        title={title}
        controls
        width="100%"
        height="400"
        style={{
          borderRadius: '8px',
          backgroundColor: '#000'
        }}
        data-testid="html5-video-player"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

export default VideoPlayer;