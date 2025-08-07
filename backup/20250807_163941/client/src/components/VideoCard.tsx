import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play } from "lucide-react";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnailUrl?: string;
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
  duration, 
  viewCount, 
  createdAt, 
  user 
}: VideoCardProps) {
  return (
    <div className="bg-card-bg rounded-xl overflow-hidden hover:bg-elevated transition-colors cursor-pointer group">
      <Link href={`/watch/${id}`}>
        <div className="relative">
          <img 
            src={thumbnailUrl || "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&w=400&h=225&fit=crop"} 
            alt={title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            data-testid={`img-video-thumbnail-${id}`}
          />
          {duration && (
            <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs">
              {formatDuration(duration)}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Play className="text-white h-6 w-6 ml-1" />
            </div>
          </div>
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
