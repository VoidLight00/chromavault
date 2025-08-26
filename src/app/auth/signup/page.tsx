'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Palette, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { cn } from '@/lib/utils';

const passwordRequirements = [
  { id: 'length', text: '최소 8자 이상', regex: /.{8,}/ },
  { id: 'uppercase', text: '대문자 1개 이상', regex: /[A-Z]/ },
  { id: 'lowercase', text: '소문자 1개 이상', regex: /[a-z]/ },
  { id: 'number', text: '숫자 1개 이상', regex: /\d/ },
];

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { showToast } = useUIStore();
  
  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [acceptTerms, setAcceptTerms] = React.useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getPasswordStrength = (password: string) => {
    const passed = passwordRequirements.filter(req => req.regex.test(password)).length;
    return {
      score: passed,
      total: passwordRequirements.length,
      strength: passed < 2 ? 'weak' : passed < 3 ? 'medium' : passed < 4 ? 'good' : 'strong',
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      showToast('이용약관에 동의해주세요', 'error');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast('비밀번호가 일치하지 않습니다', 'error');
      return;
    }

    if (passwordStrength.score < 4) {
      showToast('비밀번호 요구사항을 모두 충족해주세요', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Mock signup - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful signup
      const mockUser = {
        id: '1',
        email: formData.email,
        username: formData.username,
        displayName: formData.username,
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const mockToken = 'mock-jwt-token';
      
      login(mockUser, mockToken);
      showToast('회원가입이 완료되었습니다!', 'success');
      router.push('/dashboard');
    } catch (error) {
      showToast('회원가입에 실패했습니다', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
      <div className="flex min-h-screen">
        {/* Left Side - Brand */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Palette className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold">ChromaVault</h1>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">크리에이터 커뮤니티에 합류하세요</h2>
            <p className="text-lg text-muted-foreground max-w-md mb-8">
              무제한 팔레트 생성, 전 세계 디자이너들과의 협업, 
              그리고 무료로 제공되는 전문 도구들을 경험해보세요
            </p>
            
            {/* Features */}
            <div className="space-y-4 text-left max-w-sm mx-auto">
              {[
                '✨ 무제한 팔레트 생성',
                '🎨 AI 기반 색상 추천',
                '🌍 글로벌 커뮤니티',
                '📱 모든 디바이스 지원',
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-lg">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold">ChromaVault</h1>
              </div>
            </div>

            <div className="bg-card rounded-lg border p-8 shadow-sm">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">회원가입</h2>
                <p className="text-muted-foreground">
                  무료로 계정을 만들고 시작해보세요
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium mb-2">
                    사용자명
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="username"
                    className="w-full px-3 py-3 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    이메일
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    className="w-full px-3 py-3 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    비밀번호
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="비밀번호를 입력하세요"
                      className="w-full px-3 py-3 pr-12 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {/* Password Requirements */}
                  {formData.password && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'h-2 flex-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden',
                        )}>
                          <div
                            className={cn(
                              'h-full transition-all duration-300',
                              passwordStrength.strength === 'weak' && 'bg-red-500 w-1/4',
                              passwordStrength.strength === 'medium' && 'bg-yellow-500 w-2/4',
                              passwordStrength.strength === 'good' && 'bg-blue-500 w-3/4',
                              passwordStrength.strength === 'strong' && 'bg-green-500 w-full',
                            )}
                          />
                        </div>
                        <span className={cn(
                          'text-xs font-medium',
                          passwordStrength.strength === 'weak' && 'text-red-500',
                          passwordStrength.strength === 'medium' && 'text-yellow-500',
                          passwordStrength.strength === 'good' && 'text-blue-500',
                          passwordStrength.strength === 'strong' && 'text-green-500',
                        )}>
                          {passwordStrength.strength === 'weak' && '약함'}
                          {passwordStrength.strength === 'medium' && '보통'}
                          {passwordStrength.strength === 'good' && '좋음'}
                          {passwordStrength.strength === 'strong' && '강함'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {passwordRequirements.map((req) => {
                          const isValid = req.regex.test(formData.password);
                          return (
                            <div
                              key={req.id}
                              className={cn(
                                'flex items-center gap-1',
                                isValid ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
                              )}
                            >
                              {isValid ? <Check size={12} /> : <X size={12} />}
                              <span>{req.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                    비밀번호 확인
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="비밀번호를 다시 입력하세요"
                      className={cn(
                        'w-full px-3 py-3 pr-12 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-colors',
                        formData.confirmPassword && formData.password !== formData.confirmPassword && 'border-red-500'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">비밀번호가 일치하지 않습니다</p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-primary focus:ring-offset-0"
                  />
                  <label htmlFor="terms" className="ml-2 text-sm text-muted-foreground">
                    <Link href="/terms" className="text-primary hover:underline">
                      이용약관
                    </Link>
                    {' 및 '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      개인정보처리방침
                    </Link>
                    에 동의합니다
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !acceptTerms || passwordStrength.score < 4}
                  className="w-full py-3"
                >
                  {isLoading ? '계정 생성 중...' : '계정 만들기'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-muted-foreground">
                  이미 계정이 있으신가요?{' '}
                  <Link 
                    href="/auth/login" 
                    className="text-primary hover:underline font-medium"
                  >
                    로그인
                  </Link>
                </p>
              </div>

              {/* Social Login */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-card px-2 text-muted-foreground">
                      또는
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full" type="button">
                    Google
                  </Button>
                  <Button variant="outline" className="w-full" type="button">
                    GitHub
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}