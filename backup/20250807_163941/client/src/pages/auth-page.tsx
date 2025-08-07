import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Mail, Lock, User, LogIn, Check, X } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { SiKakao, SiNaver } from "react-icons/si";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, registerSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameToCheck, setUsernameToCheck] = useState<string>('');
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  // Login form
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      username: "",
    },
  });

  // Check username availability
  const { data: usernameCheck, isLoading: checkingUsername } = useQuery({
    queryKey: ['/api/check-username', usernameToCheck],
    enabled: usernameToCheck.length >= 3,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/login", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "로그인 성공",
        description: "환영합니다!",
      });
      window.location.href = "/";
    },
    onError: (error: any) => {
      setError("이메일 또는 비밀번호가 잘못되었습니다.");
      toast({
        title: "로그인 실패",
        description: error.message || "다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/register", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "회원가입 성공",
        description: "PIYAKast에 오신 것을 환영합니다!",
      });
      window.location.href = "/";
    },
    onError: (error: any) => {
      setError(error.message || "회원가입에 실패했습니다.");
      toast({
        title: "회원가입 실패",
        description: error.message || "다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (data: any) => {
    setError(null);
    loginMutation.mutate(data);
  };

  const handleRegister = (data: any) => {
    setError(null);
    registerMutation.mutate(data);
  };

  const handleSocialLogin = (provider: string) => {
    window.location.href = `/api/auth/${provider}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Authentication forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">PIYAKast</h1>
            <p className="text-gray-600 dark:text-gray-400">
              한국 엔터테인먼트를 즐기세요
            </p>
          </div>

          {error && (
            <Alert variant="destructive" data-testid="error-message">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">로그인</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">회원가입</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    로그인
                  </CardTitle>
                  <CardDescription>
                    계정으로 로그인하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">이메일</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="이메일을 입력하세요"
                          className="pl-10"
                          data-testid="input-email-login"
                          {...loginForm.register("email")}
                        />
                      </div>
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">비밀번호</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="비밀번호를 입력하세요"
                          className="pl-10 pr-10"
                          data-testid="input-password-login"
                          {...loginForm.register("password")}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 h-6 w-6 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                      data-testid="button-login-submit"
                    >
                      {loginMutation.isPending ? "로그인 중..." : "로그인"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    회원가입
                  </CardTitle>
                  <CardDescription>
                    새 계정을 만들어보세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">사용자명 *</Label>
                      <div className="relative">
                        <Input
                          id="username"
                          placeholder="사용자명을 입력하세요"
                          data-testid="input-username"
                          {...registerForm.register("username", {
                            onChange: (e) => setUsernameToCheck(e.target.value)
                          })}
                        />
                        {usernameToCheck.length >= 3 && (
                          <div className="absolute right-3 top-3">
                            {checkingUsername ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                            ) : usernameCheck?.available ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                      {usernameToCheck.length >= 3 && usernameCheck && !usernameCheck.available && (
                        <p className="text-sm text-red-600">이 사용자명은 이미 사용중입니다</p>
                      )}
                      {usernameToCheck.length >= 3 && usernameCheck?.available && (
                        <p className="text-sm text-green-600">사용 가능한 사용자명입니다</p>
                      )}
                      {registerForm.formState.errors.username && (
                        <p className="text-sm text-red-600">{registerForm.formState.errors.username.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">이름 (선택)</Label>
                        <Input
                          id="firstName"
                          placeholder="이름 (선택사항)"
                          data-testid="input-first-name"
                          {...registerForm.register("firstName")}
                        />
                        {registerForm.formState.errors.firstName && (
                          <p className="text-sm text-red-600">{registerForm.formState.errors.firstName.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">성 (선택)</Label>
                        <Input
                          id="lastName"
                          placeholder="성 (선택사항)"
                          data-testid="input-last-name"
                          {...registerForm.register("lastName")}
                        />
                        {registerForm.formState.errors.lastName && (
                          <p className="text-sm text-red-600">{registerForm.formState.errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registerEmail">이메일 *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="registerEmail"
                          type="email"
                          placeholder="이메일을 입력하세요"
                          className="pl-10"
                          data-testid="input-email-register"
                          {...registerForm.register("email")}
                        />
                      </div>
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-red-600">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registerPassword">비밀번호 *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="registerPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="6자 이상의 비밀번호"
                          className="pl-10 pr-10"
                          data-testid="input-password-register"
                          {...registerForm.register("password")}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 h-6 w-6 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-600">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                      data-testid="button-register-submit"
                    >
                      {registerMutation.isPending ? "회원가입 중..." : "회원가입"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Social Login */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-950 px-2 text-gray-500">또는</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={() => handleSocialLogin("google")}
                data-testid="button-google-login"
              >
                <FaGoogle className="w-4 h-4 text-red-500" />
                Google로 계속하기
              </Button>

              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={() => handleSocialLogin("kakao")}
                data-testid="button-kakao-login"
              >
                <SiKakao className="w-4 h-4 text-yellow-500" />
                카카오로 계속하기
              </Button>

              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={() => handleSocialLogin("naver")}
                data-testid="button-naver-login"
              >
                <SiNaver className="w-4 h-4 text-green-500" />
                네이버로 계속하기
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="flex-1 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20" />
        <div className="relative h-full flex flex-col justify-center items-center text-white p-8">
          <div className="text-center space-y-6 max-w-lg">
            <h2 className="text-4xl font-bold">
              한국 엔터테인먼트의 모든 것
            </h2>
            <p className="text-xl opacity-90">
              K-Beauty, K-Pop, K-Drama, K-Movie, K-Food까지
              라이브 스트리밍과 VOD로 즐겨보세요
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-400 rounded-full" />
                <span>실시간 라이브 채팅</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full" />
                <span>슈퍼챗 후원</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <span>HD 비디오 스트리밍</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}