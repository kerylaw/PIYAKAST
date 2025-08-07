import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Users, 
  Video, 
  MessageSquare, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Flag, 
  Ban, 
  Play, 
  Pause, 
  Trash2, 
  Eye, 
  EyeOff, 
  Settings,
  BarChart3,
  FileText,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  Crown,
  UserCheck,
  UserX,
  CheckCircle,
  Heart,
  XCircle,
  Clock,
  Globe,
  Lock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalVideos: number;
  totalStreams: number;
  totalViews: number;
  totalRevenue: number;
  pendingReports: number;
  newUsersToday: number;
  newVideosToday: number;
  newUsersLastWeek: number;
  dailyActiveUsers: number;
  newUsersGrowthRate: number;
  activeUsersGrowthRate: number;
  userRetentionRate: number;
  dailyUploads: number;
  averageWatchTime: number;
  likeRatio: number;
  dailyPageViews: number;
  averageSessionTime: number;
  bounceRate: number;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  bannedUntil?: string;
  banReason?: string;
  createdAt: string;
  videoCount: number;
  totalViews: number;
}

interface AdminVideo {
  id: string;
  title: string;
  userId: string;
  user: {
    username: string;
  };
  viewCount: number;
  isPublic: boolean;
  createdAt: string;
  reportCount: number;
}

