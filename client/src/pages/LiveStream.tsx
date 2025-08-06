import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Heart, UserPlus, Share2, Settings } from "lucide-react";
import Layout from "@/components/Layout";
import VideoPlayer from "@/components/VideoPlayer";
import LiveChat from "@/components/LiveChat";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

export default function LiveStream() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You need to log in to watch streams. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, toast]);

  // Fetch stream details
  const { data: stream, isLoading: streamLoading, error: streamError } = useQuery({
    queryKey: ["/api/streams", id],
    enabled: !!id && isAuthenticated,
    refetchInterval: 10000, // Refresh every 10 seconds to get updated viewer count
  });

  // Fetch other live streams
  const { data: otherStreams = [] } = useQuery({
    queryKey: ["/api/streams/live"],
    enabled: isAuthenticated,
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        return await apiRequest("DELETE", `/api/users/${stream?.userId}/follow`, {});
      } else {
        return await apiRequest("POST", `/api/users/${stream?.userId}/follow`, {});
      }
    },
    onSuccess: () => {
      setIsFollowing(!isFollowing);
      toast({
        title: "Success",
        description: isFollowing ? "Unfollowed successfully" : "Successfully followed!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    },
  });

  const formatViewerCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Stream link copied to clipboard!",
    });
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (streamError) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Stream Not Found</h2>
            <p className="text-gray-400 mb-4">The stream you're looking for doesn't exist or has ended.</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!stream?.isLive && !streamLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Stream Offline</h2>
            <p className="text-gray-400 mb-4">This stream is currently offline.</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Stream Player */}
          <div className="flex-1 bg-black">
            {streamLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton className="w-full h-full bg-gray-900" />
              </div>
            ) : (
              <VideoPlayer
                title={stream?.title || ""}
                isLive={true}
                className="w-full h-full"
              />
            )}
          </div>

          {/* Stream Info */}
          <div className="bg-card-bg p-6 border-t border-gray-700">
            {streamLoading ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-16 bg-gray-700 rounded-full" />
                    <Skeleton className="h-4 w-20 bg-gray-700" />
                  </div>
                </div>
                <Skeleton className="h-6 bg-gray-700 mb-4" />
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-12 h-12 rounded-full bg-gray-700" />
                  <div className="flex-1">
                    <Skeleton className="h-4 bg-gray-700 w-32 mb-2" />
                    <Skeleton className="h-3 bg-gray-700 w-24" />
                  </div>
                  <Skeleton className="h-10 w-20 bg-gray-700 rounded" />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-live-red text-white hover:bg-live-red">
                      <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                      LIVE
                    </Badge>
                    <span className="text-gray-400" data-testid={`text-stream-viewers-${stream?.id}`}>
                      {formatViewerCount(stream?.viewerCount || 0)} viewers
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {stream?.startedAt && (
                      <span className="text-gray-400 text-sm" data-testid={`text-stream-duration-${stream?.id}`}>
                        Started {formatDistanceToNow(new Date(stream.startedAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>

                <h1 className="text-2xl font-bold mb-4" data-testid={`text-stream-title-${stream?.id}`}>
                  {stream?.title}
                </h1>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Link href={`/profile/${stream?.user?.username}`}>
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={stream?.user?.profileImageUrl} alt={stream?.user?.username} />
                        <AvatarFallback>{stream?.user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div>
                      <Link 
                        href={`/profile/${stream?.user?.username}`}
                        className="font-semibold hover:text-primary-purple transition-colors"
                        data-testid={`link-streamer-${stream?.user?.username}`}
                      >
                        {stream?.user?.username}
                      </Link>
                      <p className="text-gray-400 text-sm">
                        {stream?.category || "Live Streamer"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline" 
                      size="sm"
                      className="border-gray-600 hover:bg-elevated"
                      data-testid={`button-like-stream-${stream?.id}`}
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      Like
                    </Button>
                    
                    {stream?.userId !== user?.id && (
                      <Button
                        onClick={() => followMutation.mutate()}
                        disabled={followMutation.isPending}
                        className="bg-primary-purple hover:bg-purple-700"
                        data-testid={`button-follow-streamer-${stream?.user?.username}`}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {followMutation.isPending ? "Loading..." : isFollowing ? "Following" : "Follow"}
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="border-gray-600 hover:bg-elevated"
                      data-testid={`button-share-stream-${stream?.id}`}
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>

                    {stream?.userId === user?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-600 hover:bg-elevated"
                        data-testid={`button-stream-settings-${stream?.id}`}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Settings
                      </Button>
                    )}
                  </div>
                </div>

                {stream?.description && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-gray-300" data-testid={`text-stream-description-${stream?.id}`}>
                      {stream.description}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Live Chat Sidebar */}
        <div className="w-80 border-l border-gray-700">
          {stream?.id && <LiveChat streamId={stream.id} />}
        </div>
      </div>

      {/* Other Live Streams - Show when stream is loading or ended */}
      {(!stream?.isLive || streamLoading) && (
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">Other Live Streams</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherStreams
              .filter((s: any) => s.id !== id && s.isLive)
              .slice(0, 6)
              .map((otherStream: any) => (
                <Link key={otherStream.id} href={`/stream/${otherStream.id}`}>
                  <div className="bg-card-bg rounded-xl overflow-hidden hover:bg-elevated transition-colors cursor-pointer">
                    <div className="relative">
                      <img 
                        src="https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&w=400&h=225&fit=crop"
                        alt={otherStream.title}
                        className="w-full h-32 object-cover"
                        data-testid={`img-other-stream-${otherStream.id}`}
                      />
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-live-red text-white text-xs">
                          <div className="w-1 h-1 bg-white rounded-full mr-1 animate-pulse" />
                          LIVE
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                        {formatViewerCount(otherStream.viewerCount)}
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1" data-testid={`text-other-stream-title-${otherStream.id}`}>
                        {otherStream.title}
                      </h4>
                      <p className="text-gray-400 text-xs" data-testid={`text-other-stream-creator-${otherStream.id}`}>
                        {otherStream.user?.username}
                      </p>
                      <p className="text-gray-500 text-xs">{otherStream.category}</p>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
