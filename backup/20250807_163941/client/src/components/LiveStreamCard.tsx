import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface LiveStreamCardProps {
  id: string;
  title: string;
  category: string;
  viewerCount: number;
  startedAt?: string;
  user: {
    username: string;
    profileImageUrl?: string;
  };
}

function formatViewerCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

function formatStreamDuration(startedAt: string): string {
  const start = new Date(startedAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function LiveStreamCard({ 
  id, 
  title, 
  category, 
  viewerCount, 
  startedAt, 
  user 
}: LiveStreamCardProps) {
  return (
    <div className="bg-card-bg rounded-xl overflow-hidden hover:bg-elevated transition-colors cursor-pointer group">
      <Link href={`/stream/${id}`}>
        <div className="relative">
          {/* Placeholder for stream thumbnail - in real app this would be a live video frame */}
          <img 
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&w=400&h=225&fit=crop"
            alt={title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            data-testid={`img-stream-thumbnail-${id}`}
          />
          
          <div className="absolute top-3 left-3">
            <Badge className="bg-live-red text-white hover:bg-live-red">
              <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" />
              LIVE
            </Badge>
          </div>
          
          <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-xs">
            {formatViewerCount(viewerCount)}
          </div>
          
          {startedAt && (
            <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs">
              {formatStreamDuration(startedAt)}
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link href={`/stream/${id}`}>
          <h3 className="font-semibold mb-2 line-clamp-2 hover:text-primary-purple transition-colors" data-testid={`text-stream-title-${id}`}>
            {title}
          </h3>
        </Link>
        
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Link href={`/profile/${user.username}`} className="flex items-center space-x-2 hover:text-white transition-colors">
            <Avatar className="w-6 h-6">
              <AvatarImage src={user.profileImageUrl} alt={user.username} />
              <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span data-testid={`text-stream-creator-${id}`}>{user.username}</span>
          </Link>
        </div>
        
        <p className="text-gray-400 text-sm mt-1" data-testid={`text-stream-category-${id}`}>
          {category}
        </p>
      </div>
    </div>
  );
}
