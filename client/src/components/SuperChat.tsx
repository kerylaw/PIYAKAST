import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "../hooks/use-auth";
import { Heart, Sparkles, Crown, Diamond, Star, Timer, User, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

// SuperChat tier configurations
const SUPERCHAT_TIERS = [
  {
    name: "Bronze",
    minAmount: 1000,
    maxAmount: 4999,
    color: "#CD7F32",
    bgColor: "bg-amber-100 dark:bg-amber-900",
    textColor: "text-amber-800 dark:text-amber-200",
    borderColor: "border-amber-500",
    duration: 5,
    icon: Heart,
  },
  {
    name: "Silver", 
    minAmount: 5000,
    maxAmount: 9999,
    color: "#C0C0C0",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-800 dark:text-gray-200",
    borderColor: "border-gray-500",
    duration: 10,
    icon: Sparkles,
  },
  {
    name: "Gold",
    minAmount: 10000,
    maxAmount: 19999,
    color: "#FFD700",
    bgColor: "bg-yellow-100 dark:bg-yellow-900",
    textColor: "text-yellow-800 dark:text-yellow-200",
    borderColor: "border-yellow-500",
    duration: 20,
    icon: Crown,
  },
  {
    name: "Diamond",
    minAmount: 20000,
    maxAmount: 49999,
    color: "#B9F2FF",
    bgColor: "bg-cyan-100 dark:bg-cyan-900",
    textColor: "text-cyan-800 dark:text-cyan-200",
    borderColor: "border-cyan-500",
    duration: 30,
    icon: Diamond,
  },
  {
    name: "Premium",
    minAmount: 50000,
    maxAmount: 999999,
    color: "#FF6B6B",
    bgColor: "bg-red-100 dark:bg-red-900",
    textColor: "text-red-800 dark:text-red-200",
    borderColor: "border-red-500",
    duration: 60,
    icon: Star,
  },
];

interface SuperChatData {
  streamId: string;
  message: string;
  amount: number;
  currency: string;
}

interface SuperChatDisplayProps {
  superchats: any[];
  streamId: string;
}

interface SuperChatFormProps {
  streamId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (superchat: any) => void;
}

// SuperChat Form Component with Stripe Integration
function SuperChatForm({ streamId, isOpen, onClose, onSuccess }: SuperChatFormProps) {
  const [amount, setAmount] = useState<number>(5000);
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();

  const selectedTier = SUPERCHAT_TIERS.find(
    tier => amount >= tier.minAmount && amount <= tier.maxAmount
  ) || SUPERCHAT_TIERS[0];

  const createPaymentIntentMutation = useMutation({
    mutationFn: async (data: SuperChatData) => {
      const response = await apiRequest("POST", "/api/superchat/payment-intent", data);
      return response.json();
    },
    onError: (error: Error) => {
      toast({
        title: "결제 준비 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const confirmSuperchatMutation = useMutation({
    mutationFn: async (paymentIntentId: string) => {
      const response = await apiRequest("POST", "/api/superchat/confirm", {
        paymentIntentId,
        streamId,
        message,
        amount,
      });
      return response.json();
    },
    onSuccess: (superchat) => {
      toast({
        title: "슈퍼챗 전송 완료!",
        description: `₩${amount.toLocaleString()}원 슈퍼챗이 전송되었습니다.`,
      });
      onSuccess(superchat);
      onClose();
      setMessage("");
      setAmount(5000);
    },
    onError: (error: Error) => {
      toast({
        title: "슈퍼챗 전송 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !user) {
      toast({
        title: "결제 시스템 오류",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "메시지를 입력해주세요",
        description: "슈퍼챗 메시지는 필수입니다.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent
      const { clientSecret } = await createPaymentIntentMutation.mutateAsync({
        streamId,
        message,
        amount,
        currency: "KRW",
      });

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("카드 정보를 입력해주세요.");
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user.username || user.email,
            email: user.email,
          },
        },
      });

      if (error) {
        throw new Error(error.message || "결제에 실패했습니다.");
      }

      if (paymentIntent.status === "succeeded") {
        await confirmSuperchatMutation.mutateAsync(paymentIntent.id);
      }
    } catch (error: any) {
      toast({
        title: "결제 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (value: string) => {
    const number = parseInt(value.replace(/[^\d]/g, ""));
    return isNaN(number) ? 0 : Math.min(Math.max(number, 1000), 999999);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            슈퍼챗 보내기
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Selection */}
          <div className="space-y-2">
            <Label htmlFor="amount">금액 (₩)</Label>
            <Input
              id="amount"
              type="text"
              value={amount.toLocaleString()}
              onChange={(e) => setAmount(formatAmount(e.target.value))}
              placeholder="1,000 - 999,999"
              disabled={isProcessing}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {[1000, 5000, 10000, 20000, 50000].map((preset) => (
                <Button
                  key={preset}
                  variant={amount === preset ? "default" : "outline"}
                  size="sm"
                  type="button"
                  onClick={() => setAmount(preset)}
                  disabled={isProcessing}
                >
                  ₩{preset.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          {/* Tier Display */}
          <Card className={`${selectedTier.bgColor} ${selectedTier.borderColor} border-2`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <selectedTier.icon className={`w-5 h-5 ${selectedTier.textColor}`} />
                  <span className={`font-medium ${selectedTier.textColor}`}>
                    {selectedTier.name} 티어
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {selectedTier.duration}초 고정
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">메시지</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 200))}
              placeholder="슈퍼챗 메시지를 입력하세요..."
              rows={3}
              disabled={isProcessing}
              maxLength={200}
            />
            <div className="text-xs text-gray-500 text-right">
              {message.length}/200
            </div>
          </div>

          {/* Payment Card */}
          <div className="space-y-2">
            <Label>카드 정보</Label>
            <div className="p-3 border rounded-md">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#424770",
                      "::placeholder": {
                        color: "#aab7c4",
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Revenue Share Info */}
          <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded">
            💰 수익 배분: 크리에이터 70% (₩{Math.floor(amount * 0.7).toLocaleString()}), 
            PIYAKast 30% (₩{Math.floor(amount * 0.3).toLocaleString()})
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={!stripe || !elements || isProcessing || !message.trim()}
            size="lg"
          >
            {isProcessing ? "결제 중..." : `₩${amount.toLocaleString()} 슈퍼챗 보내기`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// SuperChat Display Component with Pinned Messages
export function SuperChatDisplay({ superchats, streamId }: SuperChatDisplayProps) {
  const [pinnedSuperchats, setPinnedSuperchats] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Filter and sort pinned superchats
    const pinned = superchats
      .filter(sc => {
        if (!sc.isPinned || !sc.pinnedUntil) return false;
        return new Date(sc.pinnedUntil).getTime() > currentTime;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setPinnedSuperchats(pinned);
  }, [superchats, currentTime]);

  const getRemainingTime = (pinnedUntil: string) => {
    const remaining = new Date(pinnedUntil).getTime() - currentTime;
    return Math.max(0, Math.floor(remaining / 1000));
  };

  const getProgressPercentage = (createdAt: string, pinnedUntil: string) => {
    const created = new Date(createdAt).getTime();
    const expires = new Date(pinnedUntil).getTime();
    const total = expires - created;
    const elapsed = currentTime - created;
    return Math.max(0, Math.min(100, ((total - elapsed) / total) * 100));
  };

  const getTierForAmount = (amount: number) => {
    return SUPERCHAT_TIERS.find(
      tier => amount >= tier.minAmount && amount <= tier.maxAmount
    ) || SUPERCHAT_TIERS[0];
  };

  if (pinnedSuperchats.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        📌 고정된 슈퍼챗
      </div>
      
      {pinnedSuperchats.map((superchat) => {
        const tier = getTierForAmount(superchat.amount);
        const remainingTime = getRemainingTime(superchat.pinnedUntil);
        const progress = getProgressPercentage(superchat.createdAt, superchat.pinnedUntil);
        
        return (
          <Card 
            key={superchat.id}
            className={`${tier.bgColor} ${tier.borderColor} border-2 animate-pulse`}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <tier.icon className={`w-4 h-4 ${tier.textColor}`} />
                  <span className={`font-medium text-sm ${tier.textColor}`}>
                    {superchat.user?.username || "Anonymous"}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    ₩{superchat.amount.toLocaleString()}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Timer className="w-3 h-3" />
                  {remainingTime}초
                </div>
              </div>
              
              <p className={`text-sm ${tier.textColor} mb-2`}>
                {superchat.message}
              </p>
              
              <Progress 
                value={progress} 
                className="h-1"
                style={{
                  background: `linear-gradient(to right, ${tier.color} 0%, ${tier.color} ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`
                }}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Main SuperChat Component
export default function SuperChat({ streamId }: { streamId: string }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user } = useAuth();

  const { data: superchatsData, refetch } = useQuery({
    queryKey: ["/api/superchats", streamId],
    enabled: !!streamId,
  });
  
  const superchats = Array.isArray(superchatsData) ? superchatsData : [];

  const { data: creatorSettings } = useQuery({
    queryKey: ["/api/creator-settings", user?.id],
    enabled: !!user?.id,
  });

  const handleSuperchatSuccess = (superchat: any) => {
    refetch();
  };

  // Check if user is eligible for SuperChat
  const settings = creatorSettings as any;
  const isEligible = settings?.isSuperchatEnabled && 
                    settings?.isMonetizationEnabled &&
                    user;

  if (!isEligible) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
        <Heart className="w-8 h-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          이 스트림에서는 슈퍼챗을 사용할 수 없습니다.
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="space-y-4">
        <SuperChatDisplay superchats={superchats} streamId={streamId} />
        
        <Button
          onClick={() => setIsFormOpen(true)}
          className="w-full"
          variant="outline"
          size="lg"
        >
          <Heart className="w-4 h-4 mr-2" />
          슈퍼챗 보내기
        </Button>
        
        <SuperChatForm
          streamId={streamId}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleSuperchatSuccess}
        />
      </div>
    </Elements>
  );
}