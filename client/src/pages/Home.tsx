import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import VideoCard from "@/components/VideoCard";
import LiveStreamCard from "@/components/LiveStreamCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, TrendingUp } from "lucide-react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch popular videos
  const { data: videos = [], isLoading: videosLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  // Fetch live streams
  const { data: liveStreams = [], isLoading: streamsLoading } = useQuery<Stream[]>({
    queryKey: ["/api/streams/live"],
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('🔌 WebSocket connected for real-time updates');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'stream_started':
            // Invalidate streams query to refresh the list
            queryClient.invalidateQueries({ queryKey: ["/api/streams/live"] });
            console.log('🟢 Stream started, refreshing list:', data.streamId);
            break;
          case 'stream_stopped':
            queryClient.invalidateQueries({ queryKey: ["/api/streams/live"] });
            console.log('🔴 Stream stopped, refreshing list:', data.streamId);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queryClient]);

  return (
    <Layout>
      <div className="p-6">
        {/* Featured Section */}
        {liveStreams.length > 0 && (
          <section className="mb-8">
            <div className="relative bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-2xl overflow-hidden border border-gray-700">
              <img 
                src="https://images.unsplash.com/photo-1593305841991-05c297ba4575?ixlib=rb-4.0.3&w=1200&h=400&fit=crop" 
                alt="Featured stream"
                className="w-full h-80 object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="inline-flex items-center px-3 py-1 bg-live-red text-white rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                    LIVE
                  </span>
                  <span className="text-white/80" data-testid="text-featured-viewers">
                    {liveStreams[0]?.viewerCount || 0} viewers
                  </span>
                </div>
                <h2 className="text-3xl font-bold mb-2" data-testid="text-featured-title">
                  {liveStreams[0]?.title || "Featured Live Stream"}
                </h2>
                <p className="text-white/80 mb-4" data-testid="text-featured-description">
                  {liveStreams[0]?.description || "Join the most exciting live content on StreamHub"}
                </p>
                <Button 
                  className="bg-primary-purple hover:bg-purple-700"
                  onClick={() => window.location.href = `/stream/${liveStreams[0]?.id}`}
                  data-testid="button-watch-featured"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Watch Now
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Live Streams Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <div className="w-2 h-2 bg-live-red rounded-full mr-3 animate-pulse" />
              Live Now
            </h2>
            <Button variant="ghost" className="text-primary-purple hover:text-purple-400">
              View All
            </Button>
          </div>
          
          {streamsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card-bg rounded-xl overflow-hidden">
                  <Skeleton className="w-full h-48 bg-gray-700" />
                  <div className="p-4">
                    <Skeleton className="h-4 bg-gray-700 mb-2" />
                    <Skeleton className="h-3 bg-gray-700 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : liveStreams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {liveStreams.map((stream: any) => (
                <LiveStreamCard
                  key={stream.id}
                  id={stream.id}
                  title={stream.title}
                  category={stream.category || "General"}
                  viewerCount={stream.viewerCount}
                  startedAt={stream.startedAt}
                  user={{
                    username: stream.user?.username || "Unknown",
                    profileImageUrl: stream.user?.profileImageUrl,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12" data-testid="text-no-live-streams">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Live Streams</h3>
              <p className="text-gray-400">Check back later for live content!</p>
            </div>
          )}
        </section>

        {/* Popular Videos Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <TrendingUp className="mr-3 h-6 w-6 text-primary-purple" />
              Popular Videos
            </h2>
            <Button variant="ghost" className="text-primary-purple hover:text-purple-400">
              View All
            </Button>
          </div>
          
          {videosLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-card-bg rounded-xl overflow-hidden">
                  <Skeleton className="w-full h-48 bg-gray-700" />
                  <div className="p-4">
                    <Skeleton className="h-4 bg-gray-700 mb-2" />
                    <Skeleton className="h-3 bg-gray-700 w-2/3 mb-1" />
                    <Skeleton className="h-3 bg-gray-700 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video: any) => (
                <VideoCard
                  key={video.id}
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
              ))}
            </div>
          ) : (
            <div className="text-center py-12" data-testid="text-no-videos">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Videos Yet</h3>
              <p className="text-gray-400">Be the first to upload content!</p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
