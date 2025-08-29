'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Palette, 
  Search, 
  User, 
  Settings, 
  Heart,
  PlusCircle,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/lib/stores/ui-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

const mainNavItems = [
  {
    label: '홈',
    href: '/',
    icon: Home,
  },
  {
    label: '탐색',
    href: '/explore',
    icon: Search,
  },
  {
    label: '팔레트 만들기',
    href: '/editor',
    icon: PlusCircle,
  },
];

const userNavItems = [
  {
    label: '내 팔레트',
    href: '/dashboard',
    icon: Palette,
  },
  {
    label: '좋아요',
    href: '/liked',
    icon: Heart,
  },
  {
    label: '프로필',
    href: '/profile',
    icon: User,
  },
  {
    label: '설정',
    href: '/settings',
    icon: Settings,
  },
];

export function Navigation() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();

  const isActive = (href: string) => {
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 h-16 backdrop-blur-md border-b-2 z-40" style={{backgroundColor: 'rgba(17, 17, 17, 0.95)', borderBottomColor: '#222'}}>
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-4 lg:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 animated-gradient rounded-lg flex items-center justify-center neon-border">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text uppercase tracking-wide">ChromaVault</span>
          </Link>

          {/* Main Navigation */}
          <div className="flex items-center gap-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Navigation */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-1">
                {userNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive(item.href)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      <Icon size={16} />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild className="text-white hover:bg-white hover:text-black uppercase tracking-wide micro-interaction">
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button variant="premium" asChild className="uppercase tracking-wide pulse-animation">
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed top-0 left-0 right-0 h-16 backdrop-blur-md border-b-2 z-40" style={{backgroundColor: 'rgba(17, 17, 17, 0.95)', borderBottomColor: '#222'}}>
        <div className="flex items-center justify-between px-4 h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-white/20 to-white/10 rounded-lg flex items-center justify-center">
              <Palette className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white uppercase tracking-wide">ChromaVault</span>
          </Link>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-16 z-30" style={{backgroundColor: '#0a0a0a'}}>
            <div className="p-4 space-y-6">
              {/* Main Navigation */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  메뉴
                </h3>
                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium transition-colors',
                        isActive(item.href)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-accent'
                      )}
                    >
                      <Icon size={20} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* User Navigation */}
              {isAuthenticated ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    내 계정
                  </h3>
                  {userNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium transition-colors',
                          isActive(item.href)
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground hover:bg-accent'
                        )}
                      >
                        <Icon size={20} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <Button className="w-full justify-start" asChild>
                    <Link 
                      href="/auth/login"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      로그인
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link 
                      href="/auth/signup"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      회원가입
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t z-40">
        <div className="flex items-center justify-around h-16 px-4">
          {mainNavItems.slice(0, 3).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-md transition-colors',
                  isActive(item.href)
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          {isAuthenticated && (
            <Link
              href="/dashboard"
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-md transition-colors',
                isActive('/dashboard')
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <User size={20} />
              <span className="text-xs font-medium">내 것</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}