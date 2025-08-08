import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Save,
  Upload,
  Home
} from "lucide-react";
import { Link } from "wouter";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [profileData, setProfileData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    bio: "",
    location: "",
    website: "",
  });
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    liveStreamNotifications: true,
    commentNotifications: true,
    followNotifications: true,
  });
  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    showOnlineStatus: true,
    allowDirectMessages: true,
    showViewHistory: false,
  });

  // 프로필 업데이트 뮤테이션
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", "/api/user/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "프로필 업데이트 완료",
        description: "프로필 정보가 성공적으로 업데이트되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "업데이트 실패",
        description: "프로필 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleProfileUpdate = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleNotificationUpdate = () => {
    toast({
      title: "알림 설정 저장",
      description: "알림 설정이 저장되었습니다.",
    });
  };

  const handlePrivacyUpdate = () => {
    toast({
      title: "개인정보 설정 저장",
      description: "개인정보 설정이 저장되었습니다.",
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
                계정 설정
              </h1>
              <Link href="/">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center space-x-2 hover:bg-primary-purple hover:text-white"
                  data-testid="button-home-settings"
                >
                  <Home className="h-4 w-4" />
                  <span>PIYAKast 홈</span>
                </Button>
              </Link>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              개인 정보, 알림, 개인정보 보호 설정을 관리하세요
            </p>
          </div>
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.profileImageUrl || ""} alt={user?.username} />
            <AvatarFallback className="text-xl">
              {user?.username?.charAt(0).toUpperCase() || <User className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* 설정 탭 */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              프로필
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              알림
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              개인정보
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              테마
            </TabsTrigger>
          </TabsList>

          {/* 프로필 설정 */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
                <CardDescription>
                  프로필에 표시될 기본 정보를 수정하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">사용자명</Label>
                    <Input
                      id="username"
                      value={profileData.username}
                      onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                      placeholder="사용자명을 입력하세요"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      placeholder="이메일을 입력하세요"
                    />
                  </div>
                  <div>
                    <Label htmlFor="firstName">이름</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      placeholder="이름을 입력하세요"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">성</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      placeholder="성을 입력하세요"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">자기소개</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    placeholder="자신을 간단히 소개해주세요"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">거주지</Label>
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                      placeholder="거주지를 입력하세요"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">웹사이트</Label>
                    <Input
                      id="website"
                      value={profileData.website}
                      onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                      placeholder="웹사이트 URL을 입력하세요"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleProfileUpdate}
                  disabled={updateProfileMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {updateProfileMutation.isPending ? "저장 중..." : "변경사항 저장"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 알림 설정 */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>알림 설정</CardTitle>
                <CardDescription>
                  받고 싶은 알림을 선택하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>이메일 알림</Label>
                    <p className="text-sm text-muted-foreground">
                      중요한 업데이트를 이메일로 받습니다
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, emailNotifications: checked})
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>푸시 알림</Label>
                    <p className="text-sm text-muted-foreground">
                      브라우저 푸시 알림을 받습니다
                    </p>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, pushNotifications: checked})
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>라이브 방송 알림</Label>
                    <p className="text-sm text-muted-foreground">
                      구독 중인 크리에이터의 라이브 방송 시작 알림
                    </p>
                  </div>
                  <Switch
                    checked={notifications.liveStreamNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, liveStreamNotifications: checked})
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>댓글 알림</Label>
                    <p className="text-sm text-muted-foreground">
                      내 영상에 새로운 댓글이 달렸을 때
                    </p>
                  </div>
                  <Switch
                    checked={notifications.commentNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, commentNotifications: checked})
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>팔로우 알림</Label>
                    <p className="text-sm text-muted-foreground">
                      새로운 팔로워가 생겼을 때
                    </p>
                  </div>
                  <Switch
                    checked={notifications.followNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, followNotifications: checked})
                    }
                  />
                </div>
                <Button 
                  onClick={handleNotificationUpdate}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  알림 설정 저장
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 개인정보 설정 */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>개인정보 보호</CardTitle>
                <CardDescription>
                  개인정보 공개 범위와 보안 설정을 관리하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>프로필 공개 설정</Label>
                  <Select
                    value={privacy.profileVisibility}
                    onValueChange={(value) => 
                      setPrivacy({...privacy, profileVisibility: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">전체 공개</SelectItem>
                      <SelectItem value="followers">팔로워에게만</SelectItem>
                      <SelectItem value="private">비공개</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>온라인 상태 표시</Label>
                    <p className="text-sm text-muted-foreground">
                      다른 사용자에게 온라인 상태를 보여줍니다
                    </p>
                  </div>
                  <Switch
                    checked={privacy.showOnlineStatus}
                    onCheckedChange={(checked) => 
                      setPrivacy({...privacy, showOnlineStatus: checked})
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>다이렉트 메시지 허용</Label>
                    <p className="text-sm text-muted-foreground">
                      다른 사용자가 개인 메시지를 보낼 수 있습니다
                    </p>
                  </div>
                  <Switch
                    checked={privacy.allowDirectMessages}
                    onCheckedChange={(checked) => 
                      setPrivacy({...privacy, allowDirectMessages: checked})
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>시청 기록 공개</Label>
                    <p className="text-sm text-muted-foreground">
                      시청한 영상 기록을 다른 사용자에게 보여줍니다
                    </p>
                  </div>
                  <Switch
                    checked={privacy.showViewHistory}
                    onCheckedChange={(checked) => 
                      setPrivacy({...privacy, showViewHistory: checked})
                    }
                  />
                </div>
                <Button 
                  onClick={handlePrivacyUpdate}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  개인정보 설정 저장
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 테마 설정 */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>화면 테마</CardTitle>
                <CardDescription>
                  PIYAKast 화면 테마를 변경하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>다크 모드</Label>
                    <p className="text-sm text-muted-foreground">
                      현재 테마: {theme === 'light' ? '라이트 모드' : '다크 모드'}
                    </p>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                  />
                </div>
                <div className="space-y-4">
                  <Label>언어 설정</Label>
                  <Select defaultValue="ko">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ko">한국어</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}