interface AdminReport {
  id: string;
  type: 'video' | 'user' | 'comment';
  targetId: string;
  reporterId: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
  reporter: {
    username: string;
  };
  target?: {
    title?: string;
    username?: string;
    content?: string;
  };
}

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [userFilter, setUserFilter] = useState("all");
  const [contentFilter, setContentFilter] = useState("all");
  const [reportFilter, setReportFilter] = useState("pending");

  // 관리자 권한 체크
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = "/auth";
      return;
    }
    
    if (user?.role !== 'admin') {
      toast({
        title: "접근 거부",
        description: "관리자 권한이 필요합니다.",
        variant: "destructive",
      });
      window.location.href = "/";
      return;
    }
  }, [user, isAuthenticated, toast]);

  // 통계 데이터 조회
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: !!user && user.role === 'admin',
    refetchInterval: 30000, // 30초마다 업데이트
  });

  // 사용자 목록 조회
  const { data: users = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users", userFilter],
    enabled: !!user && user.role === 'admin' && selectedTab === 'users',
  });

  // 콘텐츠 목록 조회
  const { data: videos = [], isLoading: videosLoading } = useQuery<AdminVideo[]>({
    queryKey: ["/api/admin/videos", contentFilter],
    enabled: !!user && user.role === 'admin' && selectedTab === 'content',
  });

  // 신고 목록 조회
  const { data: reports = [], isLoading: reportsLoading } = useQuery<AdminReport[]>({
    queryKey: ["/api/admin/reports", reportFilter],
    enabled: !!user && user.role === 'admin' && selectedTab === 'reports',
  });

  // 사용자 상태 변경 뮤테이션
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, action, reason }: { userId: string; action: 'ban' | 'unban' | 'activate' | 'deactivate'; reason?: string }) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}/status`, { action, reason });
    },
    onSuccess: () => {
      toast({
        title: "사용자 상태 변경 완료",
        description: "사용자 상태가 성공적으로 변경되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "상태 변경 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 콘텐츠 상태 변경 뮤테이션
  const updateContentStatusMutation = useMutation({
    mutationFn: async ({ videoId, action }: { videoId: string; action: 'hide' | 'show' | 'delete' }) => {
      return await apiRequest("PATCH", `/api/admin/videos/${videoId}/status`, { action });
    },
    onSuccess: () => {
      toast({
        title: "콘텐츠 상태 변경 완료",
        description: "콘텐츠 상태가 성공적으로 변경되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/videos"] });
    },
    onError: (error: Error) => {
      toast({
        title: "상태 변경 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 신고 처리 뮤테이션
  const updateReportStatusMutation = useMutation({
    mutationFn: async ({ reportId, status, note }: { reportId: string; status: string; note?: string }) => {
      return await apiRequest("PATCH", `/api/admin/reports/${reportId}/status`, { status, note });
    },
    onSuccess: () => {
      toast({
        title: "신고 처리 완료",
        description: "신고가 성공적으로 처리되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
    },
    onError: (error: Error) => {
      toast({
        title: "처리 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 bg-red-950/50 border-red-700">
          <CardHeader className="text-center">
            <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <CardTitle className="text-red-300">접근 거부</CardTitle>
            <CardDescription className="text-red-400">
              관리자 권한이 필요합니다
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 관리자 헤더 */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Crown className="h-8 w-8 text-yellow-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">PIYAKast Admin</h1>
                  <p className="text-purple-300 text-sm">시스템 관리 대시보드</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="border-yellow-400 text-yellow-400">
                <Crown className="h-3 w-3 mr-1" />
                관리자
              </Badge>
              <div className="text-right">
                <p className="text-white font-medium">{user?.username}</p>
                <p className="text-purple-300 text-xs">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          {/* 탭 네비게이션 */}
          <TabsList className="grid w-full grid-cols-6 bg-black/30 border border-purple-500/20">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-600">
              <BarChart3 className="h-4 w-4 mr-2" />
              대시보드
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-purple-600">
              <Users className="h-4 w-4 mr-2" />
              사용자 관리
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-purple-600">
              <Video className="h-4 w-4 mr-2" />
              콘텐츠 관리
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-purple-600">
              <Flag className="h-4 w-4 mr-2" />
              신고 관리
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600">
              <TrendingUp className="h-4 w-4 mr-2" />
              데이터 분석
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600">
              <Settings className="h-4 w-4 mr-2" />
              플랫폼 설정
            </TabsTrigger>
          </TabsList>

          {/* 대시보드 탭 */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* 주요 통계 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-blue-500 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">총 사용자</p>
                      <p className="text-3xl font-bold">{formatNumber(stats?.totalUsers || 0)}</p>
                      <p className="text-blue-200 text-xs">오늘 +{stats?.newUsersToday || 0}</p>
                    </div>
                    <Users className="h-12 w-12 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-600 to-green-800 border-green-500 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">총 콘텐츠</p>
                      <p className="text-3xl font-bold">{formatNumber(stats?.totalVideos || 0)}</p>
                      <p className="text-green-200 text-xs">오늘 +{stats?.newVideosToday || 0}</p>
                    </div>
                    <Video className="h-12 w-12 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-600 to-purple-800 border-purple-500 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">총 조회수</p>
                      <p className="text-3xl font-bold">{formatNumber(stats?.totalViews || 0)}</p>
                      <p className="text-purple-200 text-xs">전체 플랫폼</p>
                    </div>
                    <TrendingUp className="h-12 w-12 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-600 to-red-600 border-orange-500 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">대기 중 신고</p>
                      <p className="text-3xl font-bold">{stats?.pendingReports || 0}</p>
                      <p className="text-orange-200 text-xs">처리 필요</p>
                    </div>
                    <AlertTriangle className="h-12 w-12 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 활동 현황 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-black/30 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white">사용자 현황</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">활성 사용자</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-400">{formatNumber(stats?.activeUsers || 0)}</span>
                        <UserCheck className="h-4 w-4 text-green-400" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">정지된 사용자</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-red-400">{formatNumber(stats?.bannedUsers || 0)}</span>
                        <UserX className="h-4 w-4 text-red-400" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">라이브 스트림</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-purple-400">{formatNumber(stats?.totalStreams || 0)}</span>
                        <Play className="h-4 w-4 text-purple-400" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/30 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white">수익 현황</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">총 플랫폼 수익</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-400 text-lg font-bold">
                          {formatCurrency(stats?.totalRevenue || 0)}
                        </span>
                        <DollarSign className="h-4 w-4 text-green-400" />
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      SuperChat, 멤버십, 플랫폼 수수료 포함
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 사용자 관리 탭 */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-black/30 border-purple-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">사용자 관리</CardTitle>
                  <div className="flex items-center space-x-4">
                    <Select value={userFilter} onValueChange={setUserFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="필터 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체 사용자</SelectItem>
                        <SelectItem value="active">활성 사용자</SelectItem>
                        <SelectItem value="banned">정지된 사용자</SelectItem>
                        <SelectItem value="creators">크리에이터</SelectItem>
                        <SelectItem value="admins">관리자</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="사용자 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-300">사용자</TableHead>
                      <TableHead className="text-gray-300">이메일</TableHead>
                      <TableHead className="text-gray-300">역할</TableHead>
                      <TableHead className="text-gray-300">상태</TableHead>
                      <TableHead className="text-gray-300">콘텐츠</TableHead>
                      <TableHead className="text-gray-300">가입일</TableHead>
                      <TableHead className="text-gray-300">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users
                      .filter(user => 
                        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-white font-medium">{user.username}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? '관리자' : user.role === 'creator' ? '크리에이터' : '일반 사용자'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.bannedUntil ? (
                            <Badge variant="destructive">
                              <Ban className="h-3 w-3 mr-1" />
                              정지됨
                            </Badge>
                          ) : user.isActive ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              활성
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              비활성
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {user.videoCount}개 / {formatNumber(user.totalViews)} 조회
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Settings className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>사용자 관리: {user.username}</DialogTitle>
                                  <DialogDescription>
                                    사용자 상태를 변경하거나 조치를 취할 수 있습니다.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  {user.bannedUntil ? (
                                    <Button
                                      onClick={() => updateUserStatusMutation.mutate({
                                        userId: user.id,
                                        action: 'unban'
                                      })}
                                      className="w-full"
                                      variant="default"
                                    >
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      정지 해제
                                    </Button>
                                  ) : (
                                    <Button
                                      onClick={() => {
                                        const reason = prompt("정지 사유를 입력하세요:");
                                        if (reason) {
                                          updateUserStatusMutation.mutate({
                                            userId: user.id,
                                            action: 'ban',
                                            reason
                                          });
                                        }
                                      }}
                                      className="w-full"
                                      variant="destructive"
                                    >
                                      <Ban className="h-4 w-4 mr-2" />
                                      사용자 정지
                                    </Button>
                                  )}
                                  {user.bannedUntil && (
                                    <div className="p-3 bg-red-950/50 border border-red-800 rounded">
                                      <p className="text-red-300 text-sm">
                                        <strong>정지 사유:</strong> {user.banReason || "사유 없음"}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 콘텐츠 관리 탭 */}
          <TabsContent value="content" className="space-y-6">
            <Card className="bg-black/30 border-purple-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">콘텐츠 관리</CardTitle>
                  <div className="flex items-center space-x-4">
                    <Select value={contentFilter} onValueChange={setContentFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="필터 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체 콘텐츠</SelectItem>
                        <SelectItem value="public">공개 영상</SelectItem>
                        <SelectItem value="private">비공개 영상</SelectItem>
                        <SelectItem value="reported">신고된 콘텐츠</SelectItem>
                        <SelectItem value="popular">인기 콘텐츠</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="콘텐츠 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-300">제목</TableHead>
                      <TableHead className="text-gray-300">크리에이터</TableHead>
                      <TableHead className="text-gray-300">조회수</TableHead>
                      <TableHead className="text-gray-300">상태</TableHead>
                      <TableHead className="text-gray-300">신고</TableHead>
                      <TableHead className="text-gray-300">업로드일</TableHead>
                      <TableHead className="text-gray-300">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {videos
                      .filter(video => 
                        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        video.user.username.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((video) => (
                      <TableRow key={video.id}>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-white font-medium truncate">{video.title}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">{video.user.username}</TableCell>
                        <TableCell className="text-gray-300">{formatNumber(video.viewCount)}</TableCell>
                        <TableCell>
                          <Badge variant={video.isPublic ? 'default' : 'secondary'}>
                            {video.isPublic ? (
                              <>
                                <Globe className="h-3 w-3 mr-1" />
                                공개
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3 mr-1" />
                                비공개
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {video.reportCount > 0 && (
                            <Badge variant="destructive">
                              <Flag className="h-3 w-3 mr-1" />
                              {video.reportCount}건
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateContentStatusMutation.mutate({
                                videoId: video.id,
                                action: video.isPublic ? 'hide' : 'show'
                              })}
                            >
                              {video.isPublic ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm("정말로 이 콘텐츠를 삭제하시겠습니까?")) {
                                  updateContentStatusMutation.mutate({
                                    videoId: video.id,
                                    action: 'delete'
                                  });
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 신고 관리 탭 */}
          <TabsContent value="reports" className="space-y-6">
            <Card className="bg-black/30 border-purple-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">신고 관리</CardTitle>
                  <div className="flex items-center space-x-4">
                    <Select value={reportFilter} onValueChange={setReportFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="필터 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">대기 중</SelectItem>
                        <SelectItem value="reviewed">검토 완료</SelectItem>
                        <SelectItem value="resolved">해결됨</SelectItem>
                        <SelectItem value="dismissed">기각됨</SelectItem>
                        <SelectItem value="all">전체</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-300">유형</TableHead>
                      <TableHead className="text-gray-300">신고자</TableHead>
                      <TableHead className="text-gray-300">대상</TableHead>
                      <TableHead className="text-gray-300">사유</TableHead>
                      <TableHead className="text-gray-300">상태</TableHead>
                      <TableHead className="text-gray-300">신고일</TableHead>
                      <TableHead className="text-gray-300">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {report.type === 'video' ? '영상' : report.type === 'user' ? '사용자' : '댓글'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">{report.reporter.username}</TableCell>
                        <TableCell className="text-gray-300">
                          {report.target?.title || report.target?.username || report.target?.content?.substring(0, 30) + '...'}
                        </TableCell>
                        <TableCell className="text-gray-300">{report.reason}</TableCell>
                        <TableCell>
                          <Badge variant={
                            report.status === 'pending' ? 'destructive' :
                            report.status === 'resolved' ? 'default' :
                            report.status === 'dismissed' ? 'secondary' : 'outline'
                          }>
                            {report.status === 'pending' ? '대기 중' :
                             report.status === 'reviewed' ? '검토됨' :
                             report.status === 'resolved' ? '해결됨' : '기각됨'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          {report.status === 'pending' && (
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => updateReportStatusMutation.mutate({
                                  reportId: report.id,
                                  status: 'resolved'
                                })}
                              >
                                승인
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateReportStatusMutation.mutate({
                                  reportId: report.id,
                                  status: 'dismissed'
                                })}
                              >
                                기각
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 플랫폼 설정 탭 */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-black/30 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white">플랫폼 설정</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    커뮤니티 가이드라인 관리
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <DollarSign className="h-4 w-4 mr-2" />
                    수익 분배 설정
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Globe className="h-4 w-4 mr-2" />
                    플랫폼 공지사항 관리
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    시스템 설정
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-black/30 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white">데이터 분석</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    사용자 활동 보고서
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    콘텐츠 트렌드 분석
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <DollarSign className="h-4 w-4 mr-2" />
                    수익 상세 보고서
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    월간 운영 보고서
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 데이터 분석 탭 */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-black/30 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  데이터 분석 대시보드
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="user-analytics" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="user-analytics">사용자 분석</TabsTrigger>
                    <TabsTrigger value="content-analytics">콘텐츠 분석</TabsTrigger>
                    <TabsTrigger value="revenue-analytics">수익 분석</TabsTrigger>
                    <TabsTrigger value="traffic-analytics">트래픽 분석</TabsTrigger>
                    <TabsTrigger value="realtime-monitoring">실시간 모니터링</TabsTrigger>
                  </TabsList>

                  {/* 사용자 분석 */}
                  <TabsContent value="user-analytics" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-gradient-to-br from-blue-600 to-blue-800">
                        <CardContent className="p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-100 text-sm">신규 가입자 (7일)</p>
                              <p className="text-2xl font-bold">{formatNumber(stats?.newUsersLastWeek || 0)}</p>
                              <p className="text-blue-200 text-xs">
                                {stats?.newUsersGrowthRate && stats.newUsersGrowthRate > 0 ? '+' : ''}
                                {stats?.newUsersGrowthRate || 0}% 
                                {stats?.newUsersGrowthRate && stats.newUsersGrowthRate > 0 ? '증가' : stats?.newUsersGrowthRate === 0 ? '변화없음' : '감소'}
                              </p>
                            </div>
                            <Users className="h-8 w-8 text-blue-200" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-green-600 to-green-800">
                        <CardContent className="p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-100 text-sm">활성 사용자 (DAU)</p>
                              <p className="text-2xl font-bold">{formatNumber(stats?.dailyActiveUsers || 0)}</p>
                              <p className="text-green-200 text-xs">
                                {stats?.activeUsersGrowthRate && stats.activeUsersGrowthRate > 0 ? '+' : ''}
                                {stats?.activeUsersGrowthRate || 0}% 
                                {stats?.activeUsersGrowthRate && stats.activeUsersGrowthRate > 0 ? '증가' : stats?.activeUsersGrowthRate === 0 ? '변화없음' : '감소'}
                              </p>
                            </div>
                            <UserCheck className="h-8 w-8 text-green-200" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-purple-600 to-purple-800">
                        <CardContent className="p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-purple-100 text-sm">사용자 유지율</p>
                              <p className="text-2xl font-bold">{stats?.userRetentionRate || 0}%</p>
                              <p className="text-purple-200 text-xs">활성 사용자 비율</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-200" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-black/30 border-purple-500/20">
                        <CardHeader>
                          <CardTitle className="text-white">가입자 증가 추이</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                              <p>가입자 증가 차트</p>
                              <p className="text-xs">지난 30일간 데이터</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-black/30 border-purple-500/20">
                        <CardHeader>
                          <CardTitle className="text-white">사용자 활동 패턴</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">피크 시간대</span>
                              <span className="text-purple-400 font-semibold">20:00 - 22:00</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">평균 세션 시간</span>
                              <span className="text-purple-400 font-semibold">24분 32초</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">월평균 방문횟수</span>
                              <span className="text-purple-400 font-semibold">8.7회</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">모바일 사용률</span>
                              <span className="text-purple-400 font-semibold">67.2%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* 콘텐츠 분석 */}
                  <TabsContent value="content-analytics" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="bg-gradient-to-br from-orange-600 to-orange-800">
                        <CardContent className="p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-orange-100 text-sm">일간 업로드</p>
                              <p className="text-2xl font-bold">{formatNumber(stats?.dailyUploads || 0)}</p>
                              <p className="text-orange-200 text-xs">오늘 업로드된 영상</p>
                            </div>
                            <Video className="h-8 w-8 text-orange-200" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-red-600 to-red-800">
                        <CardContent className="p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-red-100 text-sm">총 조회수</p>
                              <p className="text-2xl font-bold">{formatNumber(stats?.totalViews || 0)}</p>
                              <p className="text-red-200 text-xs">전체 플랫폼 조회수</p>
                            </div>
                            <Eye className="h-8 w-8 text-red-200" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-yellow-600 to-yellow-800">
                        <CardContent className="p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-yellow-100 text-sm">평균 시청시간</p>
                              <p className="text-2xl font-bold">{stats?.averageWatchTime || 0}분</p>
                              <p className="text-yellow-200 text-xs">평균 영상 시청 시간</p>
                            </div>
                            <Clock className="h-8 w-8 text-yellow-200" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-pink-600 to-pink-800">
                        <CardContent className="p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-pink-100 text-sm">좋아요 비율</p>
                              <p className="text-2xl font-bold">{stats?.likeRatio || 0}%</p>
                              <p className="text-pink-200 text-xs">전체 반응 중 좋아요</p>
                            </div>
                            <Heart className="h-8 w-8 text-pink-200" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-black/30 border-purple-500/20">
                        <CardHeader>
                          <CardTitle className="text-white">인기 카테고리</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">K-Pop</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-gray-700 rounded-full h-2">
                                  <div className="bg-purple-500 h-2 rounded-full" style={{width: '85%'}}></div>
                                </div>
                                <span className="text-purple-400 text-sm">85%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">K-Beauty</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-gray-700 rounded-full h-2">
                                  <div className="bg-purple-500 h-2 rounded-full" style={{width: '72%'}}></div>
                                </div>
                                <span className="text-purple-400 text-sm">72%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">게임</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-gray-700 rounded-full h-2">
                                  <div className="bg-purple-500 h-2 rounded-full" style={{width: '68%'}}></div>
                                </div>
                                <span className="text-purple-400 text-sm">68%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">라이프스타일</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-gray-700 rounded-full h-2">
                                  <div className="bg-purple-500 h-2 rounded-full" style={{width: '45%'}}></div>
                                </div>
                                <span className="text-purple-400 text-sm">45%</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-black/30 border-purple-500/20">
                        <CardHeader>
                          <CardTitle className="text-white">업로드 시간대 분석</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                              <p>시간대별 업로드 현황</p>
                              <p className="text-xs">24시간 기준</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* 수익 분석 */}
                  <TabsContent value="revenue-analytics" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-gradient-to-br from-green-600 to-green-800">
                        <CardContent className="p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-100 text-sm">월간 총 수익</p>
                              <p className="text-2xl font-bold">₩18.5M</p>
                              <p className="text-green-200 text-xs">+24% 증가</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-green-200" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-blue-600 to-blue-800">
                        <CardContent className="p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-100 text-sm">슈퍼챗 수익</p>
                              <p className="text-2xl font-bold">₩8.2M</p>
                              <p className="text-blue-200 text-xs">+42% 증가</p>
                            </div>
                            <MessageSquare className="h-8 w-8 text-blue-200" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-purple-600 to-purple-800">
                        <CardContent className="p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-purple-100 text-sm">플랫폼 수수료</p>
                              <p className="text-2xl font-bold">₩2.1M</p>
                              <p className="text-purple-200 text-xs">+18% 증가</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-200" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-black/30 border-purple-500/20">
                        <CardHeader>
                          <CardTitle className="text-white">수익 구성 비율</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">슈퍼챗</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-32 bg-gray-700 rounded-full h-3">
                                  <div className="bg-blue-500 h-3 rounded-full" style={{width: '44%'}}></div>
                                </div>
                                <span className="text-blue-400 font-semibold">44%</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">멤버십</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-32 bg-gray-700 rounded-full h-3">
                                  <div className="bg-green-500 h-3 rounded-full" style={{width: '28%'}}></div>
                                </div>
                                <span className="text-green-400 font-semibold">28%</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">광고 수익</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-32 bg-gray-700 rounded-full h-3">
                                  <div className="bg-yellow-500 h-3 rounded-full" style={{width: '17%'}}></div>
                                </div>
                                <span className="text-yellow-400 font-semibold">17%</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">기타</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-32 bg-gray-700 rounded-full h-3">
                                  <div className="bg-purple-500 h-3 rounded-full" style={{width: '11%'}}></div>
                                </div>
                                <span className="text-purple-400 font-semibold">11%</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-black/30 border-purple-500/20">
                        <CardHeader>
                          <CardTitle className="text-white">TOP 크리에이터 수익</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-bold">1</span>
                                </div>
                                <span className="text-white font-medium">크리에이터A</span>
                              </div>
                              <span className="text-green-400 font-semibold">₩2.4M</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-bold">2</span>
                                </div>
                                <span className="text-white font-medium">크리에이터B</span>
                              </div>
                              <span className="text-green-400 font-semibold">₩1.8M</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-bold">3</span>
                                </div>
                                <span className="text-white font-medium">크리에이터C</span>
                              </div>
                              <span className="text-green-400 font-semibold">₩1.2M</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* 트래픽 분석 */}
                  <TabsContent value="traffic-analytics" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="bg-gradient-to-br from-indigo-600 to-indigo-800">
                        <CardContent className="p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-indigo-100 text-sm">일간 페이지뷰</p>
                              <p className="text-2xl font-bold">{formatNumber(stats?.dailyPageViews || 0)}</p>
                              <p className="text-indigo-200 text-xs">오늘 페이지 방문 수</p>
                            </div>
                            <Eye className="h-8 w-8 text-indigo-200" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-cyan-600 to-cyan-800">
                        <CardContent className="p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-cyan-100 text-sm">평균 체류시간</p>
                              <p className="text-2xl font-bold">{stats?.averageSessionTime || 0}분</p>
                              <p className="text-cyan-200 text-xs">세션당 평균 시간</p>
                            </div>
                            <Clock className="h-8 w-8 text-cyan-200" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-teal-600 to-teal-800">
                        <CardContent className="p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-teal-100 text-sm">이탈률</p>
                              <p className="text-2xl font-bold">{stats?.bounceRate || 0}%</p>
                              <p className="text-teal-200 text-xs">단일 페이지 방문 비율</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-teal-200" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-emerald-600 to-emerald-800">
                        <CardContent className="p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-emerald-100 text-sm">신규 방문자</p>
                              <p className="text-2xl font-bold">67.8%</p>
                              <p className="text-emerald-200 text-xs">+12% 증가</p>
                            </div>
                            <Users className="h-8 w-8 text-emerald-200" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-black/30 border-purple-500/20">
                        <CardHeader>
                          <CardTitle className="text-white">접속 디바이스 분석</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">모바일</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-24 bg-gray-700 rounded-full h-3">
                                  <div className="bg-blue-500 h-3 rounded-full" style={{width: '67%'}}></div>
                                </div>
                                <span className="text-blue-400 font-semibold">67.2%</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">데스크톱</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-24 bg-gray-700 rounded-full h-3">
                                  <div className="bg-green-500 h-3 rounded-full" style={{width: '28%'}}></div>
                                </div>
                                <span className="text-green-400 font-semibold">28.4%</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">태블릿</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-24 bg-gray-700 rounded-full h-3">
                                  <div className="bg-purple-500 h-3 rounded-full" style={{width: '4%'}}></div>
                                </div>
                                <span className="text-purple-400 font-semibold">4.4%</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-black/30 border-purple-500/20">
                        <CardHeader>
                          <CardTitle className="text-white">지역별 접속 현황</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">대한민국</span>
                              <span className="text-purple-400 font-semibold">78.4%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">일본</span>
                              <span className="text-purple-400 font-semibold">8.7%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">미국</span>
                              <span className="text-purple-400 font-semibold">4.2%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">중국</span>
                              <span className="text-purple-400 font-semibold">3.1%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">기타</span>
                              <span className="text-purple-400 font-semibold">5.6%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* 실시간 모니터링 */}
                  <TabsContent value="realtime-monitoring" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="bg-gradient-to-br from-red-600 to-red-800">
                        <CardContent className="p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-red-100 text-sm">현재 접속자</p>
                              <p className="text-2xl font-bold">1,247</p>
                              <p className="text-red-200 text-xs">실시간</p>
                            </div>
                            <Users className="h-8 w-8 text-red-200" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-orange-600 to-orange-800">
                        <CardContent className="p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-orange-100 text-sm">진행 중 라이브</p>
                              <p className="text-2xl font-bold">23</p>
                              <p className="text-orange-200 text-xs">활성 스트림</p>
                            </div>
                            <Play className="h-8 w-8 text-orange-200" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-yellow-600 to-yellow-800">
                        <CardContent className="p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-yellow-100 text-sm">시청 중 사용자</p>
                              <p className="text-2xl font-bold">856</p>
                              <p className="text-yellow-200 text-xs">라이브 시청자</p>
                            </div>
                            <Eye className="h-8 w-8 text-yellow-200" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-pink-600 to-pink-800">
                        <CardContent className="p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-pink-100 text-sm">서버 상태</p>
                              <p className="text-2xl font-bold">99.8%</p>
                              <p className="text-pink-200 text-xs">가동률</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-pink-200" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-black/30 border-purple-500/20">
                        <CardHeader>
                          <CardTitle className="text-white">실시간 라이브 스트림</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-white font-medium">K-Pop 댄스 커버</span>
                              </div>
                              <span className="text-red-400 font-semibold">234명 시청</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-white font-medium">게임 스트리밍</span>
                              </div>
                              <span className="text-red-400 font-semibold">187명 시청</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-white font-medium">메이크업 튜토리얼</span>
                              </div>
                              <span className="text-red-400 font-semibold">156명 시청</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-white font-medium">요리 방송</span>
                              </div>
                              <span className="text-red-400 font-semibold">98명 시청</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-black/30 border-purple-500/20">
                        <CardHeader>
                          <CardTitle className="text-white">시스템 리소스</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-300">CPU 사용률</span>
                                <span className="text-purple-400 font-semibold">68%</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div className="bg-purple-500 h-2 rounded-full" style={{width: '68%'}}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-300">메모리 사용률</span>
                                <span className="text-blue-400 font-semibold">45%</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{width: '45%'}}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-300">디스크 사용률</span>
                                <span className="text-green-400 font-semibold">32%</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{width: '32%'}}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-300">네트워크 대역폭</span>
                                <span className="text-yellow-400 font-semibold">78%</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div className="bg-yellow-500 h-2 rounded-full" style={{width: '78%'}}></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 플랫폼 설정 탭 */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-black/30 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  플랫폼 설정 관리
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="system-settings" className="w-full">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="system-settings">시스템 설정</TabsTrigger>
                    <TabsTrigger value="content-policy">콘텐츠 정책</TabsTrigger>
                    <TabsTrigger value="monetization">수익화 설정</TabsTrigger>
                    <TabsTrigger value="security">보안 설정</TabsTrigger>
                    <TabsTrigger value="notifications">알림 설정</TabsTrigger>
                    <TabsTrigger value="categories">카테고리 관리</TabsTrigger>
                  </TabsList>

                  {/* 시스템 설정 */}
                  <TabsContent value="system-settings" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-gray-800/50">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">기본 플랫폼 설정</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-gray-300">플랫폼 이름</Label>
                            <Input defaultValue="PIYAKast" className="bg-gray-700 border-gray-600" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">플랫폼 설명</Label>
                            <Textarea 
                              defaultValue="K-Culture 중심의 라이브 스트리밍 및 동영상 플랫폼" 
                              className="bg-gray-700 border-gray-600" 
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">기본 언어</Label>
                            <Select defaultValue="ko">
                              <SelectTrigger className="bg-gray-700 border-gray-600">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ko">한국어</SelectItem>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="ja">日本語</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="maintenance" defaultChecked={false} />
                            <Label htmlFor="maintenance" className="text-gray-300">점검 모드</Label>
                          </div>
                          <Button className="w-full bg-purple-600 hover:bg-purple-700">
                            설정 저장
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-800/50">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">업로드 제한 설정</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-gray-300">최대 파일 크기 (GB)</Label>
                            <Input type="number" defaultValue="2" className="bg-gray-700 border-gray-600" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">최대 동영상 길이 (시간)</Label>
                            <Input type="number" defaultValue="4" className="bg-gray-700 border-gray-600" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">지원 파일 형식</Label>
                            <Input defaultValue="mp4, mov, avi, mkv" className="bg-gray-700 border-gray-600" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">일일 업로드 제한 (개)</Label>
                            <Input type="number" defaultValue="10" className="bg-gray-700 border-gray-600" />
                          </div>
                          <Button className="w-full bg-purple-600 hover:bg-purple-700">
                            제한 설정 저장
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* 콘텐츠 정책 */}
                  <TabsContent value="content-policy" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-gray-800/50">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">콘텐츠 검열 정책</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="auto-moderation" defaultChecked={true} />
                            <Label htmlFor="auto-moderation" className="text-gray-300">자동 검열 활성화</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="explicit-content" defaultChecked={false} />
                            <Label htmlFor="explicit-content" className="text-gray-300">성인 콘텐츠 허용</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="violence-content" defaultChecked={false} />
                            <Label htmlFor="violence-content" className="text-gray-300">폭력 콘텐츠 허용</Label>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">금지 키워드</Label>
                            <Textarea 
                              placeholder="금지할 키워드를 줄바꿈으로 구분해서 입력" 
                              className="bg-gray-700 border-gray-600" 
                              rows={4}
                            />
                          </div>
                          <Button className="w-full bg-purple-600 hover:bg-purple-700">
                            정책 저장
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-800/50">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">저작권 보호 설정</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="copyright-detection" defaultChecked={true} />
                            <Label htmlFor="copyright-detection" className="text-gray-300">저작권 자동 감지</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="dmca-protection" defaultChecked={true} />
                            <Label htmlFor="dmca-protection" className="text-gray-300">DMCA 보호 활성화</Label>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">저작권 신고 처리 시간 (시간)</Label>
                            <Input type="number" defaultValue="24" className="bg-gray-700 border-gray-600" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">반복 위반 제재</Label>
                            <Select defaultValue="warn">
                              <SelectTrigger className="bg-gray-700 border-gray-600">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="warn">경고</SelectItem>
                                <SelectItem value="suspend">일시 정지</SelectItem>
                                <SelectItem value="ban">영구 정지</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button className="w-full bg-purple-600 hover:bg-purple-700">
                            보호 설정 저장
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* 수익화 설정 */}
                  <TabsContent value="monetization" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-gray-800/50">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">슈퍼챗 설정</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="superchat-enabled" defaultChecked={true} />
                            <Label htmlFor="superchat-enabled" className="text-gray-300">슈퍼챗 기능 활성화</Label>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">최소 금액 (원)</Label>
                            <Input type="number" defaultValue="1000" className="bg-gray-700 border-gray-600" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">최대 금액 (원)</Label>
                            <Input type="number" defaultValue="50000" className="bg-gray-700 border-gray-600" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">플랫폼 수수료 (%)</Label>
                            <Input type="number" defaultValue="30" className="bg-gray-700 border-gray-600" />
                          </div>
                          <Button className="w-full bg-purple-600 hover:bg-purple-700">
                            슈퍼챗 설정 저장
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-800/50">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">멤버십 설정</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="membership-enabled" defaultChecked={true} />
                            <Label htmlFor="membership-enabled" className="text-gray-300">멤버십 기능 활성화</Label>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">기본 멤버십 가격 (원/월)</Label>
                            <Input type="number" defaultValue="4900" className="bg-gray-700 border-gray-600" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">최대 멤버십 등급</Label>
                            <Input type="number" defaultValue="5" className="bg-gray-700 border-gray-600" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">플랫폼 수수료 (%)</Label>
                            <Input type="number" defaultValue="20" className="bg-gray-700 border-gray-600" />
                          </div>
                          <Button className="w-full bg-purple-600 hover:bg-purple-700">
                            멤버십 설정 저장
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* 보안 설정 */}
                  <TabsContent value="security" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-gray-800/50">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">인증 설정</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="two-factor" defaultChecked={false} />
                            <Label htmlFor="two-factor" className="text-gray-300">2단계 인증 필수</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="email-verification" defaultChecked={true} />
                            <Label htmlFor="email-verification" className="text-gray-300">이메일 인증 필수</Label>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">비밀번호 최소 길이</Label>
                            <Input type="number" defaultValue="8" className="bg-gray-700 border-gray-600" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">로그인 시도 제한 (회)</Label>
                            <Input type="number" defaultValue="5" className="bg-gray-700 border-gray-600" />
                          </div>
                          <Button className="w-full bg-purple-600 hover:bg-purple-700">
                            인증 설정 저장
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-800/50">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">IP 차단 관리</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-gray-300">차단할 IP 주소</Label>
                            <Input placeholder="예: 192.168.1.1" className="bg-gray-700 border-gray-600" />
                          </div>
                          <Button className="w-full mb-4 bg-red-600 hover:bg-red-700">
                            IP 주소 차단
                          </Button>
                          <div className="max-h-48 overflow-y-auto space-y-2">
                            <div className="text-sm text-gray-300 font-medium mb-2">차단된 IP 목록:</div>
                            <div className="flex justify-between items-center p-2 bg-gray-700 rounded">
                              <span className="text-gray-300">192.168.1.100</span>
                              <Button size="sm" variant="outline" className="text-red-400">
                                해제
                              </Button>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-gray-700 rounded">
                              <span className="text-gray-300">10.0.0.50</span>
                              <Button size="sm" variant="outline" className="text-red-400">
                                해제
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* 알림 설정 */}
                  <TabsContent value="notifications" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-gray-800/50">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">시스템 알림</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="system-alerts" defaultChecked={true} />
                            <Label htmlFor="system-alerts" className="text-gray-300">시스템 장애 알림</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="security-alerts" defaultChecked={true} />
                            <Label htmlFor="security-alerts" className="text-gray-300">보안 경고 알림</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="report-alerts" defaultChecked={true} />
                            <Label htmlFor="report-alerts" className="text-gray-300">신고 접수 알림</Label>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">알림 이메일</Label>
                            <Input defaultValue="admin@piyakast.kr" className="bg-gray-700 border-gray-600" />
                          </div>
                          <Button className="w-full bg-purple-600 hover:bg-purple-700">
                            알림 설정 저장
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-800/50">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">사용자 알림</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="welcome-notification" defaultChecked={true} />
                            <Label htmlFor="welcome-notification" className="text-gray-300">신규 가입 환영 알림</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="stream-notification" defaultChecked={true} />
                            <Label htmlFor="stream-notification" className="text-gray-300">라이브 스트림 시작 알림</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="comment-notification" defaultChecked={false} />
                            <Label htmlFor="comment-notification" className="text-gray-300">댓글 알림</Label>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">알림 발송 주기</Label>
                            <Select defaultValue="realtime">
                              <SelectTrigger className="bg-gray-700 border-gray-600">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="realtime">실시간</SelectItem>
                                <SelectItem value="hourly">1시간마다</SelectItem>
                                <SelectItem value="daily">하루 1회</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button className="w-full bg-purple-600 hover:bg-purple-700">
                            사용자 알림 저장
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* 카테고리 관리 */}
                  <TabsContent value="categories" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-gray-800/50">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">새 카테고리 추가</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-gray-300">카테고리 이름</Label>
                            <Input placeholder="예: K-Fashion" className="bg-gray-700 border-gray-600" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">카테고리 설명</Label>
                            <Textarea 
                              placeholder="카테고리에 대한 설명을 입력하세요" 
                              className="bg-gray-700 border-gray-600" 
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">카테고리 색상</Label>
                            <Input type="color" defaultValue="#8b5cf6" className="bg-gray-700 border-gray-600 h-10" />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="category-active" defaultChecked={true} />
                            <Label htmlFor="category-active" className="text-gray-300">활성화</Label>
                          </div>
                          <Button className="w-full bg-purple-600 hover:bg-purple-700">
                            카테고리 추가
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-800/50">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">기존 카테고리 관리</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                              <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                                <span className="text-white font-medium">K-Pop</span>
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">수정</Button>
                                <Button size="sm" variant="outline" className="text-red-400">삭제</Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                              <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 bg-pink-500 rounded"></div>
                                <span className="text-white font-medium">K-Beauty</span>
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">수정</Button>
                                <Button size="sm" variant="outline" className="text-red-400">삭제</Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                              <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                <span className="text-white font-medium">K-Drama</span>
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">수정</Button>
                                <Button size="sm" variant="outline" className="text-red-400">삭제</Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                              <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 bg-green-500 rounded"></div>
                                <span className="text-white font-medium">게임</span>
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">수정</Button>
                                <Button size="sm" variant="outline" className="text-red-400">삭제</Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                              <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                                <span className="text-white font-medium">라이프스타일</span>
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">수정</Button>
                                <Button size="sm" variant="outline" className="text-red-400">삭제</Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
