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
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";

interface LiveStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || "your_agora_app_id_here";

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
  const agoraClient = useRef<IAgoraRTCClient | null>(null);
  const audioTrack = useRef<IMicrophoneAudioTrack | null>(null);
  const videoTrack = useRef<ICameraVideoTrack | null>(null);
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
      // Initialize Agora client
      agoraClient.current = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      
      // Set client role to host
      await agoraClient.current.setClientRole("host");

      // Join the channel (using a simple token for demo - in production, get from your server)
      const uid = await agoraClient.current.join(AGORA_APP_ID, channelName, null, null);

      // Create audio and video tracks
      [audioTrack.current, videoTrack.current] = await AgoraRTC.createMicrophoneAndCameraTracks();

      // Play video track locally
      if (videoRef.current && videoTrack.current) {
        videoTrack.current.play(videoRef.current);
      }

      // Publish tracks to the channel
      await agoraClient.current.publish([audioTrack.current, videoTrack.current]);

      setIsLive(true);
      
      // Listen for viewer updates
      agoraClient.current.on("user-joined", () => {
        setViewerCount(prev => prev + 1);
      });
      
      agoraClient.current.on("user-left", () => {
        setViewerCount(prev => Math.max(0, prev - 1));
      });

      toast({
        title: "Live Stream Started!",
        description: "Your stream is now live and broadcasting",
      });

    } catch (error) {
      console.error("Failed to start live stream:", error);
      toast({
        title: "Stream Error",
        description: "Failed to start live stream. Check your camera/microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const stopLiveStream = async () => {
    try {
      // Stop and close local tracks
      if (audioTrack.current) {
        audioTrack.current.stop();
        audioTrack.current.close();
      }
      if (videoTrack.current) {
        videoTrack.current.stop();
        videoTrack.current.close();
      }

      // Leave the channel and disconnect
      if (agoraClient.current) {
        await agoraClient.current.leave();
        agoraClient.current = null;
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
    if (videoTrack.current) {
      await videoTrack.current.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = async () => {
    if (audioTrack.current) {
      await audioTrack.current.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
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

        {/* Agora Setup Notice */}
        {AGORA_APP_ID === "your_agora_app_id_here" && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Setup Required:</strong> To enable live streaming, you need to add your Agora App ID to the environment variables.
              Get your free App ID from <a href="https://www.agora.io" target="_blank" rel="noopener noreferrer" className="underline">agora.io</a>
              and add it as VITE_AGORA_APP_ID in your environment.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}