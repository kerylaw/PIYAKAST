import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Gift, Heart } from "lucide-react";

interface SuperChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { message: string; amount: number }) => void;
}

interface SuperChatTier {
  amount: number;
  color: string;
  duration: number; // seconds
  name: string;
  description: string;
}

const superChatTiers: SuperChatTier[] = [
  {
    amount: 1000,
    color: "bg-blue-500",
    duration: 30,
    name: "블루",
    description: "30초간 표시",
  },
  {
    amount: 5000,
    color: "bg-green-500",
    duration: 60,
    name: "그린",
    description: "1분간 표시",
  },
  {
    amount: 10000,
    color: "bg-yellow-500",
    duration: 120,
    name: "골드",
    description: "2분간 표시",
  },
  {
    amount: 20000,
    color: "bg-purple-500",
    duration: 300,
    name: "퍼플",
    description: "5분간 표시",
  },
  {
    amount: 50000,
    color: "bg-red-500",
    duration: 600,
    name: "레드",
    description: "10분간 표시",
  },
];

export function SuperChatModal({ open, onOpenChange, onSubmit }: SuperChatModalProps) {
  const [selectedTier, setSelectedTier] = useState<SuperChatTier>(superChatTiers[0]);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    try {
      const amount = customAmount || selectedTier.amount;
      await onSubmit({ message: message.trim(), amount });
      
      // Reset form
      setMessage("");
      setCustomAmount(null);
      setSelectedTier(superChatTiers[0]);
    } catch (error) {
      console.error("Superchat submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalAmount = customAmount || selectedTier.amount;
  const finalColor = customAmount 
    ? superChatTiers.find(tier => customAmount >= tier.amount)?.color || superChatTiers[0].color
    : selectedTier.color;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-yellow-500" />
            슈퍼챗 보내기
          </DialogTitle>
          <DialogDescription>
            채팅을 강조하고 스트리머를 후원해보세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tier Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">후원 금액 선택</Label>
            <div className="grid grid-cols-2 gap-2">
              {superChatTiers.map((tier) => (
                <Card
                  key={tier.amount}
                  className={`cursor-pointer transition-all ${
                    selectedTier.amount === tier.amount && !customAmount
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedTier(tier);
                    setCustomAmount(null);
                  }}
                  data-testid={`tier-${tier.amount}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${tier.color}`} />
                      <span className="font-medium text-sm">₩{tier.amount.toLocaleString()}</span>
                      <Badge variant="secondary" className="text-xs">
                        {tier.name}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {tier.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <Label htmlFor="customAmount" className="text-sm font-medium">
              직접 입력 (최소 1,000원)
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="customAmount"
                type="number"
                min="1000"
                step="1000"
                value={customAmount || ""}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || null;
                  if (value && value >= 1000) {
                    setCustomAmount(value);
                  } else {
                    setCustomAmount(null);
                  }
                }}
                placeholder="직접 금액 입력..."
                className="pl-10"
                data-testid="input-custom-amount"
              />
            </div>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">
              메시지 (필수)
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="후원 메시지를 입력해주세요..."
              className="min-h-[80px] resize-none"
              maxLength={200}
              data-testid="textarea-superchat-message"
              required
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
              {message.length}/200
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">미리보기</Label>
            <Card>
              <CardContent className="p-3">
                <div 
                  className={`${finalColor} text-white p-3 rounded-lg`}
                  data-testid="superchat-preview"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      <span className="font-medium text-sm">사용자님</span>
                    </div>
                    <Badge className="text-xs bg-white/20 text-white">
                      ₩{finalAmount.toLocaleString()}
                    </Badge>
                  </div>
                  <p className="text-sm">
                    {message || "메시지가 여기에 표시됩니다"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              data-testid="button-cancel-superchat"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!message.trim() || isSubmitting}
              data-testid="button-send-superchat"
            >
              {isSubmitting ? "전송 중..." : `₩${finalAmount.toLocaleString()} 후원하기`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}