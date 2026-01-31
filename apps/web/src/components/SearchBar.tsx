'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RiSearchLine, RiDatabase2Line } from '@remixicon/react'
import { cn } from '@/lib/utils'

type SearchMode = 'search' | 'vsearch' | 'query'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  mode: SearchMode
  onModeChange: (mode: SearchMode) => void
  selectedCollection: string | null
  onFocusCollection?: () => void
  placeholder?: string
  disabled?: boolean
}

const searchModeOptions: {
  value: SearchMode
  label: string
  shortLabel: string
}[] = [
  { value: 'search', label: 'Full-Text Search', shortLabel: 'TEXT' },
  { value: 'vsearch', label: 'Vector Search', shortLabel: 'VEC' },
  { value: 'query', label: 'Hybrid Query', shortLabel: 'HYBRID' },
]

export function SearchBar({
  value,
  onChange,
  onSubmit,
  mode,
  onModeChange,
  selectedCollection,
  placeholder = 'Search your documents...',
  disabled = false,
}: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSubmit()
    }
  }

  const currentMode = searchModeOptions.find((o) => o.value === mode)

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'border-t',
        'bg-[#0a0908]',
      )}
    >
      <div className="flex items-end gap-2 px-4 py-4">
        {/* Main Search Input Container */}
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'h-16 w-full rounded-xl pl-4 pr-14 text-lg',
              'text-amber-50 placeholder:text-amber-700/50',
              'focus-visible:border-amber-500 focus-visible:ring-amber-500/20',
              'disabled:opacity-50',
            )}
          />

          {/* Search Button - Icon only, inside input */}
          <Button
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
            size="icon"
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2',
              'h-10 w-10 rounded-lg bg-amber-600 text-amber-950',
              'hover:bg-amber-500',
              'disabled:opacity-30',
            )}
          >
            <RiSearchLine className="h-5 w-5" />
          </Button>

          {/* Bottom row - Mode selector & Collection inside input area */}
          <div className="absolute bottom-1 left-4 flex items-center gap-3">
            {/* Mode Selector - Compact */}
            <Select
              value={mode}
              onValueChange={(v) => onModeChange(v as SearchMode)}
              disabled={disabled}
            >
              <SelectTrigger
                className={cn(
                  'h-6 w-auto min-w-[80px] border-0 bg-transparent px-0 text-xs',
                  'text-amber-600 focus:ring-0',
                  'disabled:opacity-50 hover:text-amber-500',
                )}
              >
                <SelectValue placeholder={currentMode?.shortLabel} />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {searchModeOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-xs text-amber-200 focus:bg-amber-900/30 focus:text-amber-100"
                  >
                    <span className="font-medium">{option.shortLabel}</span>
                    <span className="ml-2 text-amber-600">{option.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Collection Indicator - Small text */}
            <div className="flex items-center gap-1 text-xs text-amber-700">
              <RiDatabase2Line className="h-3 w-3" />
              <span className="truncate max-w-[150px]">
                {selectedCollection || 'All Collections'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
