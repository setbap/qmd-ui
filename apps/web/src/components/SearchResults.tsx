'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RiFileTextLine } from '@remixicon/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export interface SearchResult {
  docid: string
  filepath: string
  title?: string
  displayPath: string
  score: number
  body?: string
  context?: string
  collectionName: string
}

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  isLoading?: boolean
  onSelectResult?: (result: SearchResult) => void
}

export function SearchResults({
  results,
  query,
  isLoading = false,
  onSelectResult,
}: SearchResultsProps) {
  const formatScore = (score: number): string => {
    return (score * 100).toFixed(1) + '%'
  }

  const truncateBody = (
    body: string | undefined,
    maxLength: number = 200,
  ): string => {
    if (!body) return ''
    if (body.length <= maxLength) return body
    return body.slice(0, maxLength) + '...'
  }

  return (
    <div className={cn('flex h-full flex-col')}>
      {/* Header */}

      {query && (
        <div className="flex items-center justify-between z-0 -my-1 px-2">
          <h2 className="text-sm font-medium ">
            Search Results
            {query && (
              <span className="ml-2 text-xs ">for &quot;{query}&quot;</span>
            )}
          </h2>
          <span className="text-xs ">{results.length} results</span>
        </div>
      )}

      {/* Results List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border" />
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <RiFileTextLine className="mb-2 h-8 w-8 " />
              <p className="text-sm ">
                {query
                  ? 'No results found. Try a different query.'
                  : 'Enter a search query to begin...'}
              </p>
            </div>
          ) : (
            results.map((result, index) => (
              <Card
                key={result.docid}
                tabIndex={0}
                role="button"
                onClick={() => onSelectResult?.(result)}
                className={cn(
                  'cursor-pointer',
                  'transition-colors border-transparent border hover:border-amber-800',
                  onSelectResult && 'cursor-pointer',
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/10 text-xs font-medium ">
                        {index + 1}
                      </span>
                      <CardTitle className="text-sm font-medium ">
                        {result.title || result.displayPath.split('/').pop()}
                      </CardTitle>
                    </div>
                    <span className="text-xs font-medium ">
                      {formatScore(result.score)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {/* Path and DocID */}
                  <div className="flex items-center gap-2 text-xs ">
                    <span>
                      doc id:
                      <Badge variant={'secondary'}>#{result.docid}</Badge>
                    </span>
                    <span className="truncate">{result.displayPath}</span>
                  </div>

                  {/* Context (if present) */}
                  {result.context && (
                    <div className="rounded border bg-amber-950/30 px-2 py-1.5">
                      <span className="text-xs ">Context: </span>
                      <span className="text-xs ">{result.context}</span>
                    </div>
                  )}

                  {/* Body Preview */}
                  {result.body && (
                    <p className="text-xs leading-relaxed ">
                      {truncateBody(result.body)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
