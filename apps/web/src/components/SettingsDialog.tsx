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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  RiSettings3Line,
  RiGlobalLine,
  RiListOrdered,
  RiTerminalLine,
} from '@remixicon/react'
import { cn } from '@/lib/utils'

type OutputFormat = 'cli' | 'json' | 'csv' | 'md' | 'xml' | 'files'

export interface Settings {
  globalContext: string
  resultsPerPage: number
  outputFormat: OutputFormat
}

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: Settings
  onUpdate: (settings: Partial<Settings>) => void
}

const outputFormatOptions: {
  value: OutputFormat
  label: string
  description: string
}[] = [
  { value: 'cli', label: 'CLI', description: 'Human-readable format' },
  { value: 'json', label: 'JSON', description: 'Machine-readable JSON' },
  { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
  { value: 'md', label: 'Markdown', description: 'Markdown table' },
  { value: 'xml', label: 'XML', description: 'XML format' },
  { value: 'files', label: 'Files', description: 'List of file paths only' },
]

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
      outputFormat: localSettings.outputFormat,
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

          {/* Output Format */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium ">
              <RiTerminalLine className="h-4 w-4 " />
              Default Output Format
            </Label>
            <Select
              value={localSettings.outputFormat}
              onValueChange={(value) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  outputFormat: value as OutputFormat,
                }))
              }
            >
              <SelectTrigger
                className={cn(
                  'h-10 rounded-lg ',
                  'focus:border-amber-500 focus:ring-amber-500/20',
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {outputFormatOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className=" focus:bg-amber-900/30 focus:text-amber-50"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs ">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs ">Default format for search result output</p>
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
          <Button type="button" onClick={handleSave} className="h-9 rounded-lg">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
