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

interface CreateCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string, path: string, pattern: string) => void
}

export function CreateCollectionDialog({
  open,
  onOpenChange,
  onCreate,
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
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <RiFolderAddLine className="h-5 w-5 " />
            </div>
            <div>
              <DialogTitle className="text-lg font-medium text-amber-50">
                Create Collection
              </DialogTitle>
              <DialogDescription className="text-sm ">
                Add a new collection to index your documents
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium ">
              Collection Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., my-notes"
              className={cn(
                'h-10 rounded-lg ',
                'focus-visible:border-amber-500 focus-visible:ring-amber-500/20',
                errors.name && 'border-red-500/50 focus-visible:border-red-500',
              )}
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Path Input */}
          <div className="space-y-2">
            <Label htmlFor="path" className="text-sm font-medium ">
              Path
            </Label>
            <div className="relative">
              <RiFolderLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 " />
              <Input
                id="path"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/path/to/documents"
                className={cn(
                  'h-10 rounded-lg pl-10 ',
                  'focus-visible:border-amber-500 focus-visible:ring-amber-500/20',
                  errors.path &&
                    'border-red-500/50 focus-visible:border-red-500',
                )}
              />
            </div>
            {errors.path ? (
              <p className="text-xs text-red-400">{errors.path}</p>
            ) : (
              <p className="text-xs ">
                Absolute path to the directory to index
              </p>
            )}
          </div>

          {/* Pattern Input */}
          <div className="space-y-2">
            <Label htmlFor="pattern" className="text-sm font-medium ">
              File Pattern
            </Label>
            <div className="relative">
              <RiFileListLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 " />
              <Input
                id="pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="**/*.md"
                className={cn(
                  'h-10 rounded-lg pl-10 ',
                  'focus-visible:border-amber-500 focus-visible:ring-amber-500/20',
                )}
              />
            </div>
            <p className="text-xs ">
              Glob pattern for matching files (default: **/*.md)
            </p>
          </div>
        </form>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-lg bg-transparent  hover:bg-amber-900/30"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!name.trim() || !path.trim()}
            className="h-9 rounded-lg bg-amber-500 px-6 hover:bg-amber-600 disabled:opacity-50"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
