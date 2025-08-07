import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Shield, AlertTriangle, CheckCircle, XCircle, Upload, Search, FileText, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface CopyrightClaim {
  id: string;
  videoId: string;
  claimType: "music" | "video" | "image" | "other";
  claimSource: string;
  description: string;
  status: "pending" | "approved" | "rejected" | "dispute";
  claimedAt: string;
  resolvedAt?: string;
  video: {
    id: string;
    title: string;
    thumbnailUrl?: string;
  };
}

interface CopyrightDispute {
  id: string;
  claimId: string;
  reason: string;
  evidence: string;
  status: "pending" | "resolved";
  submittedAt: string;
}

export default function CopyrightManagement() {
  const { user } = useAuth();
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<CopyrightClaim | null>(null);
  const [disputeForm, setDisputeForm] = useState({
    reason: "",
    evidence: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  // Fetch copyright claims
  const { data: claims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ["/api/copyright/claims", user?.id],
    enabled: !!user?.id,
  });

  // Fetch copyright disputes
  const { data: disputes = [], isLoading: disputesLoading } = useQuery({
    queryKey: ["/api/copyright/disputes", user?.id],
    enabled: !!user?.id,
  });

  // Submit dispute mutation
  const submitDisputeMutation = useMutation({
    mutationFn: async (data: { claimId: string; reason: string; evidence: string }) => {
      const response = await apiRequest("POST", "/api/copyright/disputes", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "이의제기 제출 완료",
        description: "저작권 이의제기가 성공적으로 제출되었습니다.",
      });
      setShowDisputeDialog(false);
      setSelectedClaim(null);
      setDisputeForm({ reason: "", evidence: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/copyright/disputes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "이의제기 제출 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Acknowledge claim mutation
  const acknowledgeClaimMutation = useMutation({
    mutationFn: async (claimId: string) => {
      await apiRequest("PATCH", `/api/copyright/claims/${claimId}/acknowledge`);
    },
    onSuccess: () => {
      toast({
        title: "저작권 신고 인정",
        description: "저작권 신고를 인정했습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/copyright/claims"] });
    },
    onError: (error: Error) => {
      toast({
        title: "처리 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDispute = (claim: CopyrightClaim) => {
    setSelectedClaim(claim);
    setShowDisputeDialog(true);
  };

  const handleSubmitDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim || !disputeForm.reason.trim() || !disputeForm.evidence.trim()) {
      toast({
        title: "필수 정보 누락",
        description: "이의제기 사유와 증거를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    submitDisputeMutation.mutate({
      claimId: selectedClaim.id,
      reason: disputeForm.reason,
      evidence: disputeForm.evidence,
    });
  };

  const handleAcknowledgeClaim = (claimId: string) => {
    if (confirm("저작권 신고를 인정하시겠습니까? 이 작업은 취소할 수 없습니다.")) {
      acknowledgeClaimMutation.mutate(claimId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-500">검토 중</Badge>;
      case "approved":
        return <Badge variant="destructive">신고 인정</Badge>;
      case "rejected":
        return <Badge variant="default" className="bg-green-600">신고 기각</Badge>;
      case "dispute":
        return <Badge variant="secondary">이의제기 중</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getClaimTypeLabel = (type: string) => {
    switch (type) {
      case "music": return "음악";
      case "video": return "영상";
      case "image": return "이미지";
      default: return "기타";
    }
  };

  const filteredClaims = claims.filter((claim: CopyrightClaim) =>
    claim.video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.claimSource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClaimStats = () => {
    const total = claims.length;
    const pending = claims.filter((c: CopyrightClaim) => c.status === "pending").length;
    const approved = claims.filter((c: CopyrightClaim) => c.status === "approved").length;
    const rejected = claims.filter((c: CopyrightClaim) => c.status === "rejected").length;
    
    return { total, pending, approved, rejected };
  };

  const stats = getClaimStats();

  if (claimsLoading || disputesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">저작권 관리</h2>
        <p className="text-gray-400 mt-1">
          내 콘텐츠에 대한 저작권 신고를 관리하고 대응하세요
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">총 신고</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Shield className="h-8 w-8 text-primary-purple" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">검토 중</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">신고 인정</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">신고 기각</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="claims" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="claims">저작권 신고</TabsTrigger>
          <TabsTrigger value="disputes">이의제기</TabsTrigger>
        </TabsList>
        
        <TabsContent value="claims" className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="동영상 제목이나 신고자로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Claims List */}
          <div className="space-y-4">
            {filteredClaims.map((claim: CopyrightClaim) => (
              <Card key={claim.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex space-x-4 flex-1">
                      <div className="w-20 h-14 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                        {claim.video.thumbnailUrl ? (
                          <img
                            src={claim.video.thumbnailUrl}
                            alt={claim.video.title}
                            className="w-20 h-14 rounded object-cover"
                          />
                        ) : (
                          <FileText className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate mb-1" data-testid={`claim-video-${claim.id}`}>
                          {claim.video.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                          <span>유형: {getClaimTypeLabel(claim.claimType)}</span>
                          <span>신고자: {claim.claimSource}</span>
                          <span>{new Date(claim.claimedAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{claim.description}</p>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(claim.status)}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      {claim.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDispute(claim)}
                            data-testid={`button-dispute-${claim.id}`}
                          >
                            이의제기
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcknowledgeClaim(claim.id)}
                            data-testid={`button-acknowledge-${claim.id}`}
                          >
                            인정
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-view-claim-${claim.id}`}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredClaims.length === 0 && (
            <Card className="p-8 text-center">
              <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? "검색 결과가 없습니다" : "저작권 신고가 없습니다"}
              </h3>
              <p className="text-gray-400">
                {searchTerm ? "다른 검색어를 시도해보세요" : "현재 저작권 신고된 콘텐츠가 없습니다"}
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="disputes" className="space-y-4">
          <div className="space-y-4">
            {disputes.map((dispute: CopyrightDispute) => (
              <Card key={dispute.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">이의제기 #{dispute.id.slice(-8)}</h3>
                      <p className="text-sm text-gray-400 mb-2">
                        제출일: {new Date(dispute.submittedAt).toLocaleDateString()}
                      </p>
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1">이의제기 사유:</p>
                        <p className="text-sm text-gray-300">{dispute.reason}</p>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1">제출 증거:</p>
                        <p className="text-sm text-gray-300">{dispute.evidence}</p>
                      </div>
                      <Badge variant={dispute.status === "pending" ? "outline" : "default"}>
                        {dispute.status === "pending" ? "검토 중" : "처리 완료"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {disputes.length === 0 && (
            <Card className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">이의제기 내역이 없습니다</h3>
              <p className="text-gray-400">
                저작권 신고에 대한 이의제기를 제출한 내역이 없습니다
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dispute Dialog */}
      <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>저작권 이의제기</DialogTitle>
          </DialogHeader>
          {selectedClaim && (
            <form onSubmit={handleSubmitDispute} className="space-y-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-2">신고된 동영상</h4>
                <p className="text-sm text-gray-300">{selectedClaim.video.title}</p>
                <p className="text-xs text-gray-400 mt-1">
                  신고자: {selectedClaim.claimSource} | 유형: {getClaimTypeLabel(selectedClaim.claimType)}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">이의제기 사유 *</Label>
                <Textarea
                  id="reason"
                  value={disputeForm.reason}
                  onChange={(e) => setDisputeForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="저작권 신고에 대한 이의제기 사유를 상세히 설명해주세요..."
                  rows={4}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="evidence">증거 자료 *</Label>
                <Textarea
                  id="evidence"
                  value={disputeForm.evidence}
                  onChange={(e) => setDisputeForm(prev => ({ ...prev, evidence: e.target.value }))}
                  placeholder="이의제기를 뒷받침할 수 있는 증거나 자료를 설명해주세요 (링크, 라이선스 정보 등)..."
                  rows={4}
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDisputeDialog(false)}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={submitDisputeMutation.isPending}
                >
                  이의제기 제출
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}