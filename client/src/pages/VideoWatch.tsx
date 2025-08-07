import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThumbsUp, ThumbsDown, Share2, Flag, UserPlus, Shield, AlertTriangle } from "lucide-react";
import Layout from "@/components/Layout";
import VideoPlayer from "@/components/VideoPlayer";
import VideoCard from "@/components/VideoCard";
import SubscribeButton from "@/components/SubscribeButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Video, Comment, User } from "@shared/schema";

interface VideoWithUser extends Video {
  user: User;
}

interface CommentWithUser extends Comment {
  user: User;
}

interface VideoLikes {
  likes: number;
  dislikes: number;
}

export default function VideoWatch() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [showCopyrightDialog, setShowCopyrightDialog] = useState(false);
  const [copyrightForm, setCopyrightForm] = useState({
    claimType: "",
    rightsOwnerType: "",
    copyrightOwner: "",
    description: "",
    evidence: "",
    contactEmail: user?.email || "",
  });

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
  const { data: video, isLoading: videoLoading, error: videoError } = useQuery<VideoWithUser>({
    queryKey: ["/api/videos", id],
    enabled: !!id && isAuthenticated,
  });

  // Fetch video comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/videos", id, "comments"],
    enabled: !!id && isAuthenticated,
  });

  // Fetch video likes
  const { data: likes } = useQuery<VideoLikes>({
    queryKey: ["/api/videos", id, "likes"],
    enabled: !!id && isAuthenticated,
  });

  // Fetch related videos
  const { data: relatedVideos = [] } = useQuery<VideoWithUser[]>({
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

  // Copyright report mutation
  const copyrightReportMutation = useMutation({
    mutationFn: async (reportData: any) => {
      return await apiRequest("POST", `/api/videos/${id}/copyright-report`, reportData);
    },
    onSuccess: () => {
      toast({
        title: "저작권 신고 접수 완료",
        description: "신고가 성공적으로 접수되었습니다. 검토 후 처리될 예정입니다.",
      });
      setShowCopyrightDialog(false);
      setCopyrightForm({
        claimType: "",
        rightsOwnerType: "",
        copyrightOwner: "",
        description: "",
        evidence: "",
        contactEmail: user?.email || "",
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
        title: "신고 접수 실패",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    commentMutation.mutate(newComment);
  };

  const handleCopyrightReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copyrightForm.claimType || !copyrightForm.rightsOwnerType || !copyrightForm.copyrightOwner.trim() || !copyrightForm.description.trim() || !copyrightForm.contactEmail.trim()) {
      toast({
        title: "필수 정보 누락",
        description: "모든 필수 항목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    copyrightReportMutation.mutate({
      ...copyrightForm,
      videoId: id,
    });
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
                      {video?.userId !== user?.id && (
                        <Dialog open={showCopyrightDialog} onOpenChange={setShowCopyrightDialog}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-600 hover:bg-elevated text-orange-400 hover:text-orange-300"
                              data-testid={`button-copyright-report-${video?.id}`}
                            >
                              <Flag className="h-4 w-4 mr-1" />
                              신고
                            </Button>
                          </DialogTrigger>
                        </Dialog>
                      )}
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
                  <SubscribeButton 
                    channelId={video?.userId || ""}
                    channelName={video?.user?.username}
                    size="default"
                  />
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

        {/* Copyright Report Dialog */}
        <Dialog open={showCopyrightDialog} onOpenChange={setShowCopyrightDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-400" />
                저작권 침해 신고
              </DialogTitle>
            </DialogHeader>
            {video && (
              <form onSubmit={handleCopyrightReport} className="space-y-6">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                        신고 대상 동영상
                      </h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        {video.title}
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        업로더: {video.user?.username}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="claimType">침해 유형 *</Label>
                  <Select value={copyrightForm.claimType} onValueChange={(value) => setCopyrightForm(prev => ({ ...prev, claimType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="침해 유형을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="music">음악</SelectItem>
                      <SelectItem value="video">영상</SelectItem>
                      <SelectItem value="image">이미지</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>권리자 구분 *</Label>
                  <RadioGroup value={copyrightForm.rightsOwnerType} onValueChange={(value) => setCopyrightForm(prev => ({ ...prev, rightsOwnerType: value }))}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="myself" id="myself" />
                      <Label htmlFor="myself">본인 (저작권자 본인)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="representative" id="representative" />
                      <Label htmlFor="representative">대리인 (저작권자의 대리인)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="copyrightOwner">저작권자 정보 *</Label>
                  <Input
                    id="copyrightOwner"
                    value={copyrightForm.copyrightOwner}
                    onChange={(e) => setCopyrightForm(prev => ({ ...prev, copyrightOwner: e.target.value }))}
                    placeholder="저작권자의 성명 또는 회사명을 입력하세요"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">신고 사유 *</Label>
                  <Textarea
                    id="description"
                    value={copyrightForm.description}
                    onChange={(e) => setCopyrightForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="저작권 침해에 대한 구체적인 사유를 설명해주세요..."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="evidence">증거 자료</Label>
                  <Textarea
                    id="evidence"
                    value={copyrightForm.evidence}
                    onChange={(e) => setCopyrightForm(prev => ({ ...prev, evidence: e.target.value }))}
                    placeholder="원본 저작물의 URL, 등록번호, 기타 증거 자료를 제공해주세요..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">연락처 이메일 *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={copyrightForm.contactEmail}
                    onChange={(e) => setCopyrightForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="연락 가능한 이메일 주소를 입력하세요"
                    required
                  />
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    • 허위 신고는 법적 처벌을 받을 수 있습니다.<br />
                    • 신고 처리 결과는 제공해주신 이메일로 안내됩니다.<br />
                    • 보다 정확한 검토를 위해 추가 자료를 요청할 수 있습니다.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCopyrightDialog(false)}
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={copyrightReportMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {copyrightReportMutation.isPending ? "접수 중..." : "신고 접수"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
