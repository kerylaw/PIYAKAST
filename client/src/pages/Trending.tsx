import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  TrendingUp, 
  Play, 
  Eye, 
  Clock, 
  Radio 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import VideoCard from "@/components/VideoCard";

export default function Trending() {
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["/api/videos"],
  });

  const { data: liveStreams = [] } = useQuery({
    queryKey: ["/api/streams/live"],
  });

  // Sort videos by view count and creation date for trending
  const trendingVideos = Array.isArray(videos) 
    ? [...videos].sort((a: any, b: any) => {
        const aScore = (a.viewCount || 0) + (new Date(a.createdAt).getTime() / 1000000);
        const bScore = (b.viewCount || 0) + (new Date(b.createdAt).getTime() / 1000000);
        return bScore - aScore;
      })
    : [];

  const trendingStreams = Array.isArray(liveStreams) 
    ? [...liveStreams].sort((a: any, b: any) => (b.viewerCount || 0) - (a.viewerCount || 0))
    : [];

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex items-center space-x-3 mb-8">
          <TrendingUp className="h-8 w-8 text-primary-purple" />
          <h1 className="text-3xl font-bold text-white">Trending</h1>
        </div>

        {/* Trending Live Streams */}
        {trendingStreams.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center space-x-2 mb-6">
              <Radio className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-semibold text-white">Trending Live</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingStreams.slice(0, 6).map((stream: any) => (
                <Link 
                  key={stream.id} 
                  href={`/stream/${stream.id}`}
                  className="group"
                  data-testid={`link-stream-${stream.id}`}
                >
                  <div className="bg-dark-blue rounded-lg p-4 border border-gray-700 hover:border-primary-purple transition-colors">
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage 
                          src={stream.user?.profileImageUrl} 
                          alt={stream.user?.username || 'User'} 
                        />
                        <AvatarFallback>
                          {(stream.user?.username || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white group-hover:text-primary-purple transition-colors truncate">
                          {stream.title}
                        </h3>
                        <p className="text-sm text-gray-400 truncate">
                          {stream.user?.username}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-sm text-red-500 font-medium">LIVE</span>
                          </div>
                          <div className="flex items-center space-x-1 text-gray-400">
                            <Eye className="h-4 w-4" />
                            <span className="text-sm">{stream.viewerCount || 0}</span>
                          </div>
                        </div>
                        {stream.category && (
                          <Badge variant="secondary" className="mt-2">
                            {stream.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Trending Videos */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-6">Trending Videos</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-dark-blue rounded-lg p-4 animate-pulse">
                  <div className="aspect-video bg-gray-700 rounded mb-3" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : trendingVideos.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No trending videos yet</h3>
              <p className="text-gray-500">Be the first to upload and get trending!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingVideos.map((video: any, index: number) => (
                <div key={video.id} className="relative">
                  <VideoCard
                    id={video.id}
                    title={video.title}
                    thumbnailUrl={video.thumbnailUrl}
                    videoUrl={video.videoUrl}
                    duration={video.duration}
                    viewCount={video.viewCount}
                    createdAt={video.createdAt}
                    user={{
                      username: video.user?.username || "Unknown",
                      profileImageUrl: video.user?.profileImageUrl,
                    }}
                  />
                  {/* Trending badge overlay */}
                  <div className="absolute top-3 left-3 z-10">
                    <Badge variant="destructive" className="text-xs">
                      #{index + 1} Trending
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}