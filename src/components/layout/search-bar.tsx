'use client';

import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { cn, debounce } from '@/lib/utils';
import { useUIStore } from '@/lib/stores/ui-store';
import { usePaletteStore } from '@/lib/stores/palette-store';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  showFilter?: boolean;
  onSearch?: (query: string) => void;
}

export function SearchBar({
  placeholder = '팔레트 검색...',
  className,
  showFilter = false,
  onSearch,
}: SearchBarProps) {
  const [focused, setFocused] = React.useState(false);
  const [localQuery, setLocalQuery] = React.useState('');
  const { searchQuery, setSearchQuery } = useUIStore();
  const { setSearchFilter } = usePaletteStore();

  // Debounced search function
  const debouncedSearch = React.useMemo(
    () => debounce((query: string) => {
      setSearchQuery(query);
      setSearchFilter({ query });
      onSearch?.(query);
    }, 300),
    [setSearchQuery, setSearchFilter, onSearch]
  );

  React.useEffect(() => {
    debouncedSearch(localQuery);
  }, [localQuery, debouncedSearch]);

  const handleClear = () => {
    setLocalQuery('');
    setSearchQuery('');
    setSearchFilter({ query: '' });
    onSearch?.('');
  };

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'flex items-center gap-2 bg-background border rounded-lg px-3 py-2 transition-all',
          focused ? 'ring-2 ring-primary ring-offset-2' : '',
          'hover:border-primary/50'
        )}
      >
        <Search size={18} className="text-muted-foreground" />
        
        <input
          type="text"
          placeholder={placeholder}
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />

        {localQuery && (
          <button
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        )}

        {showFilter && <FilterButton />}
      </div>
    </div>
  );
}

function FilterButton() {
  const [open, setOpen] = React.useState(false);
  const { searchFilter, setSearchFilter } = usePaletteStore();
  const [localFilters, setLocalFilters] = React.useState({
    sortBy: searchFilter.sortBy || 'createdAt',
    sortOrder: searchFilter.sortOrder || 'desc',
    colorCount: searchFilter.colorCount || 0,
  });

  const handleApplyFilters = () => {
    setSearchFilter(localFilters);
    setOpen(false);
  };

  const handleResetFilters = () => {
    const reset = {
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
      colorCount: 0,
    };
    setLocalFilters(reset);
    setSearchFilter(reset);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Filter size={16} />
        </Button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
          <div className="bg-background border rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-semibold">
                검색 필터
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon">
                  <X size={16} />
                </Button>
              </Dialog.Close>
            </div>

            <div className="space-y-6">
              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium">정렬 기준</label>
                <select
                  value={localFilters.sortBy}
                  onChange={(e) => setLocalFilters(prev => ({ 
                    ...prev, 
                    sortBy: e.target.value as any 
                  }))}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="createdAt">생성일</option>
                  <option value="likesCount">좋아요 수</option>
                  <option value="viewsCount">조회수</option>
                  <option value="name">이름</option>
                </select>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <label className="text-sm font-medium">정렬 순서</label>
                <select
                  value={localFilters.sortOrder}
                  onChange={(e) => setLocalFilters(prev => ({ 
                    ...prev, 
                    sortOrder: e.target.value as any 
                  }))}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="desc">내림차순</option>
                  <option value="asc">오름차순</option>
                </select>
              </div>

              {/* Color Count */}
              <div className="space-y-2">
                <label className="text-sm font-medium">색상 개수</label>
                <select
                  value={localFilters.colorCount}
                  onChange={(e) => setLocalFilters(prev => ({ 
                    ...prev, 
                    colorCount: parseInt(e.target.value) 
                  }))}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value={0}>전체</option>
                  <option value={2}>2개</option>
                  <option value={3}>3개</option>
                  <option value={4}>4개</option>
                  <option value={5}>5개</option>
                  <option value={6}>6개 이상</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="flex-1"
              >
                초기화
              </Button>
              <Button
                onClick={handleApplyFilters}
                className="flex-1"
              >
                적용
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Compact search bar for mobile
export function CompactSearchBar({
  onSearch,
  className,
}: {
  onSearch?: (query: string) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline" className={cn('w-full justify-start gap-2', className)}>
          <Search size={16} />
          팔레트 검색...
        </Button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed inset-x-4 top-20 z-50">
          <div className="bg-background border rounded-lg shadow-xl">
            <div className="p-4">
              <SearchBar
                onSearch={(query) => {
                  onSearch?.(query);
                  if (query) setOpen(false);
                }}
                showFilter
                className="w-full"
              />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}