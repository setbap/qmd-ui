import type { ReactNode } from 'react'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
interface LayoutProps {
  children: ReactNode
  logo: ReactNode
  commandPalette: ReactNode
  sideBar: ReactNode
}

export function Layout({
  logo,
  children,
  commandPalette,
  sideBar,
}: LayoutProps) {
  return (
    <SidebarProvider>
      <SidebarInset>
        <header className="z-10 bg-background flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex-1 w-full flex items-center justify-between">
            <div className="w-24">{logo}</div>
            <div>{commandPalette}</div>
            <div className="w-24 text-end">
              <SidebarTrigger className="rotate-180" />
            </div>
          </div>
        </header>
        <div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
          <div className="flex h-full overflow-hidden overscroll-none">
            {children}
          </div>
        </div>
      </SidebarInset>
      {sideBar}
    </SidebarProvider>
  )
}
