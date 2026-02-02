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
            <RiFileTextLine className="h-5 w-5 " />
            <div>
              <DialogTitle className="text-sm font-medium text-amber-50">
                {title}
              </DialogTitle>
              {path && (
                <DialogDescription className="text-xs ">
                  {path}
                </DialogDescription>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
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
                'whitespace-pre-wrap wrap-break-word font-mono text-sm leading-relaxed',
                '',
              )}
            >
              {content}
            </pre>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <span className="text-xs ">
            {content.length.toLocaleString()} characters
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 rounded-lg"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
