import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Upload, Play, Camera, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface VideoThumbnail {
  id: string;
  thumbnailUrl: string;
  timecode: number;
  isSelected: boolean;
}

interface VideoUploadData {
  title: string;
  description: string;
  category: string;
  isPublic: boolean;
}

export default function VideoUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoData, setVideoData] = useState<VideoUploadData>({
    title: "",
    description: "",
    category: "",
    isPublic: true,
  });
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<VideoThumbnail[]>([]);
  const [showThumbnailDialog, setShowThumbnailDialog] = useState(false);
  const [selectedThumbnailId, setSelectedThumbnailId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error("Upload failed"));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed"));
        });

        xhr.open("POST", "/api/videos");
        xhr.send(formData);
      });
    },
    onSuccess: (response: any) => {
      setUploadedVideoId(response.videoId);
      setIsUploading(false);
      toast({
        title: "동영상 업로드 완료",
        description: "썸네일을 선택하세요.",
      });
      generateThumbnails(response.videoId);
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    },
    onError: (error: Error) => {
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: "업로드 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateThumbnails = async (videoId: string) => {
    try {
      const response = await apiRequest("POST", `/api/videos/${videoId}/thumbnails`);
      const result = await response.json();
      setThumbnails(result.thumbnails);
      setShowThumbnailDialog(true);
    } catch (error) {
      console.error("썸네일 생성 실패:", error);
    }
  };

  const selectThumbnailMutation = useMutation({
    mutationFn: async ({ videoId, thumbnailId }: { videoId: string; thumbnailId: string }) => {
      const response = await apiRequest("PUT", `/api/videos/${videoId}/thumbnail/${thumbnailId}`);
      return response.json();
    },
    onSuccess: () => {
      setShowThumbnailDialog(false);
      toast({
        title: "썸네일 선택 완료",
        description: "동영상이 성공적으로 업로드되었습니다!",
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "썸네일 선택 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("video/")) {
        if (file.size > 2 * 1024 * 1024 * 1024) { // 2GB limit
          toast({
            title: "파일 크기 초과",
            description: "동영상 파일은 2GB 이하여야 합니다.",
            variant: "destructive",
          });
          return;
        }
        setVideoFile(file);
        if (!videoData.title) {
          setVideoData(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, "") }));
        }
      } else {
        toast({
          title: "잘못된 파일 형식",
          description: "동영상 파일만 업로드할 수 있습니다.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = () => {
    if (!videoFile || !videoData.title.trim()) {
      toast({
        title: "필수 정보 누락",
        description: "동영상 파일과 제목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("title", videoData.title);
    formData.append("description", videoData.description);
    formData.append("category", videoData.category);
    formData.append("isPublic", String(videoData.isPublic));

    setIsUploading(true);
    setUploadProgress(0);
    uploadMutation.mutate(formData);
  };

  const handleThumbnailSelect = (thumbnailId: string) => {
    setSelectedThumbnailId(thumbnailId);
  };

  const confirmThumbnailSelection = () => {
    if (uploadedVideoId && selectedThumbnailId) {
      selectThumbnailMutation.mutate({
        videoId: uploadedVideoId,
        thumbnailId: selectedThumbnailId,
      });
    }
  };

  const resetForm = () => {
    setVideoFile(null);
    setVideoData({
      title: "",
      description: "",
      category: "",
      isPublic: true,
    });
    setUploadProgress(0);
    setUploadedVideoId(null);
    setThumbnails([]);
    setSelectedThumbnailId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            동영상 업로드
          </CardTitle>
          <CardDescription>
            동영상을 업로드하고 썸네일을 선택하세요. (최대 2GB)
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="video-file">동영상 파일</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                videoFile 
                  ? "border-green-500 bg-green-50 dark:bg-green-950" 
                  : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
              }`}
            >
              <input
                ref={fileInputRef}
                id="video-file"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              
              {videoFile ? (
                <div className="space-y-2">
                  <Play className="w-12 h-12 mx-auto text-green-600" />
                  <p className="font-medium text-green-700 dark:text-green-300">
                    {videoFile.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    파일 변경
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    동영상 파일을 선택하거나 드래그하여 업로드하세요
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    파일 선택
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Video Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={videoData.title}
                onChange={(e) => setVideoData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="동영상 제목을 입력하세요"
                disabled={isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={videoData.description}
                onChange={(e) => setVideoData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="동영상에 대한 설명을 입력하세요"
                rows={3}
                disabled={isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">카테고리</Label>
              <Select
                value={videoData.category}
                onValueChange={(value) => setVideoData(prev => ({ ...prev, category: value }))}
                disabled={isUploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="K-Beauty">K-Beauty</SelectItem>
                  <SelectItem value="K-Pop">K-Pop</SelectItem>
                  <SelectItem value="K-Drama">K-Drama</SelectItem>
                  <SelectItem value="K-Movie">K-Movie</SelectItem>
                  <SelectItem value="K-Food">K-Food</SelectItem>
                  <SelectItem value="Gaming">게임</SelectItem>
                  <SelectItem value="Education">교육</SelectItem>
                  <SelectItem value="Entertainment">엔터테인먼트</SelectItem>
                  <SelectItem value="Technology">기술</SelectItem>
                  <SelectItem value="Other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="public"
                type="checkbox"
                checked={videoData.isPublic}
                onChange={(e) => setVideoData(prev => ({ ...prev, isPublic: e.target.checked }))}
                disabled={isUploading}
                className="rounded"
              />
              <Label htmlFor="public">공개 동영상</Label>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>업로드 중...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!videoFile || !videoData.title.trim() || isUploading}
            className="w-full"
            size="lg"
          >
            {isUploading ? "업로드 중..." : "동영상 업로드"}
          </Button>
        </CardContent>
      </Card>

      {/* Thumbnail Selection Dialog */}
      <Dialog open={showThumbnailDialog} onOpenChange={setShowThumbnailDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              썸네일 선택
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              동영상의 썸네일을 선택하세요. 선택한 썸네일이 동영상의 대표 이미지로 사용됩니다.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {thumbnails.map((thumbnail) => (
                <div
                  key={thumbnail.id}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedThumbnailId === thumbnail.id
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleThumbnailSelect(thumbnail.id)}
                >
                  <img
                    src={thumbnail.thumbnailUrl}
                    alt={`Thumbnail at ${thumbnail.timecode}s`}
                    className="w-full aspect-video object-cover"
                  />
                  
                  {selectedThumbnailId === thumbnail.id && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                      <Check className="w-8 h-8 text-blue-600 bg-white rounded-full p-1" />
                    </div>
                  )}
                  
                  <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                    {Math.floor(thumbnail.timecode / 60)}:{(thumbnail.timecode % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowThumbnailDialog(false)}
              >
                취소
              </Button>
              <Button
                onClick={confirmThumbnailSelection}
                disabled={!selectedThumbnailId || selectThumbnailMutation.isPending}
              >
                {selectThumbnailMutation.isPending ? "처리 중..." : "썸네일 선택"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}