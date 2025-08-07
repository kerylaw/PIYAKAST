import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Heart, 
  Gift, 
  Crown, 
  Star,
  DollarSign
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SuperChatModal } from "./SuperChatModal";

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  type: "normal" | "superchat" | "moderator";
  amount?: number;
  currency?: string;
  color?: string;
  isModeratorMessage: boolean;
  isPinned: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
}

interface LiveChatProps {
  streamId: string;
  isCreator?: boolean;
}

export function LiveChat({ streamId, isCreator }: LiveChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showSuperChatModal, setShowSuperChatModal] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connection
  useEffect(() => {
    if (!user || !streamId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({
        type: "join_stream",
        streamId,
        userId: user.id,
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "chat_message") {
        setMessages(prev => [...prev, data.message]);
      } else if (data.type === "superchat") {
        setMessages(prev => [...prev, { ...data.message, type: "superchat" }]);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [user, streamId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        throw new Error("연결이 끊어졌습니다");
      }
      
      wsRef.current.send(JSON.stringify({
        type: "chat_message",
        streamId,
        message,
        userId: user?.id,
      }));
    },
    onError: () => {
      toast({
        title: "메시지 전송 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !isConnected) return;
    
    sendMessageMutation.mutate(newMessage.trim());
    setNewMessage("");
  };

  const handleSuperChat = (data: { message: string; amount: number }) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: "연결 오류",
        description: "채팅 연결이 끊어졌습니다.",
        variant: "destructive",
      });
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: "superchat",
      streamId,
      message: data.message,
      amount: data.amount,
      userId: user?.id,
    }));

    setShowSuperChatModal(false);
  };

  const getSuperchatColor = (amount: number): string => {
    if (amount >= 50000) return "bg-gradient-to-r from-red-500 to-pink-500";
    if (amount >= 20000) return "bg-gradient-to-r from-purple-500 to-blue-500";
    if (amount >= 10000) return "bg-gradient-to-r from-green-500 to-teal-500";
    if (amount >= 5000) return "bg-gradient-to-r from-yellow-500 to-orange-500";
    return "bg-gradient-to-r from-blue-400 to-indigo-500";
  };

  const formatCurrency = (amount: number, currency: string = "KRW"): string => {
    if (currency === "KRW") {
      return `₩${amount.toLocaleString()}`;
    }
    return `$${amount}`;
  };

  if (!user) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <CardContent className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            채팅에 참여하려면 로그인이 필요합니다.
          </p>
          <Button onClick={() => window.location.href = "/auth"}>
            로그인하기
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-[500px] flex flex-col">
        <CardHeader className="py-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <span>실시간 채팅</span>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-500">
                {isConnected ? "연결됨" : "연결 중..."}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSuperChatModal(true)}
              className="flex items-center gap-1 text-xs"
              data-testid="button-superchat"
            >
              <DollarSign className="w-3 h-3" />
              슈퍼챗
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-3 pb-4">
              {messages.map((message) => (
                <ChatMessageItem key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="메시지를 입력하세요..."
                className="flex-1"
                disabled={!isConnected}
                data-testid="input-chat-message"
                maxLength={200}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!newMessage.trim() || !isConnected || sendMessageMutation.isPending}
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <SuperChatModal
        open={showSuperChatModal}
        onOpenChange={setShowSuperChatModal}
        onSubmit={handleSuperChat}
      />
    </>
  );
}

interface ChatMessageItemProps {
  message: ChatMessage;
}

function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isSuperchat = message.type === "superchat";
  const isModerator = message.isModeratorMessage;

  return (
    <div 
      className={`flex gap-2 p-2 rounded-lg ${
        isSuperchat 
          ? `${message.color || "bg-blue-500"} text-white` 
          : isModerator 
            ? "bg-green-100 dark:bg-green-900/20" 
            : ""
      } ${message.isPinned ? "border-2 border-yellow-400" : ""}`}
      data-testid={`message-${message.id}`}
    >
      <Avatar className="w-6 h-6 flex-shrink-0">
        <AvatarImage src={message.user.profileImageUrl || ""} />
        <AvatarFallback>
          {message.user.firstName?.charAt(0) || message.user.username?.charAt(0) || "U"}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span className={`text-sm font-medium ${isSuperchat ? "text-white" : ""}`}>
            {message.user.firstName} {message.user.lastName}
          </span>
          
          {isModerator && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              <Crown className="w-3 h-3 mr-1" />
              MOD
            </Badge>
          )}
          
          {isSuperchat && message.amount && (
            <Badge className="text-xs px-1 py-0 bg-white/20 text-white">
              <Gift className="w-3 h-3 mr-1" />
              {message.amount?.toLocaleString('ko-KR')}원
            </Badge>
          )}
          
          {message.isPinned && (
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          )}
          
          <span className={`text-xs ${isSuperchat ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
            {formatDistanceToNow(new Date(message.createdAt), { 
              addSuffix: true, 
              locale: ko 
            })}
          </span>
        </div>
        
        <p className={`text-sm break-words ${isSuperchat ? "text-white font-medium" : ""}`}>
          {message.message}
        </p>
      </div>
    </div>
  );
}