import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Eye, 
  BarChart3, 
  Plus,
  Settings,
  Target,
  Zap,
  Home,
  User,
  LogOut,
  Upload,
  Video,
  Sun,
  Moon
} from "lucide-react";
import { Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";

export default function Advertiser() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignBudget, setNewCampaignBudget] = useState("");
  const [newCampaignTarget, setNewCampaignTarget] = useState("");

  // 광고주 정보 조회
  const { data: advertiserInfo } = useQuery({
    queryKey: ["/api/advertiser/profile"],
    enabled: !!user,
  });

  // 캠페인 목록 조회
  const { data: campaigns = [] } = useQuery({
    queryKey: ["/api/advertiser/campaigns"],
    enabled: !!user,
  });

  // 광고 통계 조회
  const { data: adStats } = useQuery({
    queryKey: ["/api/advertiser/stats"],
    enabled: !!user,
  });

  // 새 캠페인 생성
  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/advertiser/campaigns", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertiser/campaigns"] });
      toast({
        title: "캠페인 생성 완료",
        description: "새로운 광고 캠페인이 성공적으로 생성되었습니다.",
      });
      setNewCampaignName("");
      setNewCampaignBudget("");
      setNewCampaignTarget("");
    },
  });

  const handleCreateCampaign = () => {
    if (!newCampaignName || !newCampaignBudget) {
      toast({
        title: "입력 오류",
        description: "캠페인 이름과 예산을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    createCampaignMutation.mutate({
      name: newCampaignName,
      budget: parseInt(newCampaignBudget),
      targetAudience: newCampaignTarget,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                광고주 대시보드
              </h1>
              <Link href="/">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center space-x-2 hover:bg-primary-purple hover:text-white"
                  data-testid="button-home-advertiser"
                >
                  <Home className="h-4 w-4" />
                  <span>PIYAKast 홈</span>
                </Button>
              </Link>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              PIYAKast에서 효과적인 광고 캠페인을 관리하세요
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-testid="button-user-profile-advertiser">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.profileImageUrl || ""} alt={user?.username} />
                  <AvatarFallback>
                    {user?.username?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-elevated border-gray-700" align="end">
              <DropdownMenuItem asChild>
                <Link href={`/profile/${user?.username}`} className="flex items-center cursor-pointer" data-testid="link-profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/studio" className="flex items-center cursor-pointer" data-testid="link-studio">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>Creator Studio</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme} data-testid="button-toggle-theme">
                {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={async () => {
                try {
                  await fetch('/api/logout', { method: 'POST' });
                  window.location.href = '/';
                } catch (error) {
                  console.error('Logout failed:', error);
                }
              }} data-testid="button-logout">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-2 bg-blue-100 rounded-lg mr-4">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  총 광고비
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₩{(adStats as any)?.totalSpend?.toLocaleString() || "0"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-2 bg-green-100 rounded-lg mr-4">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  총 노출수
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(adStats as any)?.totalImpressions?.toLocaleString() || "0"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-2 bg-purple-100 rounded-lg mr-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  총 클릭수
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(adStats as any)?.totalClicks?.toLocaleString() || "0"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-2 bg-orange-100 rounded-lg mr-4">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  평균 CTR
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(adStats as any)?.averageCTR || "0"}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 메인 콘텐츠 */}
        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              캠페인 관리
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              분석 및 리포트
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              결제 및 청구
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              계정 설정
            </TabsTrigger>
          </TabsList>

          {/* 캠페인 관리 */}
          <TabsContent value="campaigns" className="space-y-6">
            {/* 새 캠페인 생성 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  새 캠페인 생성
                </CardTitle>
                <CardDescription>
                  새로운 광고 캠페인을 생성하고 타겟 오디언스를 설정하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="campaignName">캠페인 이름</Label>
                    <Input
                      id="campaignName"
                      value={newCampaignName}
                      onChange={(e) => setNewCampaignName(e.target.value)}
                      placeholder="예: 2025 신제품 런칭"
                    />
                  </div>
                  <div>
                    <Label htmlFor="campaignBudget">일일 예산 (원)</Label>
                    <Input
                      id="campaignBudget"
                      type="number"
                      value={newCampaignBudget}
                      onChange={(e) => setNewCampaignBudget(e.target.value)}
                      placeholder="50000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="targetAudience">타겟 오디언스</Label>
                    <Select value={newCampaignTarget} onValueChange={setNewCampaignTarget}>
                      <SelectTrigger>
                        <SelectValue placeholder="타겟 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="k-beauty">K-Beauty 관심층</SelectItem>
                        <SelectItem value="k-pop">K-Pop 팬</SelectItem>
                        <SelectItem value="k-drama">K-Drama 시청자</SelectItem>
                        <SelectItem value="k-food">K-Food 애호가</SelectItem>
                        <SelectItem value="general">전체 사용자</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  onClick={handleCreateCampaign}
                  disabled={createCampaignMutation.isPending}
                  className="mt-4"
                >
                  {createCampaignMutation.isPending ? "생성 중..." : "캠페인 생성"}
                </Button>
              </CardContent>
            </Card>

            {/* 기존 캠페인 목록 */}
            <Card>
              <CardHeader>
                <CardTitle>활성 캠페인</CardTitle>
                <CardDescription>
                  현재 실행 중인 광고 캠페인들을 확인하고 관리하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(campaigns as any[]).length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>아직 생성된 캠페인이 없습니다.</p>
                    <p className="text-sm">위에서 첫 번째 캠페인을 생성해보세요!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(campaigns as any[]).map((campaign: any) => (
                      <Card key={campaign.id} className="border border-gray-200 dark:border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-2">{campaign.name}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span>예산: ₩{campaign.budget?.toLocaleString()}/일</span>
                                <span>•</span>
                                <span>타겟: {campaign.targetAudience}</span>
                                <span>•</span>
                                <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                                  {campaign.status === 'active' ? '실행중' : '일시정지'}
                                </Badge>
                              </div>
                              <div className="mt-3">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>예산 사용률</span>
                                  <span>{campaign.spendPercentage || 0}%</span>
                                </div>
                                <Progress value={campaign.spendPercentage || 0} className="h-2" />
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button variant="outline" size="sm">
                                <BarChart3 className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Settings className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 분석 및 리포트 */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>광고 성과 분석</CardTitle>
                <CardDescription>
                  광고 캠페인의 상세한 성과 데이터를 확인하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>광고 분석 데이터를 준비 중입니다.</p>
                  <p className="text-sm">곧 상세한 성과 리포트를 제공할 예정입니다.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 결제 및 청구 */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>결제 정보</CardTitle>
                <CardDescription>
                  결제 방법과 청구 내역을 관리하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>결제 시스템을 설정 중입니다.</p>
                  <p className="text-sm">다양한 결제 방법을 지원할 예정입니다.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 계정 설정 */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>광고주 계정 설정</CardTitle>
                <CardDescription>
                  광고주 프로필과 계정 정보를 관리하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">회사명</Label>
                    <Input id="companyName" value={user?.name || ""} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="email">이메일</Label>
                    <Input id="email" value={user?.email || ""} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="phone">연락처</Label>
                    <Input id="phone" placeholder="연락처를 입력하세요" />
                  </div>
                  <div>
                    <Label htmlFor="businessType">업종</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="업종을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beauty">뷰티/화장품</SelectItem>
                        <SelectItem value="fashion">패션/의류</SelectItem>
                        <SelectItem value="food">식품/음료</SelectItem>
                        <SelectItem value="electronics">전자제품</SelectItem>
                        <SelectItem value="entertainment">엔터테인먼트</SelectItem>
                        <SelectItem value="other">기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="mt-4">
                    설정 저장
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}