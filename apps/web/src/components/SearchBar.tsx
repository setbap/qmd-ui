'use client'

import * as React from 'react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RiSearchLine, RiDatabase2Line } from '@remixicon/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type SearchMode = 'search' | 'vsearch' | 'query'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (params?: {
    query?: string
    mode?: SearchMode
    collection?: string | null
  }) => void
  mode: SearchMode
  selectedCollection: string | null
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
  selectedCollection,
  placeholder = 'Search your documents... ( Press / to focus and Enter to search )',
  disabled = false,
}: SearchBarProps) {
  const [localValue, setLocalValue] = React.useState(value)

  // Sync local value with prop value when it changes externally
  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onChange(localValue)
      onSubmit({
        query: localValue,
      })
    }
  }

  const handleSubmit = () => {
    onChange(localValue)
    onSubmit({
      query: localValue,
    })
  }

  const currentMode = searchModeOptions.find((o) => o.value === mode)

  return (
    <div
      className={cn(
        'fixed bottom-0 z-50',
        'left-1/2',
        '-translate-x-1/2',
        'min-w-4xl',
      )}
    >
      <div className="px-4 py-4">
        <InputGroup className="h-auto bg-background shadow-2xl min-h-18 rounded-xl">
          <InputGroupInput
            id="search-input"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="text-lg pb-2"
          />
          <div className="h-2" />
          <InputGroupAddon align="block-end" className="border-t pt-1.5">
            <div className="flex w-full items-center justify-between">
              {/* Left side: Mode selector + Collection */}
              <div className="flex items-center gap-3">
                {/* Mode Selector */}
                <Select
                  value={mode}
                  onValueChange={(v) => {
                    onSubmit({
                      mode: v as SearchMode,
                      collection: selectedCollection,
                      query: localValue,
                    })
                  }}
                  disabled={disabled}
                >
                  <SelectTrigger
                    className={cn('h-6 w-auto min-w-52', 'text-xs text-center')}
                  >
                    <SelectValue placeholder={currentMode?.shortLabel} />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg ">
                    {searchModeOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-xs px-2 w-52"
                      >
                        <Badge variant={'outline'} className="font-sm">
                          {option.shortLabel}
                        </Badge>
                        <span className="">{option.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Collection Indicator */}
                <InputGroupText className="text-xs text-amber-700">
                  <RiDatabase2Line className="h-3 w-3" />
                  <span className="truncate max-w-37.5">
                    {selectedCollection || 'All Collections'}
                  </span>
                </InputGroupText>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={disabled}
              variant={'default'}
            >
              <RiSearchLine className="h-4 w-4" />
            </Button>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  )
}
