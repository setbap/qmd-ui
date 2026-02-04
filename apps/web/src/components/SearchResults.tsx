'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RiFileTextLine, RiClipboardLine } from '@remixicon/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

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

type CopyFormat = 'text' | 'json' | 'csv' | 'md' | 'xml' | 'files'

interface FormatOption {
  value: CopyFormat
  label: string
}

const copyFormatOptions: FormatOption[] = [
  { value: 'text', label: 'Copy as Text' },
  { value: 'json', label: 'Copy as JSON' },
  { value: 'csv', label: 'Copy as CSV' },
  { value: 'md', label: 'Copy as Markdown' },
  { value: 'xml', label: 'Copy as XML' },
  { value: 'files', label: 'Copy as Files' },
]

function formatResultsAsText(results: SearchResult[]): string {
  return results
    .map(
      (r, i) =>
        `${i + 1}. ${r.title || r.displayPath.split('/').pop()}\n   DocID: #${r.docid}\n   Path: ${r.displayPath}\n   Score: ${(r.score * 100).toFixed(1)}%\n   Collection: ${r.collectionName}`,
    )
    .join('\n\n')
}

function formatResultsAsJson(results: SearchResult[]): string {
  return JSON.stringify(results, null, 2)
}

function formatResultsAsCsv(results: SearchResult[]): string {
  if (results.length === 0) return ''
  const headers = ['docid', 'filepath', 'title', 'score', 'collectionName']
  const rows = results.map((r) => [
    r.docid,
    r.filepath,
    r.title || '',
    r.score.toFixed(4),
    r.collectionName,
  ])
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

function formatResultsAsMarkdown(results: SearchResult[]): string {
  if (results.length === 0) return ''
  const headers = ['#', 'DocID', 'Title', 'Score', 'Path']
  const separator = ['---', '---', '---', '---', '---']
  const rows = results.map((r, i) => [
    (i + 1).toString(),
    r.docid,
    r.title || r.displayPath.split('/').pop() || '',
    `${(r.score * 100).toFixed(1)}%`,
    r.displayPath,
  ])
  return [
    headers.join(' | '),
    separator.join(' | '),
    ...rows.map((r) => r.join(' | ')),
  ].join('\n')
}

function formatResultsAsXml(results: SearchResult[]): string {
  if (results.length === 0) return '<results></results>'
  const items = results
    .map(
      (r) => `  <result>
    <docid>${r.docid}</docid>
    <filepath>${r.filepath}</filepath>
    <title>${r.title || ''}</title>
    <score>${r.score.toFixed(4)}</score>
    <collection>${r.collectionName}</collection>
  </result>`,
    )
    .join('\n')
  return `<results>\n${items}\n</results>`
}

function formatResultsAsFiles(results: SearchResult[]): string {
  return results.map((r) => r.filepath).join('\n')
}

function getFormattedContent(
  results: SearchResult[],
  format: CopyFormat,
): string {
  switch (format) {
    case 'text':
      return formatResultsAsText(results)
    case 'json':
      return formatResultsAsJson(results)
    case 'csv':
      return formatResultsAsCsv(results)
    case 'md':
      return formatResultsAsMarkdown(results)
    case 'xml':
      return formatResultsAsXml(results)
    case 'files':
      return formatResultsAsFiles(results)
    default:
      return formatResultsAsText(results)
  }
}

async function copyToClipboard(text: string, formatLabel: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`Copied as ${formatLabel}`)
  } catch {
    toast.error('Failed to copy to clipboard')
  }
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

  const handleCopy = async (format: CopyFormat) => {
    const formatted = getFormattedContent(results, format)
    const option = copyFormatOptions.find((o) => o.value === format)
    await copyToClipboard(
      formatted,
      option?.label.replace('Copy as ', '') || format,
    )
  }

  return (
    <div className={cn('flex h-full flex-col')}>
      {query && (
        <div className="flex items-center justify-between z-0 border-b h-12 px-2">
          <h2 className="text-sm font-medium ">
            Search Results
            {query && (
              <span className="ml-2 text-xs ">for &quot;{query}&quot;</span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {results.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                  >
                    <RiClipboardLine className="h-3.5 w-3.5" />
                    Copy
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-lg">
                  {copyFormatOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleCopy(option.value)}
                      className="text-xs cursor-pointer"
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <span className="text-xs ">{results.length} results</span>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 h-[calc(100vh-7rem)]">
        <div className="space-y-3 p-4">
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
        <div className="h-20"></div>
      </ScrollArea>
    </div>
  )
}
