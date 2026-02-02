import type { ReactNode } from 'react'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
interface LayoutProps {
  children: ReactNode
  commandPalette: ReactNode
  sideBar: ReactNode
}

export function Layout({ children, commandPalette, sideBar }: LayoutProps) {
  return (
    <SidebarProvider>
      <SidebarInset>
        <header className="z-10 bg-background flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex-1 flex items-center justify-center">
            {commandPalette}
          </div>

          <SidebarTrigger className="mr-1 ml-auto rotate-180" />
        </header>
        <div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
          <div className="flex overflow-hidden">{children}</div>
        </div>
      </SidebarInset>
      {sideBar}
    </SidebarProvider>
  )
}
