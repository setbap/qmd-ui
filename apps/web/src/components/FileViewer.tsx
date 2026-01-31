'use client'

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RiCloseLine, RiFileTextLine } from '@remixicon/react'
import { cn } from '@/lib/utils'

interface FileViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  content: string
  path?: string
}

export function FileViewer({
  open,
  onOpenChange,
  title,
  content,
  path,
}: FileViewerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[80vh] max-w-4xl rounded-xl p-0',
          '[&>button]:hidden',
        )}
      >
        {/* Custom Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <RiFileTextLine className="h-5 w-5 text-amber-400" />
            <div>
              <DialogTitle className="text-sm font-medium text-amber-50">
                {title}
              </DialogTitle>
              {path && (
                <DialogDescription className="text-xs text-amber-600">
                  {path}
                </DialogDescription>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 text-amber-600 hover:bg-amber-900/30 hover:text-amber-200"
          >
            <RiCloseLine className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-[60vh]">
          <div className="p-4">
            <pre
              className={cn(
                'whitespace-pre-wrap break-words font-mono text-sm leading-relaxed',
                'text-amber-100',
              )}
            >
              {content}
            </pre>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <span className="text-xs text-amber-600">
            {content.length.toLocaleString()} characters
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 rounded-lg bg-transparent text-amber-300 hover:bg-amber-900/30 hover:text-amber-100"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
