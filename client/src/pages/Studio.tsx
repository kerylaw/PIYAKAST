import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  Video, 
  Users, 
  DollarSign, 
  Settings, 
  Upload, 
  List, 
  MessageSquare, 
  Shield,
  TrendingUp,
  Eye,
  Clock,
  MapPin,
  CreditCard,
  Palette,
  UserCog,
  PieChart,
  Target,
  Calendar,
  FileText,
  Heart,
  Bookmark
} from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import VideoUpload from "@/components/VideoUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Studio() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Fetch user's content data
  const { data: userVideos = [] } = useQuery({
    queryKey: ["/api/users", user?.id, "videos"],
    enabled: !!user?.id,
  });

  const { data: userStreams = [] } = useQuery({
    queryKey: ["/api/streams", "user", user?.id],
    enabled: !!user?.id,
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics", user?.id],
    enabled: !!user?.id,
  });

  const { data: revenue } = useQuery({
    queryKey: ["/api/revenue", user?.id],
    enabled: !!user?.id,
  });

  const { data: channelSettings } = useQuery({
    queryKey: ["/api/channel-settings", user?.id],
    enabled: !!user?.id,
  });

  // Calculate basic stats from API data
  const videosArray = Array.isArray(userVideos) ? userVideos : [];
  const streamsArray = Array.isArray(userStreams) ? userStreams : [];
  const analyticsData = analytics || {};
  const revenueData = revenue || {};
  
  // Use real analytics data or fallback to calculated values
  const totalViews = (analyticsData as any)?.totalViews || videosArray.reduce((sum: number, video: any) => sum + (video.viewCount || 0), 0);
  const totalVideos = (analyticsData as any)?.totalVideos || videosArray.length;
  const liveStreams = (analyticsData as any)?.liveStreams || streamsArray.filter((stream: any) => stream.isLive).length;
  const totalRevenue = (revenueData as any)?.totalRevenue || 0;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Studio Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="text-studio-title">
                PIYAKast Studio
              </h1>
              <p className="text-gray-400">
                콘텐츠 관리, 분석, 수익화를 한 곳에서
              </p>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0">
              <Button 
                onClick={() => setShowUploadModal(true)}
                className="bg-primary-purple hover:bg-purple-700"
                data-testid="button-upload-video-studio"
              >
                <Upload className="h-4 w-4 mr-2" />
                동영상 업로드
              </Button>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">총 조회수</p>
                    <p className="text-2xl font-bold" data-testid="text-total-views">
                      {totalViews.toLocaleString()}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-primary-purple" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">업로드된 동영상</p>
                    <p className="text-2xl font-bold" data-testid="text-total-videos">
                      {totalVideos}
                    </p>
                  </div>
                  <Video className="h-8 w-8 text-primary-purple" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">라이브 스트림</p>
                    <p className="text-2xl font-bold" data-testid="text-live-streams">
                      {liveStreams}
                    </p>
                  </div>
                  <div className="relative">
                    <Users className="h-8 w-8 text-primary-purple" />
                    {liveStreams > 0 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-live-red rounded-full animate-pulse" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">총 수익</p>
                    <p className="text-2xl font-bold" data-testid="text-total-revenue">
                      ₩{totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary-purple" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card-bg">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              개요
            </TabsTrigger>
            <TabsTrigger value="content" data-testid="tab-content">
              <Video className="h-4 w-4 mr-2" />
              콘텐츠 관리
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <TrendingUp className="h-4 w-4 mr-2" />
              채널 분석
            </TabsTrigger>
            <TabsTrigger value="monetization" data-testid="tab-monetization">
              <DollarSign className="h-4 w-4 mr-2" />
              수익 관리
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    최근 활동
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {videosArray.slice(0, 5).map((video: any, index: number) => (
                      <div key={video.id} className="flex items-center space-x-3">
                        <div className="w-16 h-12 bg-gray-700 rounded flex-shrink-0 flex items-center justify-center">
                          <Video className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" data-testid={`text-recent-video-${index}`}>
                            {video.title}
                          </p>
                          <p className="text-sm text-gray-400">
                            {video.viewCount} 조회수 • {new Date(video.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    성과 요약
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">이번 달 조회수</span>
                      <span className="font-semibold">+{(analyticsData as any)?.growth?.views || 0}%</span>
                    </div>
                    <Progress value={(analyticsData as any)?.growth?.views || 0} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">구독자 증가</span>
                      <span className="font-semibold">+{(analyticsData as any)?.growth?.subscribers || 0}%</span>
                    </div>
                    <Progress value={(analyticsData as any)?.growth?.subscribers || 0} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">시청 시간</span>
                      <span className="font-semibold">+{(analyticsData as any)?.growth?.watchTime || 0}%</span>
                    </div>
                    <Progress value={(analyticsData as any)?.growth?.watchTime || 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Management Tab */}
          <TabsContent value="content" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Content Actions */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>콘텐츠 관리</CardTitle>
                    <CardDescription>
                      동영상, 플레이리스트, 댓글을 관리하세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={() => setShowUploadModal(true)}
                      className="w-full justify-start" 
                      variant="outline"
                      data-testid="button-upload-video-content"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      동영상 업로드
                    </Button>
                    <Button className="w-full justify-start" variant="outline" data-testid="button-manage-playlists">
                      <List className="h-4 w-4 mr-2" />
                      플레이리스트 관리
                    </Button>
                    <Button className="w-full justify-start" variant="outline" data-testid="button-manage-comments">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      댓글 관리
                    </Button>
                    <Button className="w-full justify-start" variant="outline" data-testid="button-copyright-management">
                      <Shield className="h-4 w-4 mr-2" />
                      저작권 관리
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Video List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>내 동영상</CardTitle>
                    <CardDescription>
                      업로드한 동영상을 관리하고 성과를 확인하세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {videosArray.map((video: any, index: number) => (
                        <div key={video.id} className="flex items-center space-x-4 p-3 bg-gray-800/50 rounded-lg">
                          <div className="w-24 h-16 bg-gray-700 rounded flex-shrink-0 flex items-center justify-center">
                            <Video className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate" data-testid={`text-video-title-${index}`}>
                              {video.title}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                              <span>{video.viewCount} 조회수</span>
                              <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                              <Badge variant={video.isPublic ? "default" : "secondary"}>
                                {video.isPublic ? "공개" : "비공개"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" data-testid={`button-edit-video-${index}`}>
                              편집
                            </Button>
                            <Button size="sm" variant="outline" data-testid={`button-analytics-video-${index}`}>
                              분석
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Dashboard Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    대시보드 지표
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-800/50 rounded">
                      <div className="text-2xl font-bold text-blue-400">
                        {totalViews.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">총 조회수</div>
                    </div>
                    <div className="text-center p-3 bg-gray-800/50 rounded">
                      <div className="text-2xl font-bold text-green-400">
                        {((analyticsData as any)?.followerCount || 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">구독자</div>
                    </div>
                    <div className="text-center p-3 bg-gray-800/50 rounded">
                      <div className="text-2xl font-bold text-purple-400">
                        {Math.floor(totalViews / 60).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">시간 시청</div>
                    </div>
                    <div className="text-center p-3 bg-gray-800/50 rounded">
                      <div className="text-2xl font-bold text-orange-400">
                        {((analyticsData as any)?.weeklyComments || 0) > 0 ? Math.min(Math.floor(((analyticsData as any)?.weeklyComments / totalViews) * 10000), 100) : 0}%
                      </div>
                      <div className="text-sm text-gray-400">참여율</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Audience Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    시청자 분석
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>18-24세</span>
                        <span>{(analyticsData as any)?.demographics?.["18-24"] || 0}%</span>
                      </div>
                      <Progress value={(analyticsData as any)?.demographics?.["18-24"] || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>25-34세</span>
                        <span>{(analyticsData as any)?.demographics?.["25-34"] || 0}%</span>
                      </div>
                      <Progress value={(analyticsData as any)?.demographics?.["25-34"] || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>35-44세</span>
                        <span>{(analyticsData as any)?.demographics?.["35-44"] || 0}%</span>
                      </div>
                      <Progress value={(analyticsData as any)?.demographics?.["35-44"] || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>45세 이상</span>
                        <span>{(analyticsData as any)?.demographics?.["45+"] || 0}%</span>
                      </div>
                      <Progress value={(analyticsData as any)?.demographics?.["45+"] || 0} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Analysis & Traffic Source */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    성과 분석
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">평균 시청 시간</span>
                      <span className="font-semibold">{(analyticsData as any)?.performance?.averageViewDuration || "0:00"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">클릭률 (CTR)</span>
                      <span className="font-semibold">{(analyticsData as any)?.performance?.clickThroughRate || "0%"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">좋아요 비율</span>
                      <span className="font-semibold">{(analyticsData as any)?.performance?.likeRatio || "0%"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">댓글 참여율</span>
                      <span className="font-semibold">{(analyticsData as any)?.performance?.commentEngagement || "0%"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    트래픽 소스 분석
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">검색</span>
                      <span className="font-semibold">{(analyticsData as any)?.trafficSources?.search || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">추천 동영상</span>
                      <span className="font-semibold">{(analyticsData as any)?.trafficSources?.suggested || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">외부 사이트</span>
                      <span className="font-semibold">{(analyticsData as any)?.trafficSources?.external || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">직접 접근</span>
                      <span className="font-semibold">{(analyticsData as any)?.trafficSources?.direct || 0}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Monetization Tab */}
          <TabsContent value="monetization" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Revenue Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    수익 현황
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg border border-green-700">
                      <div className="text-3xl font-bold text-green-400 mb-2">
                        ₩{totalRevenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">이번 달 총 수익</div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">슈퍼챗</span>
                        <span className="font-semibold">₩{((revenueData as any)?.superchatRevenue || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">멤버십</span>
                        <span className="font-semibold">₩{((revenueData as any)?.membershipRevenue || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">기타</span>
                        <span className="font-semibold">₩{((revenueData as any)?.otherRevenue || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    수익 배분 및 정산
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-3 bg-blue-900/20 rounded border border-blue-700">
                      <div className="text-lg font-bold text-blue-400">
                        ₩{((revenueData as any)?.creatorShare || 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">크리에이터 수익 (70%)</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-800/50 rounded">
                      <div className="text-lg font-bold text-gray-400">
                        ₩{((revenueData as any)?.platformShare || 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">플랫폼 수수료 (30%)</div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>다음 정산일</span>
                        <span className="font-semibold">{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>정산 최소 금액</span>
                        <span className="font-semibold">₩10,000</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monetization Settings */}
            <Card>
              <CardHeader>
                <CardTitle>수익화 설정</CardTitle>
                <CardDescription>
                  슈퍼챗, 멤버십 등의 수익화 기능을 관리하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Heart className="h-5 w-5 text-red-400" />
                      <Badge variant="default">활성화</Badge>
                    </div>
                    <h4 className="font-semibold mb-1">슈퍼챗</h4>
                    <p className="text-sm text-gray-400">실시간 후원 메시지</p>
                  </div>
                  
                  <div className="p-4 border border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="h-5 w-5 text-purple-400" />
                      <Badge variant="secondary">준비중</Badge>
                    </div>
                    <h4 className="font-semibold mb-1">멤버십</h4>
                    <p className="text-sm text-gray-400">월 구독 서비스</p>
                  </div>
                  
                  <div className="p-4 border border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Bookmark className="h-5 w-5 text-green-400" />
                      <Badge variant="secondary">준비중</Badge>
                    </div>
                    <h4 className="font-semibold mb-1">굿즈 선반</h4>
                    <p className="text-sm text-gray-400">상품 판매</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Upload Modal */}
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>동영상 업로드</DialogTitle>
            </DialogHeader>
            <VideoUpload />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}