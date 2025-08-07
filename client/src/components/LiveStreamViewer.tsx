import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Heart, Share, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
// Removed Agora SDK - using PeerTube embed player instead

interface LiveStreamViewerProps {
  streamId: string;
  title: string;
  streamerName: string;
  streamerAvatar?: string;
  viewerCount: number;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  profileImageUrl?: string;
  message: string;
  createdAt: string;
}

// Using PeerTube embed player - no Agora required

export default function LiveStreamViewer({
  streamId,
  title,
  streamerName,
  streamerAvatar,
  viewerCount,
}: LiveStreamViewerProps) {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isFollowed, setIsFollowed] = useState(false);
  const [currentViewerCount, setCurrentViewerCount] = useState(viewerCount);

  const videoRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize PeerTube embed viewer
  useEffect(() => {
    const initializeViewer = async () => {
      try {
        // PeerTube embed initialization would go here
        // For now, showing placeholder content
        console.log("Initializing PeerTube viewer for stream:", streamId);
      } catch (error) {
        console.error("Failed to join stream:", error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to the live stream",
          variant: "destructive",
        });
      }
    };

    initializeViewer();
  }, [streamId, toast]);

  // Initialize WebSocket for chat
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      // Join the stream chat room
      wsRef.current?.send(JSON.stringify({
        type: 'join_stream',
        streamId: streamId,
      }));
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'chat_history':
          setChatMessages(data.messages);
          break;
        case 'new_message':
          setChatMessages(prev => [...prev, data.message]);
          break;
        case 'viewer_count_update':
          setCurrentViewerCount(data.count);
          break;
      }
    };

    return () => {
      wsRef.current?.close();
    };
  }, [streamId]);

  const sendChatMessage = () => {
    if (!chatMessage.trim() || !isAuthenticated || !wsRef.current) return;

    wsRef.current.send(JSON.stringify({
      type: 'chat_message',
      streamId: streamId,
      userId: (user as any)?.id,
      message: chatMessage.trim(),
    }));

    setChatMessage("");
  };

  const handleFollow = () => {
    setIsFollowed(!isFollowed);
    toast({
      title: isFollowed ? "Unfollowed" : "Followed!",
      description: `${isFollowed ? "Unfollowed" : "Now following"} ${streamerName}`,
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied!",
      description: "Stream link copied to clipboard",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-screen max-h-screen overflow-hidden">
      {/* Main Video Area */}
      <div className="lg:col-span-3 flex flex-col">
        {/* Video Player */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex-1">
          <div ref={videoRef} className="w-full h-full" />
          
          {/* Stream Overlay */}
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">LIVE</span>
            <div className="flex items-center text-white text-sm">
              <Users className="w-4 h-4 mr-1" />
              {currentViewerCount}
            </div>
          </div>

          {/* PeerTube stream placeholder */}
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="text-lg font-medium mb-2">🎥 Live Stream</div>
              <p className="text-gray-400">PeerTube stream player will appear here</p>
            </div>
          </div>
        </div>

        {/* Stream Info */}
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold mb-2">{title}</h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={streamerAvatar} alt={streamerName} />
                    <AvatarFallback>{streamerName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{streamerName}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4 mr-1" />
                  {currentViewerCount} watching
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              {isAuthenticated && (
                <Button
                  variant={isFollowed ? "default" : "outline"}
                  onClick={handleFollow}
                  data-testid="button-follow"
                >
                  <Heart className={`w-4 h-4 mr-2 ${isFollowed ? "fill-current" : ""}`} />
                  {isFollowed ? "Following" : "Follow"}
                </Button>
              )}
              
              <Button variant="outline" onClick={handleShare} data-testid="button-share">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold">Live Chat</h3>
          <p className="text-sm text-gray-500">{currentViewerCount} viewers</p>
        </div>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {chatMessages.length === 0 ? (
              <p className="text-gray-500 text-sm text-center">
                No messages yet. Be the first to chat!
              </p>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className="flex space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={msg.profileImageUrl} alt={msg.username} />
                    <AvatarFallback className="text-xs">
                      {msg.username.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium truncate">
                        {msg.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                      {msg.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Chat Input */}
        {isAuthenticated ? (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Say something..."
                onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button 
                onClick={sendChatMessage} 
                disabled={!chatMessage.trim()}
                data-testid="button-send-chat"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500">
              <a href="/api/login" className="text-primary-purple hover:underline">
                Sign in
              </a>{" "}
              to join the chat
            </p>
          </div>
        )}
      </div>
    </div>
  );
}