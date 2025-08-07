import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, VideoOff, Mic, MicOff, Square, Settings, Copy, ExternalLink } from "lucide-react";
// Removed Agora SDK - using PeerTube RTMP streaming instead

interface LiveStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Using PeerTube RTMP streaming - no Agora required

const categories = [
  { value: "K-Beauty", label: "K-Beauty" },
  { value: "K-Pop", label: "K-Pop" },
  { value: "K-Drama", label: "K-Drama" },
  { value: "K-Movie", label: "K-Movie" },
  { value: "K-Food", label: "K-Food" },
];

export default function LiveStreamModal({ isOpen, onClose }: LiveStreamModalProps) {
  const { toast } = useToast();
  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [streamCategory, setStreamCategory] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [rtmpUrl, setRtmpUrl] = useState("");
  const [streamKey, setStreamKey] = useState("");
  const [showSetup, setShowSetup] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamId = useRef<string>("");

  const createStreamMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; category: string }) => {
      const response = await apiRequest("POST", "/api/streams", data);
      return await response.json();
    },
    onSuccess: (stream: any) => {
      console.log('PeerTube Stream Created:', stream);
      streamId.current = stream.id;
      
      // Store RTMP connection details if available
      if (stream.rtmpUrl && stream.streamKey) {
        setRtmpUrl(stream.rtmpUrl);
        setStreamKey(stream.streamKey);
        setShowSetup(true);
      }
      
      toast({
        title: "스트림 생성 완료!",
        description: "라이브 스트림 페이지로 이동합니다.",
      });
      
      // 스트림 생성 후 바로 라이브 스트림 뷰어 페이지로 이동
      setTimeout(() => {
        window.location.href = `/stream/${stream.id}`;
      }, 1000);
      
      queryClient.invalidateQueries({ queryKey: ["/api/streams"] });
      onClose(); // 모달 닫기
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create stream",
        variant: "destructive",
      });
    },
  });

  const endStreamMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/streams/${id}/end`, "PATCH");
    },
    onSuccess: () => {
      stopLiveStream();
      queryClient.invalidateQueries({ queryKey: ["/api/streams"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to end stream",
        variant: "destructive",
      });
    },
  });

  const startLiveStream = async (channelName: string) => {
    try {
      // Start webcam
      await startWebcam();
      
      setIsLive(true);
      setViewerCount(0);

      toast({
        title: "Live Stream Started!",
        description: "Your stream is now live and broadcasting via PeerTube RTMP",
      });

    } catch (error) {
      console.error("Failed to start live stream:", error);
      toast({
        title: "Stream Error",
        description: "Failed to start live stream.",
        variant: "destructive",
      });
    }
  };

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
    } catch (error) {
      console.error("Failed to access webcam:", error);
      toast({
        title: "카메라 접근 실패",
        description: "웹캠과 마이크 접근 권한을 허용해주세요.",
        variant: "destructive",
      });
    }
  };

  const stopLiveStream = async () => {
    try {
      // Stop webcam
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      setIsLive(false);
      setViewerCount(0);
      
      toast({
        title: "Stream Ended",
        description: "Your live stream has ended",
      });
    } catch (error) {
      console.error("Failed to stop live stream:", error);
    }
  };

  const toggleVideo = async () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const toggleAudio = async () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  const handleStartStream = () => {
    if (!streamTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your stream",
        variant: "destructive",
      });
      return;
    }

    if (!streamCategory) {
      toast({
        title: "Category Required",
        description: "Please select a category for your stream",
        variant: "destructive",
      });
      return;
    }

    createStreamMutation.mutate({
      title: streamTitle,
      description: streamDescription,
      category: streamCategory,
    });
  };

  const handleEndStream = () => {
    if (streamId.current) {
      endStreamMutation.mutate(streamId.current);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      setIsLive(false);
      setShowSetup(false);
      setRtmpUrl("");
      setStreamKey("");
      setStreamTitle("");
      setStreamDescription("");
      setStreamCategory("");
    }
  }, [isOpen, stream]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isLive ? "🔴 Live Stream" : "Start Live Stream"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Preview */}
          <div className="space-y-4">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
              {!stream && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="text-center">
                    <p className="text-gray-400 mb-2">웹캠 프리뷰</p>
                    <Button 
                      onClick={startWebcam}
                      variant="outline"
                      size="sm"
                    >
                      카메라 시작
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Live indicator */}
              {isLive && (
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-white text-sm font-medium">LIVE</span>
                  <span className="text-white text-sm">{viewerCount} viewers</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              <Button
                variant={isVideoEnabled ? "default" : "secondary"}
                size="sm"
                onClick={toggleVideo}
                disabled={!isLive}
                data-testid="button-toggle-video"
              >
                {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </Button>
              
              <Button
                variant={isAudioEnabled ? "default" : "secondary"}
                size="sm"
                onClick={toggleAudio}
                disabled={!isLive}
                data-testid="button-toggle-audio"
              >
                {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>

              {isLive ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEndStream}
                  disabled={endStreamMutation.isPending}
                  data-testid="button-end-stream"
                >
                  <Square className="w-4 h-4 mr-2" />
                  End Stream
                </Button>
              ) : (
                <Button
                  onClick={handleStartStream}
                  disabled={createStreamMutation.isPending}
                  data-testid="button-start-stream"
                >
                  Start Stream
                </Button>
              )}
            </div>
          </div>

          {/* Stream Settings */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Stream Title *</Label>
              <Input
                id="title"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="Enter your stream title"
                disabled={isLive}
                data-testid="input-stream-title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={streamDescription}
                onChange={(e) => setStreamDescription(e.target.value)}
                placeholder="Tell viewers what your stream is about..."
                disabled={isLive}
                data-testid="textarea-stream-description"
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={streamCategory} onValueChange={setStreamCategory} disabled={isLive}>
                <SelectTrigger data-testid="select-stream-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stream Stats */}
            {isLive && (
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold mb-2">Stream Stats</h4>
                <div className="space-y-1 text-sm">
                  <div>Status: <span className="text-green-600 font-medium">Live</span></div>
                  <div>Viewers: <span className="font-medium">{viewerCount}</span></div>
                  <div>Quality: <span className="font-medium">HD</span></div>
                </div>
              </div>
            )}

            {/* RTMP Setup - Only show when stream is created */}
            {showSetup && rtmpUrl && streamKey && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-semibold mb-3 text-yellow-800 dark:text-yellow-200">
                  🎥 OBS Studio 설정 정보
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Server URL:
                    </label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={rtmpUrl}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(rtmpUrl)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stream Key:
                    </label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={streamKey}
                        readOnly
                        type="password"
                        className="font-mono text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(streamKey)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    OBS Studio에서 위 정보를 사용하여 스트리밍을 시작하세요.
                  </p>
                </div>
              </div>
            )}

            {/* Instructions */}
            {!isLive && !showSetup && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">
                  <Settings className="w-4 h-4 inline mr-2" />
                  Setup Instructions
                </h4>
                <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• Make sure your camera and microphone are connected</li>
                  <li>• Choose a well-lit area for better video quality</li>
                  <li>• Test your internet connection for smooth streaming</li>
                  <li>• Fill out the title and category to get started</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* PeerTube RTMP Setup Notice */}
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>PeerTube RTMP Streaming:</strong> This platform uses PeerTube for decentralized video streaming.
            Set up OBS Studio or similar software to stream to our RTMP endpoint for professional live broadcasting.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}