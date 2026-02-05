'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RiChatQuoteLine } from '@remixicon/react'
import { toast } from 'sonner'
import { addCollectionContext } from '@/lib/server/qmd'

interface AddContextDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collectionName: string
}

export function AddContextDialog({
  open,
  onOpenChange,
  collectionName,
}: AddContextDialogProps) {
  const [path, setPath] = useState('')
  const [context, setContext] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!context.trim()) {
      toast.error('Context text is required')
      return
    }

    setIsSubmitting(true)
    try {
      await addCollectionContext({
        data: {
          collectionName,
          path: path.trim() || '/',
          context: context.trim(),
        },
      } as any)
      toast.success(`Context added to ${collectionName}`)
      onOpenChange(false)
      setPath('')
      setContext('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add context')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    setPath('')
    setContext('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-900/30">
              <RiChatQuoteLine className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-medium text-amber-50">
                Add Context
              </DialogTitle>
              <DialogDescription className="text-sm">
                Add context to collection: <strong>{collectionName}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Path Input */}
          <div className="space-y-2">
            <Label htmlFor="context-path" className="text-sm font-medium">
              Path (optional)
            </Label>
            <Input
              id="context-path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/ or /subfolder (defaults to entire collection)"
              className="h-10 rounded-lg"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to apply context to the entire collection, or specify
              a subfolder path like /2024 or /docs
            </p>
          </div>

          {/* Context Textarea */}
          <div className="space-y-2">
            <Label htmlFor="context-text" className="text-sm font-medium">
              Context Description
            </Label>
            <Textarea
              id="context-text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Describe what this collection or path contains..."
              rows={4}
              className="resize-none rounded-lg"
            />
            <p className="text-xs text-muted-foreground">
              This context will be included with search queries to help improve
              relevance
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="h-9 rounded-lg"
          >
            Cancel
          </Button>
          <div className="grow" />
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !context.trim()}
            className="h-9 rounded-lg"
          >
            {isSubmitting ? 'Adding...' : 'Add Context'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
