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
import { Video, VideoOff, Mic, MicOff, Square, Settings } from "lucide-react";
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
  
  const videoRef = useRef<HTMLDivElement>(null);
  const streamId = useRef<string>("");

  const createStreamMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; category: string }) => {
      return await apiRequest("/api/streams", "POST", data);
    },
    onSuccess: (stream: any) => {
      streamId.current = stream.id;
      startLiveStream(stream.id);
      queryClient.invalidateQueries({ queryKey: ["/api/streams"] });
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

  const stopLiveStream = async () => {
    try {
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
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleAudio = async () => {
    setIsAudioEnabled(!isAudioEnabled);
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
      if (isLive) {
        stopLiveStream();
      }
    };
  }, []);

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
              <div ref={videoRef} className="w-full h-full" />
              {!isLive && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <p className="text-gray-400">Camera preview will appear here</p>
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

            {/* Instructions */}
            {!isLive && (
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