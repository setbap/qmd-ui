'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RiFolderAddLine, RiFolderLine, RiFileListLine } from '@remixicon/react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

interface CreateCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string, path: string, pattern: string) => void
  isCreating?: boolean
  isIndexing?: boolean
  indexingProgress?: {
    totalFiles: number
    processedFiles: number
    percentComplete: number
    currentFile?: string
  } | null
  error?: string | null
}

export function CreateCollectionDialog({
  open,
  onOpenChange,
  onCreate,
  isCreating = false,
  isIndexing = false,
  indexingProgress = null,
  error = null,
}: CreateCollectionDialogProps) {
  const [name, setName] = React.useState('')
  const [path, setPath] = React.useState('')
  const [pattern, setPattern] = React.useState('**/*.md')
  const [errors, setErrors] = React.useState<{ name?: string; path?: string }>(
    {},
  )

  React.useEffect(() => {
    if (open) {
      setName('')
      setPath('')
      setPattern('**/*.md')
      setErrors({})
    }
  }, [open])

  // Close dialog when indexing completes successfully
  React.useEffect(() => {
    if (
      !isIndexing &&
      !isCreating &&
      !error &&
      indexingProgress?.percentComplete === 100
    ) {
      // Delay slightly to show completion state
      const timer = setTimeout(() => {
        onOpenChange(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isIndexing, isCreating, error, indexingProgress, onOpenChange])

  const validate = (): boolean => {
    const newErrors: { name?: string; path?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Collection name is required'
    } else if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      newErrors.name =
        'Name can only contain letters, numbers, hyphens, and underscores'
    }

    if (!path.trim()) {
      newErrors.path = 'Path is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    onCreate(name.trim(), path.trim(), pattern.trim() || '**/*.md')
    // Don't close dialog - let it show progress
  }

  // Determine the current state
  const isBusy = isCreating || isIndexing
  const isDone =
    !isCreating && !isIndexing && indexingProgress?.percentComplete === 100
  const hasError = !!error

  // Get status message
  const getStatusMessage = () => {
    if (hasError) return `Error: ${error}`
    if (isCreating) return 'Creating collection...'
    if (isIndexing) {
      const { percentComplete, processedFiles, totalFiles, currentFile } =
        indexingProgress || {}
      const progressText = `${processedFiles}/${totalFiles} files`
      return currentFile
        ? `Indexing ${currentFile} (${percentComplete}%)`
        : `Indexing files... ${progressText}`
    }
    if (isDone) return 'Indexing complete!'
    return 'Add a new collection to index your documents'
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        // Prevent closing while busy
        if (isBusy && !newOpen) return
        onOpenChange(newOpen)
      }}
    >
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                isDone
                  ? 'bg-green-500/10'
                  : hasError
                    ? 'bg-red-500/10'
                    : 'bg-amber-500/10',
              )}
            >
              {isDone ? (
                <span className="text-green-500 text-lg">✓</span>
              ) : (
                <RiFolderAddLine className="h-5 w-5" />
              )}
            </div>
            <div>
              <DialogTitle className="text-lg font-medium text-amber-50">
                {isDone ? 'Collection Created' : 'Create Collection'}
              </DialogTitle>
              <DialogDescription
                className={cn('text-sm', hasError && 'text-red-400')}
              >
                {getStatusMessage()}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Show form only when not busy */}
        {!isBusy && !isDone && !hasError && (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Collection Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., my-notes"
                className={cn(
                  'h-10 rounded-lg',
                  'focus-visible:border-amber-500 focus-visible:ring-amber-500/20',
                  errors.name &&
                    'border-red-500/50 focus-visible:border-red-500',
                )}
              />
              {errors.name && (
                <p className="text-xs text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Path Input */}
            <div className="space-y-2">
              <Label htmlFor="path" className="text-sm font-medium">
                Path
              </Label>
              <div className="relative">
                <RiFolderLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="path"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="/path/to/documents"
                  className={cn(
                    'h-10 rounded-lg pl-10',
                    'focus-visible:border-amber-500 focus-visible:ring-amber-500/20',
                    errors.path &&
                      'border-red-500/50 focus-visible:border-red-500',
                  )}
                />
              </div>
              {errors.path ? (
                <p className="text-xs text-red-400">{errors.path}</p>
              ) : (
                <p className="text-xs">
                  Absolute path to the directory to index
                </p>
              )}
            </div>

            {/* Pattern Input */}
            <div className="space-y-2">
              <Label htmlFor="pattern" className="text-sm font-medium">
                File Pattern
              </Label>
              <div className="relative">
                <RiFileListLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="pattern"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="**/*.md"
                  className={cn(
                    'h-10 rounded-lg pl-10',
                    'focus-visible:border-amber-500 focus-visible:ring-amber-500/20',
                  )}
                />
              </div>
              <p className="text-xs">
                Glob pattern for matching files (default: **/*.md)
              </p>
            </div>
          </form>
        )}

        {/* Show progress when indexing */}
        {(isIndexing || isDone) && indexingProgress && (
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Progress</span>
                <span className="text-amber-400 font-medium">
                  {indexingProgress.percentComplete}%
                </span>
              </div>
              <Progress
                value={indexingProgress.percentComplete}
                className="h-2"
              />
            </div>
            <div className="text-xs text-neutral-500 space-y-1">
              <p>
                Files: {indexingProgress.processedFiles} /{' '}
                {indexingProgress.totalFiles}
              </p>
              {indexingProgress.currentFile && (
                <p className="text-amber-500 truncate">
                  {indexingProgress.currentFile}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Show error state */}
        {hasError && (
          <div className="py-4">
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 ">
          {/* Show Cancel button only when not busy, or when complete/error */}
          {(!isBusy || isDone || hasError) && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-lg bg-transparent hover:bg-amber-900/30"
            >
              {isDone ? 'Close' : 'Cancel'}
            </Button>
          )}

          <div className="grow" />
          {/* Show Create button only when not busy and not done */}
          {!isBusy && !isDone && !hasError && (
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={!name.trim() || !path.trim()}
              className="h-9 rounded-lg bg-amber-500 px-6 hover:bg-amber-600 disabled:opacity-50"
            >
              Create
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
