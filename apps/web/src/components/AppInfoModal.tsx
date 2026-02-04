'use client'

import { useQuery } from '@tanstack/react-query'
import {
  RiCommandLine,
  RiHistoryLine,
  RiQuestionLine,
  RiSearchLine,
  RiSettings3Line,
} from '@remixicon/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Kbd } from '@/components/ui/kbd'
import { getAppInfo } from '@/lib/server/qmd'

interface AppInfoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const shortcuts = [
  {
    key: '⌘K',
    description: 'Open Command Palette',
    icon: RiCommandLine,
  },
  {
    key: '⌘.',
    description: 'Open Settings',
    icon: RiSettings3Line,
  },
  {
    key: '⌘H',
    description: 'Open Search History',
    icon: RiHistoryLine,
  },
  {
    key: '/',
    description: 'Focus Search Input',
    icon: RiSearchLine,
  },
]

export function AppInfoModal({ open, onOpenChange }: AppInfoModalProps) {
  const { data: appInfo, isLoading } = useQuery({
    queryKey: ['app-info'],
    queryFn: () => getAppInfo(),
  })

  const displayName = appInfo?.name
  const displayVersion = appInfo?.version
  const displayDescription = appInfo?.description

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <div className="flex items-center gap-5">
            <div className="flex h-12 w-12 bg-primary items-center justify-center rounded-lg">
              <RiQuestionLine className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-bold">
                About {displayName}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {displayDescription}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* App Info */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-amber-50">What is QMD?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              QMD (Query Markup Documents) is a powerful document search and
              exploration tool. It allows you to index your document collections
              and search through them using BM25 full-text search, vector
              similarity search, or hybrid queries with reranking.
            </p>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-amber-50">
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2">
              {shortcuts.map((shortcut) => {
                const Icon = shortcut.icon
                return (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{shortcut.description}</span>
                    </div>
                    <Kbd>{shortcut.key}</Kbd>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Version Info */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              {isLoading ? 'Loading...' : `${displayName} v${displayVersion}`}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
