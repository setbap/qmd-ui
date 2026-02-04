'use client'

import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { RiFileTextLine, RiCloseLine, RiClipboardLine } from '@remixicon/react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface FileContentPanelProps {
  title: string
  content: string
  path?: string
  lineNumber?: number
  onClose: () => void
}

export function FileContentPanel({
  title,
  content,
  path,
  lineNumber,
  onClose,
}: FileContentPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const highlightedRef = useRef<HTMLDivElement>(null)

  // Split content into lines for numbered display
  const lines = content.split('\n')

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success('File content copied to clipboard')
    } catch {
      toast.error('Failed to copy file content')
    }
  }

  // Scroll to highlighted line when it changes
  useEffect(() => {
    if (lineNumber && highlightedRef.current && scrollRef.current) {
      highlightedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [lineNumber])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between h-12 border-b px-3">
        <div className="flex items-center gap-3">
          <RiFileTextLine className="h-5 w-5 text-amber-500" />
          <div>
            <h3 className="text-sm font-medium">{title}</h3>
            <div className="flex gap-2">
              {path && (
                <p className="text-xs truncate overflow-hidden text-muted-foreground">
                  {path}
                </p>
              )}{' '}
              <p className="text-xs truncate overflow-hidden text-muted-foreground">
                ({content.length.toLocaleString()} characters)
                {lineNumber && (
                  <span className="ml-2 text-amber-500">Line {lineNumber}</span>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCopyContent}
            className="h-8 w-8 shrink-0"
            title="Copy file content"
          >
            <RiClipboardLine className="h-4 w-4" />
            <span className="sr-only">Copy</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="h-8 w-8 shrink-0"
          >
            <RiCloseLine className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>

      {/* Content with line numbers */}
      <div className="px-2 pt-2 flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="font-mono text-sm">
            {lines.map((line, index) => {
              const currentLineNumber = index + 1
              const isHighlighted = lineNumber === currentLineNumber

              return (
                <div
                  key={index}
                  ref={isHighlighted ? highlightedRef : null}
                  className={cn(
                    'flex group',
                    isHighlighted && 'bg-amber-500/20',
                  )}
                >
                  {/* Line number */}
                  <span
                    className={cn(
                      'select-none group-hover:dark:bg-amber-900/20 group-hover:bg-amber-300/20 pr-4 pl-2 text-right w-12 shrink-0 text-muted-foreground',
                      isHighlighted && 'text-amber-500 font-bold',
                    )}
                  >
                    {currentLineNumber}
                  </span>
                  {/* Line content */}
                  <span className="whitespace-pre-wrap break-all group-hover:dark:bg-amber-900/20 group-hover:bg-amber-300/20 w-full">
                    {line || ' '}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="h-24"></div>
        </ScrollArea>
      </div>
    </div>
  )
}
