'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { showToast } = useUIStore();
  
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Mock login - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login
      const mockUser = {
        id: '1',
        email: formData.email,
        username: formData.email.split('@')[0],
        displayName: '테스트 사용자',
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const mockToken = 'mock-jwt-token';
      
      login(mockUser, mockToken);
      showToast('로그인되었습니다', 'success');
      router.push('/dashboard');
    } catch (error) {
      showToast('로그인에 실패했습니다', 'error');
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
            
            <h2 className="text-2xl font-bold mb-4">완벽한 색상 조합의 시작</h2>
            <p className="text-lg text-muted-foreground max-w-md">
              전 세계 크리에이터들과 함께 아름다운 색상 팔레트를 
              만들고 공유해보세요
            </p>
            
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                ['#FF6B6B', '#4ECDC4', '#45B7D1'],
                ['#F7DC6F', '#BB8FCE', '#85C1E9'],
                ['#58D68D', '#F8C471', '#EC7063'],
              ].map((colors, index) => (
                <div key={index} className="h-16 rounded-lg overflow-hidden flex">
                  {colors.map((color, colorIndex) => (
                    <div
                      key={colorIndex}
                      className="flex-1"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
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
                <h2 className="text-2xl font-bold mb-2">로그인</h2>
                <p className="text-muted-foreground">
                  계정에 로그인하여 팔레트를 관리하세요
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
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
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-input text-primary focus:ring-primary focus:ring-offset-0"
                    />
                    <span className="ml-2 text-sm text-muted-foreground">
                      로그인 상태 유지
                    </span>
                  </label>
                  
                  <Link 
                    href="/auth/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    비밀번호 찾기
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3"
                >
                  {isLoading ? '로그인 중...' : '로그인'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-muted-foreground">
                  아직 계정이 없으신가요?{' '}
                  <Link 
                    href="/auth/signup" 
                    className="text-primary hover:underline font-medium"
                  >
                    회원가입
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