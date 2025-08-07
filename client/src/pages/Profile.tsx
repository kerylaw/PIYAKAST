import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Video, Calendar, Settings, UserPlus, UserMinus, BarChart3 } from "lucide-react";
import Layout from "@/components/Layout";
import VideoCard from "@/components/VideoCard";
import LiveStreamCard from "@/components/LiveStreamCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(false);
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You need to log in to view profiles. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, toast]);

  // Fetch user profile by username
  const { data: profileUser, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ["/api/users/profile", username],
    queryFn: async () => {
      // Since we don't have a direct endpoint for fetching user by username,
      // we'll need to use the existing endpoints or create a new one
      // For now, we'll simulate this by checking if it's the current user
      if (username === currentUser?.username) {
        return currentUser;
      }
      // In a real implementation, you'd have an endpoint like /api/users/by-username/:username
      throw new Error("User not found");
    },
    enabled: !!username && isAuthenticated,
  });

  // Fetch user's videos
  const { data: userVideos = [], isLoading: videosLoading } = useQuery({
    queryKey: ["/api/users", profileUser?.id, "videos"],
    enabled: !!profileUser?.id && isAuthenticated,
  });

  // Fetch user's streams
  const { data: userStreams = [], isLoading: streamsLoading } = useQuery({
    queryKey: ["/api/users", profileUser?.id, "streams"],
    enabled: !!profileUser?.id && isAuthenticated,
  });

  // Fetch followers count
  const { data: followers = [] } = useQuery({
    queryKey: ["/api/users", profileUser?.id, "followers"],
    enabled: !!profileUser?.id && isAuthenticated,
  });

  // Fetch following count
  const { data: following = [] } = useQuery({
    queryKey: ["/api/users", profileUser?.id, "following"],
    enabled: !!profileUser?.id && isAuthenticated,
  });

  // Type-safe arrays
  const followersArray = Array.isArray(followers) ? followers : [];
  const followingArray = Array.isArray(following) ? following : [];
  const videosArray = Array.isArray(userVideos) ? userVideos : [];
  const streamsArray = Array.isArray(userStreams) ? userStreams : [];

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        return await apiRequest("DELETE", `/api/users/${profileUser?.id}/follow`, {});
      } else {
        return await apiRequest("POST", `/api/users/${profileUser?.id}/follow`, {});
      }
    },
    onSuccess: () => {
      setIsFollowing(!isFollowing);
      queryClient.invalidateQueries({ queryKey: ["/api/users", profileUser?.id, "followers"] });
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

  const formatViewCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const isOwnProfile = currentUser?.username === username;

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (userError) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
            <p className="text-gray-400 mb-4">The profile you're looking for doesn't exist.</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-primary-purple/20 to-primary-indigo/20 rounded-2xl p-8 mb-8 border border-gray-700">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            {userLoading ? (
              <>
                <Skeleton className="w-32 h-32 rounded-full bg-gray-700" />
                <div className="flex-1">
                  <Skeleton className="h-8 bg-gray-700 w-48 mb-4" />
                  <div className="flex space-x-6 mb-4">
                    <Skeleton className="h-6 bg-gray-700 w-24" />
                    <Skeleton className="h-6 bg-gray-700 w-24" />
                    <Skeleton className="h-6 bg-gray-700 w-24" />
                  </div>
                  <Skeleton className="h-4 bg-gray-700 w-96" />
                </div>
              </>
            ) : (
              <>
                <Avatar className="w-32 h-32">
                  <AvatarImage src={profileUser?.profileImageUrl} alt={profileUser?.username} />
                  <AvatarFallback className="text-4xl">
                    {profileUser?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h1 className="text-4xl font-bold mb-2 sm:mb-0" data-testid={`text-profile-username-${profileUser?.username}`}>
                      {profileUser?.username}
                    </h1>
                    
                    <div className="flex space-x-2">
                      {!isOwnProfile && profileUser?.id && (
                        <Button
                          onClick={() => followMutation.mutate()}
                          disabled={followMutation.isPending}
                          className={isFollowing 
                            ? "bg-gray-600 hover:bg-gray-700" 
                            : "bg-primary-purple hover:bg-purple-700"
                          }
                          data-testid={`button-follow-${profileUser?.username}`}
                        >
                          {isFollowing ? (
                            <>
                              <UserMinus className="h-4 w-4 mr-2" />
                              Unfollow
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Follow
                            </>
                          )}
                        </Button>
                      )}
                      
                      {isOwnProfile && (
                        <>
                          <Button
                            onClick={() => setLocation("/studio")}
                            className="bg-primary-purple hover:bg-purple-700"
                            data-testid="button-studio"
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Studio
                          </Button>
                          <Button
                            variant="outline"
                            className="border-gray-600 hover:bg-elevated"
                            data-testid="button-edit-profile"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-6 text-gray-300 mb-4">
                    <div className="flex items-center" data-testid={`text-followers-count-${profileUser?.username}`}>
                      <Users className="h-5 w-5 mr-2" />
                      {followersArray.length} followers
                    </div>
                    <div className="flex items-center" data-testid={`text-following-count-${profileUser?.username}`}>
                      <UserPlus className="h-5 w-5 mr-2" />
                      {followingArray.length} following
                    </div>
                    <div className="flex items-center" data-testid={`text-videos-count-${profileUser?.username}`}>
                      <Video className="h-5 w-5 mr-2" />
                      {videosArray.length} videos
                    </div>
                    <div className="flex items-center" data-testid={`text-join-date-${profileUser?.username}`}>
                      <Calendar className="h-5 w-5 mr-2" />
                      Joined {profileUser?.createdAt && formatDistanceToNow(new Date(profileUser.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  
                  {(profileUser?.firstName || profileUser?.lastName) && (
                    <p className="text-gray-300" data-testid={`text-profile-name-${profileUser?.username}`}>
                      {profileUser.firstName} {profileUser.lastName}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card-bg">
            <TabsTrigger value="videos" data-testid="tab-videos">Videos</TabsTrigger>
            <TabsTrigger value="streams" data-testid="tab-streams">Streams</TabsTrigger>
          </TabsList>
          
          <TabsContent value="videos" className="mt-6">
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
            ) : videosArray.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videosArray.map((video: any) => (
                  <VideoCard
                    key={video.id}
                    id={video.id}
                    title={video.title}
                    thumbnailUrl={video.thumbnailUrl}
                    duration={video.duration}
                    viewCount={video.viewCount}
                    createdAt={video.createdAt}
                    user={{
                      username: profileUser?.username || "Unknown",
                      profileImageUrl: profileUser?.profileImageUrl,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16" data-testid="text-no-videos">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Video className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">No Videos Yet</h3>
                <p className="text-gray-400 mb-6">
                  {isOwnProfile 
                    ? "Upload your first video to get started!" 
                    : `${profileUser?.username} hasn't uploaded any videos yet.`
                  }
                </p>
                {isOwnProfile && (
                  <Button className="bg-primary-purple hover:bg-purple-700">
                    <Video className="h-4 w-4 mr-2" />
                    Upload Video
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="streams" className="mt-6">
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
            ) : streamsArray.length > 0 ? (
              <div className="space-y-6">
                {/* Current Live Stream */}
                {streamsArray.filter((s: any) => s.isLive).length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center">
                      <div className="w-2 h-2 bg-live-red rounded-full mr-3 animate-pulse" />
                      Currently Live
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {streamsArray
                        .filter((s: any) => s.isLive)
                        .map((stream: any) => (
                          <LiveStreamCard
                            key={stream.id}
                            id={stream.id}
                            title={stream.title}
                            category={stream.category || "General"}
                            viewerCount={stream.viewerCount}
                            startedAt={stream.startedAt}
                            user={{
                              username: profileUser?.username || "Unknown",
                              profileImageUrl: profileUser?.profileImageUrl,
                            }}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Past Streams */}
                {streamsArray.filter((s: any) => !s.isLive).length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold mb-4">Past Streams</h3>
                    <div className="space-y-4">
                      {streamsArray
                        .filter((s: any) => !s.isLive)
                        .map((stream: any) => (
                          <div key={stream.id} className="bg-card-bg rounded-xl p-4 flex items-center space-x-4">
                            <div className="w-24 h-16 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                              <Video className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1" data-testid={`text-past-stream-title-${stream.id}`}>
                                {stream.title}
                              </h4>
                              <p className="text-gray-400 text-sm">
                                {stream.category} • Streamed {stream.endedAt && formatDistanceToNow(new Date(stream.endedAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16" data-testid="text-no-streams">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Video className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">No Streams Yet</h3>
                <p className="text-gray-400 mb-6">
                  {isOwnProfile 
                    ? "Start your first live stream to connect with your audience!" 
                    : `${profileUser?.username} hasn't streamed yet.`
                  }
                </p>
                {isOwnProfile && (
                  <Button className="bg-primary-purple hover:bg-purple-700">
                    <Video className="h-4 w-4 mr-2" />
                    Go Live
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
