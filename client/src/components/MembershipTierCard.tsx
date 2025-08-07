import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Check, Crown, Star, Gift } from "lucide-react";

interface MembershipTier {
  id: string;
  channelId: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  color: string;
  emoji?: string;
  benefits?: Array<{
    id: string;
    type: string;
    title: string;
    description?: string;
  }>;
}

interface MembershipTierCardProps {
  tier: MembershipTier;
  channelName?: string;
  isCurrentTier?: boolean;
  onJoin?: () => void;
  showBenefits?: boolean;
  compact?: boolean;
}

export default function MembershipTierCard({
  tier,
  channelName,
  isCurrentTier = false,
  onJoin,
  showBenefits = true,
  compact = false
}: MembershipTierCardProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  const joinMutation = useMutation({
    mutationFn: async () => {
      // TODO: Implement Stripe payment integration
      // For now, we'll simulate the membership join
      await apiRequest("POST", `/api/channels/${tier.channelId}/subscribe`, {
        tierId: tier.id,
        type: "member",
        billingPeriod,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/channels/${tier.channelId}/membership`] 
      });
      
      toast({
        title: "Welcome to the membership!",
        description: `You are now a ${tier.name} member of ${channelName || "this channel"}.`,
      });
      
      onJoin?.();
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process membership payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const currentPrice = billingPeriod === "yearly" && tier.yearlyPrice 
    ? tier.yearlyPrice 
    : tier.monthlyPrice;
    
  const monthlyEquivalent = billingPeriod === "yearly" && tier.yearlyPrice
    ? Math.round(tier.yearlyPrice / 12)
    : tier.monthlyPrice;

  const savings = tier.yearlyPrice 
    ? Math.round(((tier.monthlyPrice * 12) - tier.yearlyPrice) / (tier.monthlyPrice * 12) * 100)
    : 0;

  const handleJoin = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to join this membership.",
        variant: "destructive",
      });
      return;
    }
    
    if (tier.channelId === user?.id) {
      toast({
        title: "Cannot Join",
        description: "You cannot join your own channel membership.",
        variant: "destructive",
      });
      return;
    }
    
    joinMutation.mutate();
  };

  const getBenefitIcon = (type: string) => {
    switch (type) {
      case "emoji":
        return "😊";
      case "badge":
        return <Crown className="h-4 w-4" />;
      case "early_access":
        return <Star className="h-4 w-4" />;
      case "exclusive_content":
        return <Gift className="h-4 w-4" />;
      default:
        return <Check className="h-4 w-4" />;
    }
  };

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
        isCurrentTier ? "ring-2 ring-primary" : ""
      } ${compact ? "max-w-sm" : "max-w-md"}`}
      style={{ borderColor: tier.color }}
    >
      {/* Gradient overlay */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: tier.color }}
      />
      
      {isCurrentTier && (
        <div className="absolute top-3 right-3">
          <Badge variant="default" style={{ backgroundColor: tier.color }}>
            Current Tier
          </Badge>
        </div>
      )}

      <CardHeader className={compact ? "pb-4" : "pb-6"}>
        <div className="flex items-center space-x-2">
          {tier.emoji && (
            <span className="text-2xl">{tier.emoji}</span>
          )}
          <CardTitle 
            className="text-xl font-bold"
            style={{ color: tier.color }}
          >
            {tier.name}
          </CardTitle>
        </div>
        
        <CardDescription className={compact ? "text-sm" : ""}>
          {tier.description || `Join the ${tier.name} tier for exclusive benefits`}
        </CardDescription>

        {/* Pricing */}
        <div className="space-y-2">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold">
              ₩{currentPrice.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              /{billingPeriod === "yearly" ? "year" : "month"}
            </span>
          </div>
          
          {billingPeriod === "yearly" && monthlyEquivalent !== tier.monthlyPrice && (
            <div className="text-sm text-muted-foreground">
              ₩{monthlyEquivalent.toLocaleString()}/month • Save {savings}%
            </div>
          )}

          {/* Billing period toggle */}
          {tier.yearlyPrice && !compact && (
            <div className="flex items-center space-x-1 text-sm">
              <Button
                variant={billingPeriod === "monthly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setBillingPeriod("monthly")}
                className="h-8 px-3"
              >
                Monthly
              </Button>
              <Button
                variant={billingPeriod === "yearly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setBillingPeriod("yearly")}
                className="h-8 px-3"
              >
                Yearly
                {savings > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    -{savings}%
                  </Badge>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Benefits */}
      {showBenefits && tier.benefits && tier.benefits.length > 0 && (
        <CardContent className={compact ? "pt-0" : ""}>
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Member Benefits
            </h4>
            <ul className="space-y-2">
              {tier.benefits.slice(0, compact ? 3 : undefined).map((benefit) => (
                <li key={benefit.id} className="flex items-start space-x-2">
                  <div className="flex-shrink-0 mt-0.5 text-primary">
                    {getBenefitIcon(benefit.type)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{benefit.title}</div>
                    {benefit.description && !compact && (
                      <div className="text-xs text-muted-foreground">
                        {benefit.description}
                      </div>
                    )}
                  </div>
                </li>
              ))}
              
              {compact && tier.benefits.length > 3 && (
                <li className="text-sm text-muted-foreground">
                  +{tier.benefits.length - 3} more benefits
                </li>
              )}
            </ul>
          </div>
        </CardContent>
      )}

      <CardFooter className="pt-4">
        <Button
          className="w-full"
          onClick={handleJoin}
          disabled={joinMutation.isPending || isCurrentTier}
          style={
            !isCurrentTier && isAuthenticated
              ? { backgroundColor: tier.color, borderColor: tier.color }
              : undefined
          }
          data-testid={`button-join-tier-${tier.id}`}
        >
          {joinMutation.isPending ? (
            "Processing..."
          ) : isCurrentTier ? (
            "Current Membership"
          ) : (
            `Join ${tier.name}`
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}