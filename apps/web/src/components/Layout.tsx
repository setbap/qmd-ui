import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  searchBar: ReactNode
  commandPalette: ReactNode
}

export function Layout({ children, searchBar, commandPalette }: LayoutProps) {
  return (
    <div className="flex h-screen w-full flex-col text-amber-50">
      {/* Command Palette Trigger Area - Minimal */}
      <div className="flex justify-center py-2">{commandPalette}</div>

      {/* Main Content Area - Full height minus search bar */}
      <div className="flex flex-1 overflow-hidden px-4 pb-24">{children}</div>

      {/* Search Bar - Fixed at bottom */}
      {searchBar}
    </div>
  )
}
