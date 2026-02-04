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
import { useSearchStore, type SearchMode } from '@/stores'
import { useSettings } from '@/hooks/useSettings'

const searchModeOptions: {
  value: SearchMode
  label: string
  shortLabel: string
}[] = [
  { value: 'search', label: 'Full-Text Search', shortLabel: 'TEXT' },
  { value: 'vsearch', label: 'Vector Search', shortLabel: 'VEC' },
  { value: 'query', label: 'Hybrid Query', shortLabel: 'HYBRID' },
]

interface SearchBarProps {
  placeholder?: string
  disabled?: boolean
}

export function SearchBar({
  placeholder = 'Search your documents... ( Press / to focus and Enter to search )',
  disabled = false,
}: SearchBarProps) {
  const { query, setQuery, mode, setMode, collection, executeSearch, results } =
    useSearchStore()
  const { settings } = useSettings()

  const [localValue, setLocalValue] = React.useState(query)

  // Sync local value with store value when it changes externally
  React.useEffect(() => {
    setLocalValue(query)
  }, [query])

  const getMinScore = (searchMode: SearchMode) => {
    return searchMode === 'vsearch'
      ? settings.minScoreVsearch
      : searchMode === 'search'
        ? settings.minScoreSearch
        : settings.minScoreQuery
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setQuery(localValue)
      executeSearch(settings.resultsPerPage, getMinScore(mode))
    }
  }

  const handleSubmit = () => {
    setQuery(localValue)
    executeSearch(settings.resultsPerPage, getMinScore(mode))
  }

  const handleModeChange = (newMode: SearchMode) => {
    setMode(newMode)
    // If there's a query, re-execute search with new mode
    if (localValue.trim()) {
      setQuery(localValue)
      executeSearch(settings.resultsPerPage, getMinScore(newMode))
    }
  }

  const currentMode = searchModeOptions.find((o) => o.value === mode)

  return (
    <div
      className={cn(
        'absolute bottom-0 z-50',
        'left-1/2',
        '-translate-x-1/2',
        'w-full',
        'max-w-3xl',
      )}
    >
      <div className="px-4 py-4">
        <InputGroup className="h-auto bg-background/30 shadow-2xl min-h-18 rounded-xl backdrop-blur-lg mix-blend-plus-darker">
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
                  onValueChange={(v) => handleModeChange(v as SearchMode)}
                  disabled={disabled}
                >
                  <SelectTrigger
                    className={cn('h-6 w-auto min-w-52', 'text-xs text-center')}
                  >
                    <SelectValue placeholder={currentMode?.shortLabel} />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
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

                <InputGroupText className="text-xs text-amber-700">
                  <RiDatabase2Line className="h-3 w-3" />
                  <span
                    className="truncate max-w-32 overflow-hidden"
                    title={collection || 'All Collections'}
                  >
                    {collection || 'All Collections'}
                  </span>
                </InputGroupText>
                {query && (
                  <>
                    <InputGroupText className="text-xs truncate text-muted-foreground border-l pl-2">
                      <span>{results.length} results</span>
                    </InputGroupText>
                    <InputGroupText className="text-xs truncate text-muted-foreground border-l pl-2">
                      <span>min score: {getMinScore(mode)}</span>
                    </InputGroupText>
                  </>
                )}
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
