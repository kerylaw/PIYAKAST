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

interface CloudflareLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = [
  { value: "K-Beauty", label: "K-Beauty" },
  { value: "K-Pop", label: "K-Pop" },
  { value: "K-Drama", label: "K-Drama" },
  { value: "K-Movie", label: "K-Movie" },
  { value: "K-Food", label: "K-Food" },
];

export default function CloudflareLiveModal({ isOpen, onClose }: CloudflareLiveModalProps) {
  const { toast } = useToast();
  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [streamCategory, setStreamCategory] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [streamKey, setStreamKey] = useState("");
  const [rtmpUrl, setRtmpUrl] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [streamId, setStreamId] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const createCloudflareStreamMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; category: string }) => {
      return await apiRequest("/api/streams/cloudflare", "POST", data);
    },
    onSuccess: (response: any) => {
      setStreamId(response.streamId);
      setStreamKey(response.streamKey);
      setRtmpUrl(response.rtmpUrl);
      setIsLive(true);
      queryClient.invalidateQueries({ queryKey: ["/api/streams"] });
      
      // Initialize WebSocket for chat
      initializeWebSocket(response.streamId);
      
      toast({
        title: "Live Stream Created!",
        description: "Your stream is ready. Use the RTMP details in your streaming software.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create Cloudflare stream",
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

  const initializeWebSocket = (streamId: string) => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      wsRef.current?.send(JSON.stringify({
        type: 'join_stream',
        streamId: streamId,
      }));
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'viewer_count_update':
          setViewerCount(data.count);
          break;
      }
    };
  };

  const stopLiveStream = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsLive(false);
    setViewerCount(0);
    setStreamKey("");
    setRtmpUrl("");
    setStreamId("");
    
    toast({
      title: "Stream Ended",
      description: "Your live stream has ended",
    });
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

    createCloudflareStreamMutation.mutate({
      title: streamTitle,
      description: streamDescription,
      category: streamCategory,
    });
  };

  const handleEndStream = () => {
    if (streamId) {
      endStreamMutation.mutate(streamId);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} Copied!`,
      description: `${label} has been copied to your clipboard`,
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center">
            {isLive && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2" />}
            {isLive ? "🔴 Live Stream Active" : "Start Live Stream"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stream Preview / RTMP Info */}
          <div className="space-y-4">
            {!isLive ? (
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="text-center text-white">
                    <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-400">Stream preview will appear here</p>
                    <p className="text-sm text-gray-500 mt-2">Use OBS Studio or similar software to broadcast</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* RTMP Configuration */}
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    RTMP Settings for OBS/Streaming Software
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Server URL</Label>
                      <div className="flex mt-1">
                        <Input
                          value={rtmpUrl}
                          readOnly
                          className="flex-1 font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2"
                          onClick={() => copyToClipboard(rtmpUrl, "RTMP URL")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Stream Key</Label>
                      <div className="flex mt-1">
                        <Input
                          value={streamKey}
                          readOnly
                          type="password"
                          className="flex-1 font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2"
                          onClick={() => copyToClipboard(streamKey, "Stream Key")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Setup Instructions:</strong>
                    </p>
                    <ol className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                      <li>1. Open OBS Studio or your streaming software</li>
                      <li>2. Add the Server URL to your streaming settings</li>
                      <li>3. Copy and paste the Stream Key (keep it secret!)</li>
                      <li>4. Start streaming in your software</li>
                    </ol>
                  </div>
                </div>

                {/* Stream Preview */}
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    className="w-full h-full"
                    controls
                    muted
                    autoPlay
                  />
                  
                  {/* Live indicator */}
                  <div className="absolute top-4 left-4 flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-white text-sm font-medium">LIVE</span>
                    <span className="text-white text-sm">{viewerCount} viewers</span>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <p className="text-lg font-medium mb-2">🎬 Cloudflare Stream Active</p>
                      <p className="text-gray-300">Your stream is broadcasting globally</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              {isLive ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/stream/${streamId}`, '_blank')}
                    data-testid="button-view-stream"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Stream
                  </Button>
                  
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
                </>
              ) : (
                <Button
                  onClick={handleStartStream}
                  disabled={createCloudflareStreamMutation.isPending}
                  className="bg-live-red hover:bg-red-700"
                  data-testid="button-start-stream"
                >
                  🎥 Create Live Stream
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
                  <div>Status: <span className="text-green-600 font-medium">Live via Cloudflare</span></div>
                  <div>Viewers: <span className="font-medium">{viewerCount}</span></div>
                  <div>Quality: <span className="font-medium">Auto (Adaptive)</span></div>
                  <div>CDN: <span className="font-medium">Global Distribution</span></div>
                </div>
              </div>
            )}

            {/* Instructions */}
            {!isLive && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">
                  <Settings className="w-4 h-4 inline mr-2" />
                  About Cloudflare Stream
                </h4>
                <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• Professional live streaming with global CDN</li>
                  <li>• Works with OBS Studio, XSplit, and other tools</li>
                  <li>• Automatic quality adaptation for viewers</li>
                  <li>• Real-time chat and viewer interaction</li>
                  <li>• Fill out details above to get your RTMP credentials</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}