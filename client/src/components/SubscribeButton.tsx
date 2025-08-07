import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Bell, BellOff } from "lucide-react";

interface MembershipData {
  subscription?: {
    id: string;
    type: string;
    isActive: boolean;
  };
  tier?: {
    id: string;
    name: string;
    color: string;
    emoji?: string;
  };
  channel?: {
    id: string;
    username: string;
    profileImageUrl?: string;
  };
}

interface SubscribeButtonProps {
  channelId: string;
  channelName?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  showNotificationIcon?: boolean;
}

export default function SubscribeButton({ 
  channelId, 
  channelName,
  variant = "default",
  size = "default",
  showNotificationIcon = true
}: SubscribeButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isHovered, setIsHovered] = useState(false);

  // Get current membership status
  const { data: membership } = useQuery<MembershipData>({
    queryKey: [`/api/channels/${channelId}/membership`],
    enabled: isAuthenticated && channelId !== user?.id,
  });

  const subscription = membership?.subscription;
  const isSubscribed = subscription?.isActive || false;
  const subscriptionType = subscription?.type;
  const membershipTier = membership?.tier;

  // Subscribe/unsubscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (isSubscribed) {
        await apiRequest("DELETE", `/api/channels/${channelId}/subscribe`);
      } else {
        await apiRequest("POST", `/api/channels/${channelId}/subscribe`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/channels/${channelId}/membership`] 
      });
      
      if (isSubscribed) {
        toast({
          title: "Unsubscribed",
          description: `You have unsubscribed from ${channelName || "this channel"}.`,
        });
      } else {
        toast({
          title: "Subscribed!",
          description: `You are now subscribed to ${channelName || "this channel"}.`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Don't show for own channel
  if (!isAuthenticated || channelId === user?.id) {
    return null;
  }

  const handleClick = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to subscribe to channels.",
        variant: "destructive",
      });
      return;
    }
    
    subscribeMutation.mutate();
  };

  const getButtonText = () => {
    if (subscribeMutation.isPending) {
      return isSubscribed ? "Unsubscribing..." : "Subscribing...";
    }
    
    if (isSubscribed) {
      if (isHovered) {
        return "Unsubscribe";
      }
      return membershipTier ? `Member (${membershipTier.name})` : "Subscribed";
    }
    
    return "Subscribe";
  };

  const getButtonVariant = () => {
    if (isSubscribed) {
      if (membershipTier) {
        return "default"; // Member button with tier color
      }
      return isHovered ? "destructive" : "outline";
    }
    return variant;
  };

  const buttonStyle = membershipTier ? {
    backgroundColor: membershipTier.color,
    borderColor: membershipTier.color,
    color: "white",
  } : {};

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={getButtonVariant()}
        size={size}
        onClick={handleClick}
        disabled={subscribeMutation.isPending}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={buttonStyle}
        data-testid={`button-subscribe-${channelId}`}
        className={`transition-all duration-200 ${
          membershipTier ? "hover:opacity-80" : ""
        } ${
          isSubscribed && isHovered && !membershipTier ? "hover:bg-destructive hover:text-destructive-foreground" : ""
        }`}
      >
        {membershipTier?.emoji && (
          <span className="mr-1">{membershipTier.emoji}</span>
        )}
        {getButtonText()}
      </Button>

      {/* Notification bell for subscribed users */}
      {isSubscribed && showNotificationIcon && (
        <Button
          variant="ghost"
          size="sm"
          className="px-2"
          data-testid={`button-notifications-${channelId}`}
          onClick={(e) => {
            e.stopPropagation();
            toast({
              title: "Notification Settings",
              description: "Notification settings coming soon!",
            });
          }}
        >
          <Bell className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}