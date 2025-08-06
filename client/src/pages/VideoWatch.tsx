import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThumbsUp, ThumbsDown, Share2, Flag, UserPlus } from "lucide-react";
import Layout from "@/components/Layout";
import VideoPlayer from "@/components/VideoPlayer";
import VideoCard from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

export default function VideoWatch() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You need to log in to watch videos. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, toast]);

  // Fetch video details
  const { data: video, isLoading: videoLoading, error: videoError } = useQuery({
    queryKey: ["/api/videos", id],
    enabled: !!id && isAuthenticated,
  });

  // Fetch video comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["/api/videos", id, "comments"],
    enabled: !!id && isAuthenticated,
  });

  // Fetch video likes
  const { data: likes } = useQuery({
    queryKey: ["/api/videos", id, "likes"],
    enabled: !!id && isAuthenticated,
  });

  // Fetch related videos
  const { data: relatedVideos = [] } = useQuery({
    queryKey: ["/api/videos"],
    enabled: !!id && isAuthenticated,
  });

  // Like/dislike mutation
  const likeMutation = useMutation({
    mutationFn: async (isLike: boolean) => {
      return await apiRequest("POST", `/api/videos/${id}/like`, { isLike });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos", id, "likes"] });
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
        description: "Failed to update like status",
        variant: "destructive",
      });
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/videos/${id}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos", id, "comments"] });
      setNewComment("");
      toast({
        title: "Success",
        description: "Comment added successfully",
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
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/users/${video?.userId}/follow`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Successfully followed user",
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
        description: "Failed to follow user",
        variant: "destructive",
      });
    },
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    commentMutation.mutate(newComment);
  };

  const formatViewCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (videoError) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Video Not Found</h2>
            <p className="text-gray-400 mb-4">The video you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="mb-6">
              {videoLoading ? (
                <Skeleton className="w-full aspect-video bg-gray-700 rounded-xl" />
              ) : (
                <div className="bg-black rounded-xl overflow-hidden">
                  <VideoPlayer
                    src={video?.videoUrl}
                    title={video?.title || ""}
                    className="aspect-video"
                  />
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="mb-6">
              {videoLoading ? (
                <div>
                  <Skeleton className="h-8 bg-gray-700 mb-4" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 bg-gray-700 w-48" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-10 w-20 bg-gray-700 rounded" />
                      <Skeleton className="h-10 w-20 bg-gray-700 rounded" />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl font-bold mb-4" data-testid={`text-video-title-${video?.id}`}>
                    {video?.title}
                  </h1>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-4 text-gray-400">
                      <span data-testid={`text-video-views-${video?.id}`}>
                        {formatViewCount(video?.viewCount || 0)} views
                      </span>
                      <span>•</span>
                      <span data-testid={`text-video-date-${video?.id}`}>
                        {video?.createdAt && formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => likeMutation.mutate(true)}
                        disabled={likeMutation.isPending}
                        className="border-gray-600 hover:bg-elevated"
                        data-testid={`button-like-${video?.id}`}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {likes?.likes || 0}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => likeMutation.mutate(false)}
                        disabled={likeMutation.isPending}
                        className="border-gray-600 hover:bg-elevated"
                        data-testid={`button-dislike-${video?.id}`}
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        {likes?.dislikes || 0}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-600 hover:bg-elevated"
                        data-testid={`button-share-${video?.id}`}
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Creator Info */}
            <div className="bg-card-bg rounded-xl p-6 mb-6">
              {videoLoading ? (
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-12 h-12 rounded-full bg-gray-700" />
                  <div className="flex-1">
                    <Skeleton className="h-4 bg-gray-700 w-32 mb-2" />
                    <Skeleton className="h-3 bg-gray-700 w-24" />
                  </div>
                  <Skeleton className="h-10 w-20 bg-gray-700 rounded" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Link href={`/profile/${video?.user?.username}`}>
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={video?.user?.profileImageUrl} alt={video?.user?.username} />
                        <AvatarFallback>{video?.user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div>
                      <Link 
                        href={`/profile/${video?.user?.username}`}
                        className="font-semibold hover:text-primary-purple transition-colors"
                        data-testid={`link-creator-${video?.user?.username}`}
                      >
                        {video?.user?.username}
                      </Link>
                      <p className="text-gray-400 text-sm">Content Creator</p>
                    </div>
                  </div>
                  {video?.userId !== user?.id && (
                    <Button
                      onClick={() => followMutation.mutate()}
                      disabled={followMutation.isPending}
                      className="bg-primary-purple hover:bg-purple-700"
                      data-testid={`button-follow-${video?.user?.username}`}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow
                    </Button>
                  )}
                </div>
              )}
              
              {video?.description && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-gray-300 whitespace-pre-wrap" data-testid={`text-video-description-${video?.id}`}>
                    {video.description}
                  </p>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="bg-card-bg rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4" data-testid="text-comments-title">
                Comments ({comments.length})
              </h3>
              
              {/* Add Comment Form */}
              {isAuthenticated && (
                <form onSubmit={handleAddComment} className="mb-6">
                  <div className="flex space-x-4">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={user?.profileImageUrl} alt={user?.username} />
                      <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="bg-elevated border-gray-600 text-white resize-none"
                        rows={3}
                        data-testid="textarea-new-comment"
                      />
                      <div className="flex justify-end mt-2 space-x-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setNewComment("")}
                          data-testid="button-cancel-comment"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={!newComment.trim() || commentMutation.isPending}
                          className="bg-primary-purple hover:bg-purple-700"
                          data-testid="button-submit-comment"
                        >
                          {commentMutation.isPending ? "Posting..." : "Comment"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {commentsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      <Skeleton className="w-8 h-8 rounded-full bg-gray-700" />
                      <div className="flex-1">
                        <Skeleton className="h-3 bg-gray-700 w-24 mb-2" />
                        <Skeleton className="h-4 bg-gray-700 w-full mb-1" />
                        <Skeleton className="h-4 bg-gray-700 w-3/4" />
                      </div>
                    </div>
                  ))
                ) : comments.length > 0 ? (
                  comments.map((comment: any) => (
                    <div key={comment.id} className="flex space-x-4" data-testid={`comment-${comment.id}`}>
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={comment.user?.profileImageUrl} alt={comment.user?.username} />
                        <AvatarFallback>{comment.user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm" data-testid={`text-comment-author-${comment.id}`}>
                            {comment.user?.username}
                          </span>
                          <span className="text-xs text-gray-400" data-testid={`text-comment-date-${comment.id}`}>
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm" data-testid={`text-comment-content-${comment.id}`}>
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8" data-testid="text-no-comments">
                    <p className="text-gray-400">No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Related Videos */}
          <div className="lg:col-span-1">
            <h3 className="text-xl font-bold mb-4">Related Videos</h3>
            <div className="space-y-4">
              {relatedVideos
                .filter((v: any) => v.id !== id)
                .slice(0, 10)
                .map((relatedVideo: any) => (
                  <div key={relatedVideo.id} className="flex space-x-3 bg-card-bg rounded-lg p-3 hover:bg-elevated transition-colors">
                    <Link href={`/watch/${relatedVideo.id}`} className="flex-shrink-0">
                      <img 
                        src={relatedVideo.thumbnailUrl || "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&w=160&h=90&fit=crop"}
                        alt={relatedVideo.title}
                        className="w-40 h-24 object-cover rounded"
                        data-testid={`img-related-video-${relatedVideo.id}`}
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/watch/${relatedVideo.id}`}>
                        <h4 className="font-medium text-sm line-clamp-2 hover:text-primary-purple transition-colors mb-1" data-testid={`text-related-video-title-${relatedVideo.id}`}>
                          {relatedVideo.title}
                        </h4>
                      </Link>
                      <p className="text-xs text-gray-400 mb-1" data-testid={`text-related-video-creator-${relatedVideo.id}`}>
                        {relatedVideo.user?.username}
                      </p>
                      <div className="text-xs text-gray-500">
                        <span>{formatViewCount(relatedVideo.viewCount)} views</span>
                        <span className="mx-1">•</span>
                        <span>{formatDistanceToNow(new Date(relatedVideo.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
