'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { RiFileTextLine, RiCloseLine } from '@remixicon/react'
import { cn } from '@/lib/utils'

interface FileContentPanelProps {
  title: string
  content: string
  path?: string
  onClose: () => void
}

export function FileContentPanel({
  title,
  content,
  path,
  onClose,
}: FileContentPanelProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between h-12 border-b px-3">
        <div className="flex items-center gap-3">
          <RiFileTextLine className="h-5 w-5 text-amber-500" />
          <div>
            <h3 className="text-sm font-medium">{title}</h3>
            <div className="flex gap-2">
              {path && <p className="text-xs text-muted-foreground">{path}</p>}{' '}
              <p className="text-xs text-muted-foreground">
                ({content.length.toLocaleString()} characters)
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="h-8 w-8"
        >
          <RiCloseLine className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Content */}
      <div className="px-2 pt-2">
        <ScrollArea className="flex-1 h-[calc(100vh-9rem)]">
          <pre
            className={cn(
              'whitespace-pre-wrap wrap-break-word font-mono text-sm leading-relaxed',
            )}
          >
            {content}
            <div className="h-2"></div>
          </pre>
          <div className="h-16"></div>
        </ScrollArea>
      </div>
    </div>
  )
}
