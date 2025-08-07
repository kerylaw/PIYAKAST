import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Video, Clock, Users, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface Playlist {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  videoCount: number;
  totalDuration: number;
  createdAt: string;
  updatedAt: string;
}

interface PlaylistFormData {
  title: string;
  description: string;
  isPublic: boolean;
}

export default function PlaylistManagement() {
  const { user } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [formData, setFormData] = useState<PlaylistFormData>({
    title: "",
    description: "",
    isPublic: true,
  });
  const queryClient = useQueryClient();

  // Fetch user's playlists
  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ["/api/playlists", user?.id],
    enabled: !!user?.id,
  });

  // Create playlist mutation
  const createPlaylistMutation = useMutation({
    mutationFn: async (data: PlaylistFormData) => {
      const response = await apiRequest("POST", "/api/playlists", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "플레이리스트 생성 완료",
        description: "새 플레이리스트가 성공적으로 생성되었습니다.",
      });
      setShowCreateDialog(false);
      setFormData({ title: "", description: "", isPublic: true });
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
    },
    onError: (error: Error) => {
      toast({
        title: "플레이리스트 생성 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update playlist mutation
  const updatePlaylistMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PlaylistFormData }) => {
      const response = await apiRequest("PUT", `/api/playlists/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "플레이리스트 수정 완료",
        description: "플레이리스트가 성공적으로 수정되었습니다.",
      });
      setEditingPlaylist(null);
      setFormData({ title: "", description: "", isPublic: true });
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
    },
    onError: (error: Error) => {
      toast({
        title: "플레이리스트 수정 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete playlist mutation
  const deletePlaylistMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/playlists/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "플레이리스트 삭제 완료",
        description: "플레이리스트가 성공적으로 삭제되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
    },
    onError: (error: Error) => {
      toast({
        title: "플레이리스트 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: "제목을 입력해주세요",
        description: "플레이리스트 제목은 필수입니다.",
        variant: "destructive",
      });
      return;
    }

    if (editingPlaylist) {
      updatePlaylistMutation.mutate({ id: editingPlaylist.id, data: formData });
    } else {
      createPlaylistMutation.mutate(formData);
    }
  };

  const handleEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setFormData({
      title: playlist.title,
      description: playlist.description || "",
      isPublic: playlist.isPublic,
    });
    setShowCreateDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("정말로 이 플레이리스트를 삭제하시겠습니까?")) {
      deletePlaylistMutation.mutate(id);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", isPublic: true });
    setEditingPlaylist(null);
    setShowCreateDialog(false);
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">플레이리스트 관리</h2>
          <p className="text-gray-400 mt-1">
            동영상을 주제별로 정리하고 관리하세요
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(open) => open ? setShowCreateDialog(true) : resetForm()}>
          <DialogTrigger asChild>
            <Button className="bg-primary-purple hover:bg-purple-700" data-testid="button-create-playlist">
              <Plus className="h-4 w-4 mr-2" />
              플레이리스트 만들기
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPlaylist ? "플레이리스트 수정" : "새 플레이리스트 만들기"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="플레이리스트 제목을 입력하세요"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="플레이리스트에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="public"
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="public">공개 플레이리스트</Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={createPlaylistMutation.isPending || updatePlaylistMutation.isPending}
                >
                  {editingPlaylist ? "수정" : "생성"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">총 플레이리스트</p>
                <p className="text-2xl font-bold">{playlists.length}</p>
              </div>
              <Video className="h-8 w-8 text-primary-purple" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">총 동영상</p>
                <p className="text-2xl font-bold">
                  {playlists.reduce((sum: number, playlist: any) => sum + (playlist.videoCount || 0), 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary-purple" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">총 재생시간</p>
                <p className="text-2xl font-bold">
                  {formatDuration(playlists.reduce((sum: number, playlist: any) => sum + (playlist.totalDuration || 0), 0))}
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary-purple" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Playlists List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {playlists.map((playlist: any) => (
          <Card key={playlist.id} className="overflow-hidden">
            <div className="aspect-video bg-gray-800 flex items-center justify-center">
              {playlist.thumbnailUrl ? (
                <img
                  src={playlist.thumbnailUrl}
                  alt={playlist.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Video className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold truncate flex-1" data-testid={`playlist-title-${playlist.id}`}>
                  {playlist.title}
                </h3>
                <div className="flex space-x-2 ml-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(playlist)}
                    data-testid={`button-edit-playlist-${playlist.id}`}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(playlist.id)}
                    data-testid={`button-delete-playlist-${playlist.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {playlist.description && (
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                  {playlist.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                <span>{playlist.videoCount}개 동영상</span>
                <span>{formatDuration(playlist.totalDuration)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <Badge variant={playlist.isPublic ? "default" : "secondary"}>
                  {playlist.isPublic ? "공개" : "비공개"}
                </Badge>
                <span className="text-xs text-gray-500">
                  {new Date(playlist.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {playlists.length === 0 && (
        <Card className="p-8 text-center">
          <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">플레이리스트가 없습니다</h3>
          <p className="text-gray-400 mb-4">
            첫 번째 플레이리스트를 만들어 동영상을 주제별로 정리해보세요
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            플레이리스트 만들기
          </Button>
        </Card>
      )}
    </div>
  );
}