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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  RiSettings3Line,
  RiGlobalLine,
  RiListOrdered,
  RiFilter3Line,
} from '@remixicon/react'
import { cn } from '@/lib/utils'

export interface Settings {
  globalContext: string
  resultsPerPage: number
  minScoreSearch: number
  minScoreVsearch: number
  minScoreQuery: number
}

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: Settings
  onUpdate: (settings: Partial<Settings>) => void
}

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onUpdate,
}: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = React.useState<Settings>(settings)

  React.useEffect(() => {
    setLocalSettings(settings)
  }, [settings, open])

  const handleSave = () => {
    onUpdate({
      globalContext: localSettings.globalContext,
      resultsPerPage: localSettings.resultsPerPage,
      minScoreSearch: localSettings.minScoreSearch,
      minScoreVsearch: localSettings.minScoreVsearch,
      minScoreQuery: localSettings.minScoreQuery,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-900/30">
              <RiSettings3Line className="h-5 w-5 " />
            </div>
            <div>
              <DialogTitle className="text-lg font-medium text-amber-50">
                Settings
              </DialogTitle>
              <DialogDescription className="text-sm ">
                Configure your QMD preferences
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Global Context */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium ">
              <RiGlobalLine className="h-4 w-4 " />
              Global Context
            </Label>
            <Textarea
              value={localSettings.globalContext}
              onChange={(e) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  globalContext: e.target.value,
                }))
              }
              placeholder="Context applied to all collections and searches..."
              rows={4}
              className={cn(
                'resize-none rounded-lg ',
                'focus-visible:border-amber-500 focus-visible:ring-amber-500/20',
              )}
            />
            <p className="text-xs ">
              This context will be included with every search query across all
              collections
            </p>
          </div>

          {/* Results Per Page */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium ">
              <RiListOrdered className="h-4 w-4 " />
              Results Per Page
            </Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={localSettings.resultsPerPage}
              onChange={(e) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  resultsPerPage: parseInt(e.target.value) || 20,
                }))
              }
              className={cn(
                'h-10 w-32 rounded-lg ',
                'focus-visible:border-amber-500 focus-visible:ring-amber-500/20',
              )}
            />
            <p className="text-xs ">
              Number of results to display per page (1-100)
            </p>
          </div>

          {/* Minimum Score Settings */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium ">
              <RiFilter3Line className="h-4 w-4 " />
              Minimum Score Threshold
            </Label>
            <p className="text-xs ">
              Filter out results below this relevance score (0.0 - 1.0)
            </p>

            {/* Search Min Score */}
            <div className="flex items-center gap-3">
              <span className="text-xs w-20">Full-Text:</span>
              <Input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={localSettings.minScoreSearch}
                onChange={(e) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    minScoreSearch: parseFloat(e.target.value) || 0,
                  }))
                }
                className={cn(
                  'h-8 w-24 rounded-lg text-sm',
                  'focus-visible:border-amber-500 focus-visible:ring-amber-500/20',
                )}
              />
            </div>

            {/* Vector Search Min Score */}
            <div className="flex items-center gap-3">
              <span className="text-xs w-20">Vector:</span>
              <Input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={localSettings.minScoreVsearch}
                onChange={(e) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    minScoreVsearch: parseFloat(e.target.value) || 0.3,
                  }))
                }
                className={cn(
                  'h-8 w-24 rounded-lg text-sm',
                  'focus-visible:border-amber-500 focus-visible:ring-amber-500/20',
                )}
              />
            </div>

            {/* Hybrid Query Min Score */}
            <div className="flex items-center gap-3">
              <span className="text-xs w-20">Hybrid:</span>
              <Input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={localSettings.minScoreQuery}
                onChange={(e) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    minScoreQuery: parseFloat(e.target.value) || 0,
                  }))
                }
                className={cn(
                  'h-8 w-24 rounded-lg text-sm',
                  'focus-visible:border-amber-500 focus-visible:ring-amber-500/20',
                )}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-lg"
          >
            Cancel
          </Button>
          <div className="grow" />
          <Button type="button" onClick={handleSave} className="h-9 rounded-lg">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
