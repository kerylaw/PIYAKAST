import { useState, useEffect, useRef } from "react";
import { Send, Smile, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface ChatMessage {
  id: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    profileImageUrl?: string;
  };
}

interface LiveChatProps {
  streamId: string;
  className?: string;
}

export default function LiveChat({ streamId, className }: LiveChatProps) {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!streamId) return;

    // Connect to WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('Connected to chat');
      // Join the stream room
      websocket.send(JSON.stringify({
        type: 'join_stream',
        streamId: streamId,
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'chat_history':
          setMessages(data.messages);
          break;
        case 'new_message':
          setMessages(prev => [...prev, data.message]);
          break;
      }
    };

    websocket.onclose = () => {
      console.log('Disconnected from chat');
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [streamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !ws || !user) return;

    ws.send(JSON.stringify({
      type: 'chat_message',
      userId: user.id,
      message: newMessage,
    }));

    setNewMessage("");
  };

  const handleSuperChat = () => {
    // TODO: Implement SuperChat functionality
    console.log('SuperChat clicked');
  };

  return (
    <div className={`flex flex-col h-full bg-elevated border-l border-gray-700 ${className}`}>
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="font-semibold" data-testid="text-chat-title">Live Chat</h3>
        <p className="text-sm text-gray-400" data-testid="text-viewer-count">
          {messages.length} messages
        </p>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3" data-testid={`message-${message.id}`}>
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarImage src={message.user.profileImageUrl} alt={message.user.username} />
                <AvatarFallback>{message.user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm text-primary-purple" data-testid={`text-message-username-${message.id}`}>
                    {message.user.username}
                  </span>
                  <span className="text-xs text-gray-400" data-testid={`text-message-time-${message.id}`}>
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-300 break-words" data-testid={`text-message-content-${message.id}`}>
                  {message.message}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Chat Input */}
      {isAuthenticated ? (
        <div className="p-4 border-t border-gray-700">
          <form onSubmit={sendMessage} className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Say something..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="pr-10 bg-card-bg border-gray-600 text-white placeholder-gray-400"
                data-testid="input-chat-message"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-primary-purple"
                data-testid="button-emoji"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            <Button
              type="submit"
              size="icon"
              className="bg-primary-purple hover:bg-purple-700"
              disabled={!newMessage.trim()}
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {/* SuperChat Button */}
          <Button
            onClick={handleSuperChat}
            className="w-full mt-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-medium"
            data-testid="button-super-chat"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Send Super Chat
          </Button>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-700 text-center">
          <p className="text-gray-400 mb-2">Sign in to chat</p>
          <Button
            onClick={() => window.location.href = "/api/login"}
            className="bg-primary-purple hover:bg-purple-700"
            data-testid="button-login-to-chat"
          >
            Sign In
          </Button>
        </div>
      )}
    </div>
  );
}
