import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Eye, EyeOff, Play, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface StreamInfo {
  id: string;
  title: string;
  description: string;
  category: string;
  isLive: boolean;
  rtmpUrl?: string;
  streamKey?: string;
  peertubeEmbedUrl?: string;
  viewerCount: number;
}

interface LiveStreamSetupProps {
  onStreamCreated?: (stream: StreamInfo) => void;
}

const categories = [
  'K-Beauty',
  'K-Pop', 
  'K-Drama',
  'K-Movie',
  'K-Food',
  'Gaming',
  'Technology',
  'Education',
  'Entertainment',
  'Music'
];

export function LiveStreamSetup({ onStreamCreated }: LiveStreamSetupProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [createdStream, setCreatedStream] = useState<StreamInfo | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createStreamMutation = useMutation({
    mutationFn: async (streamData: { title: string; description: string; category: string }) => {
      const response = await apiRequest('POST', '/api/streams', streamData);
      return response.json();
    },
    onSuccess: (stream: StreamInfo) => {
      setCreatedStream(stream);
      onStreamCreated?.(stream);
      queryClient.invalidateQueries({ queryKey: ['/api/streams/live'] });
      
      toast({
        title: "라이브 스트림 생성 완료",
        description: "스트리밍 설정이 완료되었습니다. OBS에서 설정을 확인하세요.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "스트림 생성 실패",
        description: error.message || "스트림을 생성할 수 없습니다.",
        variant: "destructive",
      });
    },
  });

  const startStreamMutation = useMutation({
    mutationFn: async (streamId: string) => {
      const response = await apiRequest('PUT', `/api/streams/${streamId}/start`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "라이브 스트림 시작",
        description: "스트림이 시작되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/streams/live'] });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "복사 완료",
      description: `${label}이(가) 클립보드에 복사되었습니다.`,
    });
  };

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "제목 필수",
        description: "스트림 제목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!category) {
      toast({
        title: "카테고리 필수", 
        description: "카테고리를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    createStreamMutation.mutate({ title, description, category });
  };

  return (
    <div className="space-y-6" data-testid="live-stream-setup">
      {!createdStream ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              라이브 스트림 설정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateStream} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  스트림 제목 *
                </label>
                <Input
                  type="text"
                  placeholder="라이브 스트림 제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="input-stream-title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  설명
                </label>
                <Textarea
                  placeholder="스트림에 대한 설명을 입력하세요 (선택사항)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  data-testid="textarea-stream-description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  카테고리 *
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger data-testid="select-stream-category">
                    <SelectValue placeholder="카테고리를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createStreamMutation.isPending}
                data-testid="button-create-stream"
              >
                {createStreamMutation.isPending ? '스트림 생성 중...' : '스트림 생성'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Stream Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>스트림 정보</span>
                <Badge variant={createdStream.isLive ? "default" : "secondary"}>
                  {createdStream.isLive ? "라이브" : "대기"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <strong>제목:</strong> {createdStream.title}
              </div>
              <div>
                <strong>카테고리:</strong> {createdStream.category}
              </div>
              {createdStream.description && (
                <div>
                  <strong>설명:</strong> {createdStream.description}
                </div>
              )}
              <div className="flex items-center gap-2">
                <strong>시청자:</strong> 
                <span data-testid="text-viewer-count">{createdStream.viewerCount}</span>
              </div>
            </CardContent>
          </Card>

          {/* OBS Settings */}
          {(createdStream.rtmpUrl || createdStream.streamKey) && (
            <Card>
              <CardHeader>
                <CardTitle>OBS Studio 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    서버 URL (RTMP)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={createdStream.rtmpUrl || 'rtmp://localhost/live'}
                      readOnly
                      className="font-mono text-sm"
                      data-testid="input-rtmp-url"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(createdStream.rtmpUrl || 'rtmp://localhost/live', 'RTMP URL')}
                      data-testid="button-copy-rtmp"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    스트림 키
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type={showStreamKey ? "text" : "password"}
                      value={createdStream.streamKey || createdStream.id}
                      readOnly
                      className="font-mono text-sm"
                      data-testid="input-stream-key"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowStreamKey(!showStreamKey)}
                      data-testid="button-toggle-stream-key"
                    >
                      {showStreamKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(createdStream.streamKey || createdStream.id, '스트림 키')}
                      data-testid="button-copy-stream-key"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">OBS 설정 방법:</h4>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    <li>OBS Studio의 설정 → 방송 메뉴로 이동</li>
                    <li>서비스: 사용자 정의 선택</li>
                    <li>서버: 위의 RTMP URL 복사해서 입력</li>
                    <li>스트림 키: 위의 스트림 키 복사해서 입력</li>
                    <li>확인 클릭 후 '방송 시작' 클릭</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Controls */}
          <div className="flex gap-4">
            <Button
              onClick={() => startStreamMutation.mutate(createdStream.id)}
              disabled={startStreamMutation.isPending || createdStream.isLive}
              className="flex items-center gap-2"
              data-testid="button-start-stream"
            >
              <Play className="h-4 w-4" />
              {createdStream.isLive ? '스트리밍 중' : '스트림 시작'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setCreatedStream(null)}
              data-testid="button-new-stream"
            >
              새 스트림 생성
            </Button>
          </div>

          {/* Embed Preview */}
          {createdStream.peertubeEmbedUrl && (
            <Card>
              <CardHeader>
                <CardTitle>스트림 미리보기</CardTitle>
              </CardHeader>
              <CardContent>
                <iframe
                  src={createdStream.peertubeEmbedUrl}
                  width="100%"
                  height="400"
                  frameBorder="0"
                  allowFullScreen
                  data-testid="iframe-stream-preview"
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default LiveStreamSetup;