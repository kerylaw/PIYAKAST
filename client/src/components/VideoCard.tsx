import { useState, useRef } from "react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play } from "lucide-react";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  duration?: number;
  viewCount: number;
  createdAt: string;
  user: {
    username: string;
    profileImageUrl?: string;
  };
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export default function VideoCard({ 
  id, 
  title, 
  thumbnailUrl, 
  videoUrl,
  duration, 
  viewCount, 
  createdAt, 
  user 
}: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    setIsHovered(true);
    // 약간의 지연을 두어 실수로 마우스가 지나갈 때 재생되지 않도록 함
    hoverTimeoutRef.current = setTimeout(() => {
      if (videoUrl && videoRef.current) {
        setShowVideo(true);
        videoRef.current.currentTime = 0; // 처음부터 재생
        videoRef.current.play().catch(() => {
          // 자동재생 실패 시 (정책상 등) 조용히 실패
        });
      }
    }, 500); // 0.5초 후 재생 시작
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setShowVideo(false);
  };
  return (
    <div 
      className="bg-card-bg rounded-xl overflow-hidden hover:bg-elevated transition-colors cursor-pointer group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/watch/${id}`}>
        <div className="relative">
          {/* 썸네일 이미지 */}
          <img 
            src={thumbnailUrl || "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&w=400&h=225&fit=crop"} 
            alt={title}
            className={`w-full h-48 object-cover transition-all duration-300 ${
              showVideo ? 'opacity-0 scale-105' : 'group-hover:scale-105 opacity-100'
            }`}
            data-testid={`img-video-thumbnail-${id}`}
          />
          
          {/* 호버 시 재생되는 비디오 */}
          {videoUrl && (
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-48 object-cover transition-opacity duration-300 ${
                showVideo ? 'opacity-100' : 'opacity-0'
              }`}
              muted
              loop
              playsInline
              preload="metadata"
              onError={() => {
                // 비디오 로드 실패 시 썸네일로 fallback
                setShowVideo(false);
              }}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          )}
          
          {/* 재생시간 표시 */}
          {duration && (
            <div className={`absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs transition-opacity duration-300 ${
              showVideo ? 'opacity-0' : 'opacity-100'
            }`}>
              {formatDuration(duration)}
            </div>
          )}
          
          {/* 재생 버튼 오버레이 (비디오가 재생 중이 아닐 때만 표시) */}
          {!showVideo && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Play className="text-white h-6 w-6 ml-1" />
              </div>
            </div>
          )}
          
          {/* 호버 상태 표시 */}
          {isHovered && !showVideo && videoUrl && (
            <div className="absolute top-3 left-3 bg-purple-600/80 text-white px-2 py-1 rounded text-xs font-medium">
              Preview
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link href={`/watch/${id}`}>
          <h3 className="font-semibold mb-2 line-clamp-2 hover:text-primary-purple transition-colors" data-testid={`text-video-title-${id}`}>
            {title}
          </h3>
        </Link>
        
        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-1">
          <Link href={`/profile/${user.username}`} className="flex items-center space-x-2 hover:text-white transition-colors">
            <Avatar className="w-6 h-6">
              <AvatarImage src={user.profileImageUrl} alt={user.username} />
              <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span data-testid={`text-video-creator-${id}`}>{user.username}</span>
          </Link>
        </div>
        
        <p className="text-gray-400 text-sm" data-testid={`text-video-stats-${id}`}>
          {formatViewCount(viewCount)} views • {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
