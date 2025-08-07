import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Heart, Share, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { StreamControls } from "./StreamControls";
// Removed Agora SDK - using PeerTube embed player instead

interface LiveStreamViewerProps {
  streamId: string;
  title: string;
  description?: string;
  category?: string;
  streamerName: string;
  streamerAvatar?: string;
  viewerCount: number;
  isLive: boolean;
  startedAt?: string;
  peertubeEmbedUrl?: string;
  rtmpUrl?: string;
  streamKey?: string;
  streamerId?: string;
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
  description,
  category,
  streamerName,
  streamerAvatar,
  viewerCount,
  isLive,
  startedAt,
  peertubeEmbedUrl,
  rtmpUrl,
  streamKey,
  streamerId,
}: LiveStreamViewerProps) {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isFollowed, setIsFollowed] = useState(false);
  
  // Check if current user is the stream owner
  const isOwner = user && streamerId ? (user.id === streamerId) : false;
  console.log("Stream ownership check:", { userId: user?.id, streamerId, isOwner });
  const [currentViewerCount, setCurrentViewerCount] = useState(viewerCount);

  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize webcam for stream owner
  useEffect(() => {
    const initializeViewer = async () => {
      try {
        console.log("Initializing PeerTube viewer for stream:", streamId);
        
        // 스트리머인 경우 웹캠 시작
        if (isOwner && !peertubeEmbedUrl) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true
            });
            
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play();
            }
          } catch (error) {
            console.warn("Failed to access webcam:", error);
            toast({
              title: "웹캠 접근 실패",
              description: "카메라 권한을 허용해주세요.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Failed to initialize viewer:", error);
      }
    };

    initializeViewer();
    
    // Cleanup function
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [streamId, isOwner, peertubeEmbedUrl, toast]);

  // Initialize WebSocket for chat and heartbeat
  useEffect(() => {
    // Use window.location.host which includes port automatically
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log("Connecting to WebSocket:", wsUrl);
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      // Join the stream chat room
      wsRef.current?.send(JSON.stringify({
        type: 'join_stream',
        streamId: streamId,
      }));
      
      // Send initial heartbeat
      wsRef.current?.send(JSON.stringify({
        type: 'stream_heartbeat',
        streamId: streamId,
        userId: user?.id,
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
  }, [streamId, user?.id]);

  // Send heartbeat every 15 seconds to keep stream active
  useEffect(() => {
    if (!isLive) return;
    
    const heartbeatInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'stream_heartbeat',
          streamId: streamId,
          userId: user?.id,
        }));
        console.log("Sending stream heartbeat for:", streamId);
      }
    }, 15000); // Send every 15 seconds

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [streamId, isLive, user?.id]);

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
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Video Player - 좌측에 완전히 붙이고 크기 대폭 확대 */}
        <div className="relative bg-black aspect-video w-full max-w-6xl ml-0">
          {/* Stream Overlay */}
          <div className="absolute top-4 left-4 flex items-center space-x-2 z-10">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">LIVE</span>
            <div className="flex items-center text-white text-sm">
              <Users className="w-4 h-4 mr-1" />
              {currentViewerCount}
            </div>
          </div>

          {/* PeerTube stream embed 또는 웹캠 스트림 */}
          {peertubeEmbedUrl ? (
            <iframe
              src={peertubeEmbedUrl}
              className="w-full h-full"
              frameBorder="0"
              allowFullScreen
              title={`${streamerName}'s Live Stream`}
            />
          ) : isOwner ? (
            // 스트리머용 웹캠 미리보기
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }} // 미러 효과
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <div className="text-lg font-medium mb-2">🎥 Live Stream</div>
                <div className="space-y-2">
                  <p className="text-gray-400">
                    {isLive ? "스트리밍 준비 중..." : "방송이 아직 시작되지 않았습니다"}
                  </p>
                  {rtmpUrl && streamKey && isOwner && (
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>OBS Studio 설정:</p>
                      <p>RTMP URL: {rtmpUrl}</p>
                      <p>Stream Key: {streamKey?.slice(0, 8)}...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stream Info */}
        <div className="p-6 bg-white dark:bg-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold mb-2">{title}</h1>
              {description && (
                <p className="text-gray-600 dark:text-gray-400 mb-2">{description}</p>
              )}
              {category && (
                <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full mb-2">
                  {category}
                </span>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={streamerAvatar} alt={streamerName || "Streamer"} />
                      <AvatarFallback>{streamerName?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{streamerName || "Unknown"}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4 mr-1" />
                    {currentViewerCount} watching
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <StreamControls 
                    streamId={streamId} 
                    isLive={isLive} 
                    isOwner={isOwner} 
                  />
                  
                  {isAuthenticated && !isOwner && (
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
              
              {isOwner && !isLive && (
                <div className="mt-3 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg text-sm">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    💡 <strong>방송 안내:</strong> "방송 시작" 버튼을 눌러야 다른 시청자들이 볼 수 있습니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Sidebar - 우측 고정 */}
      <div className="w-96 flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
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
              chatMessages.map((msg) => {
                const isStreamerMessage = msg.userId === streamerId;
                return (
                  <div key={msg.id} className="flex space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={msg.profileImageUrl} alt={msg.username || "User"} />
                      <AvatarFallback className={`text-xs ${isStreamerMessage ? 'bg-red-500 text-white' : ''}`}>
                        {msg.username?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        <span className={`text-sm font-medium truncate ${isStreamerMessage ? 'text-red-600 dark:text-red-400' : ''}`}>
                          {msg.username || "Unknown User"}
                        </span>
                        {isStreamerMessage && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            방장
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className={`text-sm break-words ${isStreamerMessage ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                        {msg.message}
                      </p>
                    </div>
                  </div>
                );
              })
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