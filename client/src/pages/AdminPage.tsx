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
    // 디버깅: 현재 사용자 정보 출력
    console.log("🔍 AdminPage - User info:", user);
    console.log("🔍 AdminPage - isAuthenticated:", isAuthenticated);
    console.log("🔍 AdminPage - user?.role:", user?.role);
    
    if (!isAuthenticated) {
      console.log("❌ Not authenticated, redirecting to /auth");
      window.location.href = "/auth";
      return;
    }
    
    // 임시로 admin@piyakast.kr 사용자는 관리자 권한 허용
    if (user?.email === 'admin@piyakast.kr' || user?.role === 'admin') {
      console.log("✅ Admin access granted for:", user?.email || user?.role);
      return;
    }
    
    if (user?.role !== 'admin') {
      console.log("❌ Role check failed. Expected: 'admin', Got:", user?.role);
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
          <TabsList className="grid w-full grid-cols-5 bg-black/30 border border-purple-500/20">
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
        </Tabs>
      </div>
    </div>
  );
}