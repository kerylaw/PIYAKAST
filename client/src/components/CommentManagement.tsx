import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Trash2, Pin, PinOff, Heart, Flag, Search, Filter } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface Comment {
  id: string;
  content: string;
  videoId?: string;
  streamId?: string;
  userId: string;
  likeCount: number;
  dislikeCount: number;
  isHearted: boolean;
  isPinned: boolean;
  isEdited: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    profileImageUrl?: string;
  };
  video?: {
    id: string;
    title: string;
  };
  stream?: {
    id: string;
    title: string;
  };
}

export default function CommentManagement() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const queryClient = useQueryClient();

  // Fetch comments on user's content
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["/api/comments/my-content", user?.id],
    enabled: !!user?.id,
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await apiRequest("DELETE", `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      toast({
        title: "댓글 삭제 완료",
        description: "댓글이 성공적으로 삭제되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/comments/my-content"] });
    },
    onError: (error: Error) => {
      toast({
        title: "댓글 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Pin comment mutation
  const pinCommentMutation = useMutation({
    mutationFn: async ({ commentId, isPinned }: { commentId: string; isPinned: boolean }) => {
      await apiRequest("PATCH", `/api/comments/${commentId}/pin`, { isPinned });
    },
    onSuccess: () => {
      toast({
        title: "댓글 고정 상태 변경",
        description: "댓글 고정 상태가 변경되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/comments/my-content"] });
    },
    onError: (error: Error) => {
      toast({
        title: "댓글 고정 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Heart comment mutation
  const heartCommentMutation = useMutation({
    mutationFn: async ({ commentId, isHearted }: { commentId: string; isHearted: boolean }) => {
      await apiRequest("PATCH", `/api/comments/${commentId}/heart`, { isHearted });
    },
    onSuccess: () => {
      toast({
        title: "댓글 하트 상태 변경",
        description: "댓글 하트 상태가 변경되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/comments/my-content"] });
    },
    onError: (error: Error) => {
      toast({
        title: "댓글 하트 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredComments = comments.filter((comment: Comment) => {
    const matchesSearch = comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comment.user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (activeFilter) {
      case "pinned":
        return comment.isPinned;
      case "hearted":
        return comment.isHearted;
      case "reported":
        return false; // Would need to implement reporting system
      default:
        return true;
    }
  });

  const handleDeleteComment = (commentId: string) => {
    if (confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const handlePinComment = (commentId: string, isPinned: boolean) => {
    pinCommentMutation.mutate({ commentId, isPinned: !isPinned });
  };

  const handleHeartComment = (commentId: string, isHearted: boolean) => {
    heartCommentMutation.mutate({ commentId, isHearted: !isHearted });
  };

  const getCommentStats = () => {
    const total = comments.length;
    const pinned = comments.filter((c: Comment) => c.isPinned).length;
    const hearted = comments.filter((c: Comment) => c.isHearted).length;
    const totalLikes = comments.reduce((sum: number, c: Comment) => sum + c.likeCount, 0);
    
    return { total, pinned, hearted, totalLikes };
  };

  const stats = getCommentStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">댓글 관리</h2>
        <p className="text-gray-400 mt-1">
          내 콘텐츠에 달린 댓글을 관리하고 조절하세요
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">총 댓글</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-primary-purple" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">고정된 댓글</p>
                <p className="text-2xl font-bold">{stats.pinned}</p>
              </div>
              <Pin className="h-8 w-8 text-primary-purple" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">하트 표시</p>
                <p className="text-2xl font-bold">{stats.hearted}</p>
              </div>
              <Heart className="h-8 w-8 text-primary-purple" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">총 좋아요</p>
                <p className="text-2xl font-bold">{stats.totalLikes}</p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="댓글 내용이나 사용자명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-auto">
              <TabsList>
                <TabsTrigger value="all">전체</TabsTrigger>
                <TabsTrigger value="pinned">고정됨</TabsTrigger>
                <TabsTrigger value="hearted">하트표시</TabsTrigger>
                <TabsTrigger value="reported">신고됨</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {filteredComments.map((comment: Comment) => (
          <Card key={comment.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex space-x-3 flex-1">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    {comment.user.profileImageUrl ? (
                      <img
                        src={comment.user.profileImageUrl}
                        alt={comment.user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {comment.user.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{comment.user.username}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                      {comment.isPinned && (
                        <Badge variant="secondary" className="text-xs">
                          <Pin className="h-3 w-3 mr-1" />
                          고정됨
                        </Badge>
                      )}
                      {comment.isHearted && (
                        <Badge variant="secondary" className="text-xs">
                          <Heart className="h-3 w-3 mr-1 text-red-500" />
                          하트
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm mb-2" data-testid={`comment-content-${comment.id}`}>
                      {comment.content}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span>좋아요 {comment.likeCount}개</span>
                      {comment.video && (
                        <span>동영상: {comment.video.title}</span>
                      )}
                      {comment.stream && (
                        <span>라이브: {comment.stream.title}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleHeartComment(comment.id, comment.isHearted)}
                    className={comment.isHearted ? "text-red-500" : ""}
                    data-testid={`button-heart-comment-${comment.id}`}
                  >
                    <Heart className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePinComment(comment.id, comment.isPinned)}
                    data-testid={`button-pin-comment-${comment.id}`}
                  >
                    {comment.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteComment(comment.id)}
                    data-testid={`button-delete-comment-${comment.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredComments.length === 0 && (
        <Card className="p-8 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm || activeFilter !== "all" ? "검색 결과가 없습니다" : "댓글이 없습니다"}
          </h3>
          <p className="text-gray-400">
            {searchTerm || activeFilter !== "all" 
              ? "다른 검색어나 필터를 시도해보세요" 
              : "아직 내 콘텐츠에 댓글이 달리지 않았습니다"}
          </p>
        </Card>
      )}
    </div>
  );
}