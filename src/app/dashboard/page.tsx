'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Grid, List, Filter, Search, TrendingUp, Heart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/layout/search-bar';
import { PaletteCardPremium } from '@/components/palette-card-premium';
import { Palette } from '@/types';
import { cn } from '@/lib/utils';

// Premium palette data
const userPalettes = [
  {
    id: '1',
    name: 'Vaporwave Dreams',
    description: 'Retro-futuristic aesthetic with bold gradients',
    colors: ['#FF71CE', '#01CDFE', '#05FFA1', '#B967FF'],
    tags: ['vaporwave', 'retro', 'gradient'],
    likes: 234,
    views: 1567,
    date: '2025-01-26',
    number: '004',
  },
  {
    id: '2',
    name: 'Dark Terminal',
    description: 'Hacker aesthetic with matrix green accents',
    colors: ['#0FFF50', '#39FF14', '#00FF41', '#7FFF00'],
    tags: ['terminal', 'hacker', 'matrix'],
    likes: 189,
    views: 987,
    date: '2025-01-25',
    number: '005',
  },
  {
    id: '3',
    name: 'Blood Moon',
    description: 'Dark crimson palette with mysterious undertones',
    colors: ['#8B0000', '#DC143C', '#B22222', '#CD5C5C'],
    tags: ['dark', 'red', 'gothic'],
    likes: 312,
    views: 2341,
    date: '2025-01-24',
    number: '006',
  },
];

export default function DashboardPage() {
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [selectedPalettes, setSelectedPalettes] = React.useState<string[]>([]);

  const stats = {
    totalPalettes: userPalettes.length,
    totalLikes: userPalettes.reduce((sum, p) => sum + p.likesCount, 0),
    totalViews: userPalettes.reduce((sum, p) => sum + p.viewsCount, 0),
    publicPalettes: userPalettes.filter(p => p.isPublic).length,
  };

  return (
    <div className="min-h-screen premium-dark-bg">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white uppercase tracking-wide">My Palettes</h1>
              <p className="text-gray-400 mt-1">
                Manage and edit your color palette collection
              </p>
            </div>
            
            <Button className="bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-wide" asChild>
              <Link href="/editor" className="gap-2">
                <Plus size={18} />
                New Palette
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="premium-dark-card p-4 rounded-lg border premium-dark-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Grid className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalPalettes}</p>
                  <p className="text-sm text-gray-400 uppercase tracking-wide">Total</p>
                </div>
              </div>
            </div>

            <div className="premium-dark-card p-4 rounded-lg border premium-dark-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-900/20 rounded-lg">
                  <Heart className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalLikes}</p>
                  <p className="text-sm text-gray-400 uppercase tracking-wide">Likes</p>
                </div>
              </div>
            </div>

            <div className="premium-dark-card p-4 rounded-lg border premium-dark-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-900/20 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalViews}</p>
                  <p className="text-sm text-gray-400 uppercase tracking-wide">Views</p>
                </div>
              </div>
            </div>

            <div className="premium-dark-card p-4 rounded-lg border premium-dark-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-900/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.publicPalettes}</p>
                  <p className="text-sm text-gray-400 uppercase tracking-wide">Public</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <SearchBar
              placeholder="Search palettes..."
              className="flex-1 max-w-md"
            />

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex border-2 rounded-lg p-1 premium-dark-card" style="border-color: #333;">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                  )}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                  )}
                >
                  <List size={16} />
                </button>
              </div>

              <Button variant="outline" size="icon" className="text-white hover:bg-white hover:text-black" style="border-color: #333;">
                <Filter size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {userPalettes.length > 0 ? (
          <div className={cn(
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          )}>
            {userPalettes.map((palette) => (
              <PaletteCardPremium
                key={palette.id}
                {...palette}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-24 h-24 premium-dark-card border-2 rounded-full flex items-center justify-center mx-auto mb-6" style="border-color: #222;">
              <Grid className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-white uppercase tracking-wide mb-2">No Palettes Yet</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              Create your first color palette to start your collection
            </p>
            <Button className="bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-wide" asChild>
              <Link href="/editor" className="gap-2">
                <Plus size={18} />
                Create First Palette
              </Link>
            </Button>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedPalettes.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 premium-dark-card border-2 rounded-lg shadow-lg p-4 flex items-center gap-4" style="border-color: #222;">
            <span className="text-sm text-white">
              {selectedPalettes.length} selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-white hover:bg-white hover:text-black uppercase" style="border-color: #333;">
                Share
              </Button>
              <Button variant="outline" size="sm" className="text-white hover:bg-white hover:text-black uppercase" style="border-color: #333;">
                Copy
              </Button>
              <Button variant="destructive" size="sm" className="uppercase">
                Delete
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white uppercase"
              onClick={() => setSelectedPalettes([])}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}