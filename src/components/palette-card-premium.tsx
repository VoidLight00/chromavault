'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Eye, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface PaletteCardPremiumProps {
  id: string;
  name: string;
  description: string;
  colors: string[];
  likes: number;
  views: number;
  tags: string[];
  date: string;
  number?: string;
}

export function PaletteCardPremium({
  id,
  name,
  description,
  colors,
  likes,
  views,
  tags,
  date,
  number
}: PaletteCardPremiumProps) {
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyColors = () => {
    const colorString = colors.join(', ');
    navigator.clipboard.writeText(colorString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative bg-[#111] border-2 border-[#222] rounded-xl p-6 transition-all duration-300 hover:border-[#444] hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
      {number && (
        <div className="text-xs text-gray-500 uppercase tracking-[2px] mb-2">
          Palette {number}
        </div>
      )}
      
      <Link href={`/palette/${id}`}>
        {/* Color samples with gradient effect */}
        <div className="flex gap-2 mb-4 h-24 rounded-lg overflow-hidden">
          {colors.map((color, index) => (
            <div
              key={index}
              className="flex-1 relative group/color cursor-pointer transition-all duration-300 hover:flex-[1.5]"
              style={{
                background: `linear-gradient(135deg, ${color}, ${color}dd)`
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/color:opacity-100 transition-opacity">
                <span className="text-white text-xs font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                  {color}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Demo bars with animation */}
        <div className="flex gap-2 mb-4">
          {colors.slice(0, 3).map((color, index) => (
            <div key={index} className="flex-1 h-8 bg-[#0a0a0a] rounded overflow-hidden">
              <div 
                className="h-full transition-all duration-600 w-[80%] group-hover:w-full"
                style={{
                  background: `linear-gradient(135deg, ${color}, ${color}dd)`
                }}
              />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="mb-4">
          <h3 className="text-xl font-bold uppercase tracking-wide text-white mb-2 group-hover:text-gray-200 transition-colors">
            {name}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2">
            {description}
          </p>
        </div>
      </Link>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 text-xs bg-[#1a1a1a] text-gray-400 rounded border border-[#333] uppercase tracking-wide"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Actions and Stats */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button
            onClick={() => setLiked(!liked)}
            className={`flex items-center gap-1 text-sm transition-colors ${
              liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            <span className="font-semibold">{likes}</span>
          </button>
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <Eye className="w-4 h-4" />
            <span className="font-semibold">{views}</span>
          </div>
        </div>
        
        <button
          onClick={handleCopyColors}
          className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-transparent border border-[#333] rounded hover:bg-white hover:text-black transition-all duration-300 uppercase tracking-wide"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Date */}
      <div className="mt-3 text-xs text-gray-500">
        {date}
      </div>
    </div>
  );
}