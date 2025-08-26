'use client';

import React from 'react';
import { User, Settings, Calendar, Heart, Eye, Palette as PaletteIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColorSwatch } from '@/components/color/color-swatch';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  joinedAt: string;
  stats: {
    palettesCreated: number;
    totalLikes: number;
    totalViews: number;
    followers: number;
    following: number;
  };
  favoriteColors?: string[];
  isVerified?: boolean;
}

interface UserProfileProps {
  user: UserProfile;
  isOwnProfile?: boolean;
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
  isFollowing?: boolean;
  className?: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long'
  });
};

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export function UserProfile({
  user,
  isOwnProfile = false,
  onFollow,
  onUnfollow,
  isFollowing = false,
  className
}: UserProfileProps) {
  const handleFollowClick = () => {
    if (isFollowing) {
      onUnfollow?.(user.id);
    } else {
      onFollow?.(user.id);
    }
  };

  return (
    <div className={cn('bg-card border rounded-lg overflow-hidden', className)}>
      {/* Cover/Header */}
      <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative">
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Profile Picture */}
        <div className="absolute -bottom-12 left-6">
          <div className="w-24 h-24 bg-background border-4 border-background rounded-full flex items-center justify-center overflow-hidden">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={32} className="text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          {isOwnProfile ? (
            <Button variant="secondary" size="sm">
              <Settings size={16} />
              편집
            </Button>
          ) : (
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              onClick={handleFollowClick}
            >
              {isFollowing ? '팔로우 취소' : '팔로우'}
            </Button>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="pt-16 pb-6 px-6">
        {/* User Info */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">{user.displayName}</h1>
            {user.isVerified && (
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>
          
          <p className="text-muted-foreground text-sm mb-1">@{user.username}</p>
          
          {user.bio && (
            <p className="text-sm mb-3">{user.bio}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {user.location && (
              <div className="flex items-center gap-1">
                <span>📍</span>
                <span>{user.location}</span>
              </div>
            )}
            
            {user.website && (
              <div className="flex items-center gap-1">
                <span>🔗</span>
                <a 
                  href={user.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {user.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{formatDate(user.joinedAt)} 가입</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center p-3 bg-background rounded-lg border">
            <PaletteIcon size={20} className="mx-auto mb-1 text-blue-500" />
            <div className="text-lg font-semibold">{formatNumber(user.stats.palettesCreated)}</div>
            <div className="text-xs text-muted-foreground">팔레트</div>
          </div>
          
          <div className="text-center p-3 bg-background rounded-lg border">
            <Heart size={20} className="mx-auto mb-1 text-red-500" />
            <div className="text-lg font-semibold">{formatNumber(user.stats.totalLikes)}</div>
            <div className="text-xs text-muted-foreground">좋아요</div>
          </div>
          
          <div className="text-center p-3 bg-background rounded-lg border">
            <Eye size={20} className="mx-auto mb-1 text-green-500" />
            <div className="text-lg font-semibold">{formatNumber(user.stats.totalViews)}</div>
            <div className="text-xs text-muted-foreground">조회수</div>
          </div>
          
          <div className="text-center p-3 bg-background rounded-lg border">
            <User size={20} className="mx-auto mb-1 text-purple-500" />
            <div className="text-lg font-semibold">{formatNumber(user.stats.followers)}</div>
            <div className="text-xs text-muted-foreground">팔로워</div>
          </div>
          
          <div className="text-center p-3 bg-background rounded-lg border">
            <User size={20} className="mx-auto mb-1 text-orange-500" />
            <div className="text-lg font-semibold">{formatNumber(user.stats.following)}</div>
            <div className="text-xs text-muted-foreground">팔로잉</div>
          </div>
        </div>

        {/* Favorite Colors */}
        {user.favoriteColors && user.favoriteColors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">선호하는 색상</h3>
            <div className="flex gap-2 flex-wrap">
              {user.favoriteColors.slice(0, 8).map((color, index) => (
                <div key={index} className="text-center">
                  <ColorSwatch
                    color={color}
                    size="md"
                    className="w-8 h-8 mb-1"
                    showTooltip
                  />
                  <div className="text-xs text-muted-foreground font-mono">
                    {color.toUpperCase()}
                  </div>
                </div>
              ))}
              {user.favoriteColors.length > 8 && (
                <div className="w-8 h-8 bg-muted border rounded flex items-center justify-center text-xs text-muted-foreground">
                  +{user.favoriteColors.length - 8}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Achievement Badges */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">성과</h3>
          
          <div className="flex flex-wrap gap-2">
            {user.stats.palettesCreated >= 10 && (
              <div className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs font-medium">
                🎨 크리에이터
              </div>
            )}
            
            {user.stats.totalLikes >= 100 && (
              <div className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-xs font-medium">
                ❤️ 인기 작품
              </div>
            )}
            
            {user.stats.followers >= 50 && (
              <div className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-xs font-medium">
                👥 인플루언서
              </div>
            )}
            
            {user.stats.palettesCreated >= 50 && (
              <div className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium">
                🏆 마스터
              </div>
            )}
            
            {user.isVerified && (
              <div className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-xs font-medium">
                ✓ 인증됨
              </div>
            )}
            
            {/* Activity-based badges */}
            {new Date().getTime() - new Date(user.joinedAt).getTime() > 365 * 24 * 60 * 60 * 1000 && (
              <div className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full text-xs font-medium">
                🗓️ 베테랑
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}