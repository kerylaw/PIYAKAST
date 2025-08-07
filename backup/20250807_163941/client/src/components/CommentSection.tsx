import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ThumbsUp, 
  ThumbsDown, 
  Reply, 
  Heart, 
  Pin, 
  MoreVertical,
  Send 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  userId: string;
  content: string;
  likeCount: number;
  dislikeCount: number;
  isHearted: boolean;
  isPinned: boolean;
  isEdited: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
  replies?: Comment[];
}

interface CommentSectionProps {
  videoId?: string;
  streamId?: string;
  isCreator?: boolean;
}

export function CommentSection({ videoId, streamId, isCreator }: CommentSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  
  const queryKey = videoId ? ["comments", "video", videoId] : ["comments", "stream", streamId];
  
  const { data: comments, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const url = videoId 
        ? `/api/videos/${videoId}/comments` 
        : `/api/streams/${streamId}/comments`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("댓글을 불러올 수 없습니다");
      return response.json();
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: { content: string; parentId?: string }) => {
      const url = videoId 
        ? `/api/videos/${videoId}/comments` 
        : `/api/streams/${streamId}/comments`;
      const response = await apiRequest("POST", url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setNewComment("");
      setReplyingTo(null);
      setReplyText("");
      toast({
        title: "댓글 작성 완료",
        description: "댓글이 성공적으로 작성되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "댓글 작성 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: async ({ commentId, isLike }: { commentId: string; isLike: boolean }) => {
      const response = await apiRequest("POST", `/api/comments/${commentId}/like`, { isLike });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const pinCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await apiRequest("PATCH", `/api/comments/${commentId}/pin`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "댓글 고정 완료",
        description: "댓글이 상단에 고정되었습니다.",
      });
    },
  });

  const heartCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await apiRequest("PATCH", `/api/comments/${commentId}/heart`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim() || !user) return;
    createCommentMutation.mutate({ content: newComment.trim() });
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyText.trim() || !user) return;
    createCommentMutation.mutate({ content: replyText.trim(), parentId });
  };

  const handleLikeComment = (commentId: string, isLike: boolean) => {
    if (!user) return;
    likeCommentMutation.mutate({ commentId, isLike });
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          댓글을 작성하려면 로그인이 필요합니다.
        </p>
        <Button onClick={() => window.location.href = "/auth"} data-testid="button-login">
          로그인하기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comment Input */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.profileImageUrl || ""} />
              <AvatarFallback>
                {user.firstName?.charAt(0) || user.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 작성해보세요..."
                className="min-h-[80px] resize-none"
                data-testid="textarea-comment"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewComment("")}
                  disabled={!newComment.trim()}
                  data-testid="button-cancel-comment"
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || createCommentMutation.isPending}
                  data-testid="button-submit-comment"
                >
                  {createCommentMutation.isPending ? "작성 중..." : "댓글"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {comments?.map((comment: Comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isCreator={isCreator}
              onLike={handleLikeComment}
              onReply={(commentId: string) => setReplyingTo(commentId)}
              onPin={isCreator ? pinCommentMutation.mutate : undefined}
              onHeart={isCreator ? heartCommentMutation.mutate : undefined}
              replyingTo={replyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              onSubmitReply={handleSubmitReply}
              onCancelReply={() => {
                setReplyingTo(null);
                setReplyText("");
              }}
            />
          ))}
          {comments?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  isCreator?: boolean;
  onLike: (commentId: string, isLike: boolean) => void;
  onReply: (commentId: string) => void;
  onPin?: (commentId: string) => void;
  onHeart?: (commentId: string) => void;
  replyingTo: string | null;
  replyText: string;
  setReplyText: (text: string) => void;
  onSubmitReply: (parentId: string) => void;
  onCancelReply: () => void;
}

function CommentItem({
  comment,
  isCreator,
  onLike,
  onReply,
  onPin,
  onHeart,
  replyingTo,
  replyText,
  setReplyText,
  onSubmitReply,
  onCancelReply,
}: CommentItemProps) {
  const { user } = useAuth();

  return (
    <div className="space-y-3">
      <div className={`flex gap-3 ${comment.isPinned ? 'bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg' : ''}`}>
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.user.profileImageUrl || ""} />
          <AvatarFallback>
            {comment.user.firstName?.charAt(0) || comment.user.username?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {comment.user.firstName} {comment.user.lastName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              @{comment.user.username}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(comment.createdAt), { 
                addSuffix: true, 
                locale: ko 
              })}
            </span>
            {comment.isPinned && (
              <Badge variant="secondary" className="text-xs">
                <Pin className="w-3 h-3 mr-1" />
                고정됨
              </Badge>
            )}
            {comment.isHearted && (
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            )}
          </div>
          
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={() => onLike(comment.id, true)}
              data-testid={`button-like-${comment.id}`}
            >
              <ThumbsUp className="w-3 h-3 mr-1" />
              {comment.likeCount || 0}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={() => onLike(comment.id, false)}
              data-testid={`button-dislike-${comment.id}`}
            >
              <ThumbsDown className="w-3 h-3 mr-1" />
              {comment.dislikeCount || 0}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={() => onReply(comment.id)}
              data-testid={`button-reply-${comment.id}`}
            >
              <Reply className="w-3 h-3 mr-1" />
              답글
            </Button>
            
            {isCreator && user?.id !== comment.userId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto p-1">
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {onPin && (
                    <DropdownMenuItem onClick={() => onPin(comment.id)}>
                      <Pin className="w-4 h-4 mr-2" />
                      {comment.isPinned ? "고정 해제" : "댓글 고정"}
                    </DropdownMenuItem>
                  )}
                  {onHeart && (
                    <DropdownMenuItem onClick={() => onHeart(comment.id)}>
                      <Heart className="w-4 h-4 mr-2" />
                      {comment.isHearted ? "하트 해제" : "하트 주기"}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Reply Input */}
      {replyingTo === comment.id && (
        <div className="ml-11">
          <Card>
            <CardContent className="p-3">
              <div className="flex gap-3">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={user?.profileImageUrl || ""} />
                  <AvatarFallback>
                    {user?.firstName?.charAt(0) || user?.username?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`@${comment.user.username}님에게 답글...`}
                    className="min-h-[60px] resize-none text-sm"
                    data-testid={`textarea-reply-${comment.id}`}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onCancelReply}
                      data-testid="button-cancel-reply"
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onSubmitReply(comment.id)}
                      disabled={!replyText.trim()}
                      data-testid="button-submit-reply"
                    >
                      답글
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 space-y-3 border-l-2 border-gray-100 dark:border-gray-800 pl-4">
          {comment.replies.map((reply: Comment) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isCreator={isCreator}
              onLike={onLike}
              onReply={onReply}
              onPin={onPin}
              onHeart={onHeart}
              replyingTo={replyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}