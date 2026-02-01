import type { ReactNode } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
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
        <header className="sticky top-0 z-10 bg-background flex h-13 shrink-0  items-center gap-2 border-b px-4">
          <div className="flex-1 flex items-center justify-center">
            {commandPalette}
          </div>

          <SidebarTrigger className="mr-1 ml-auto rotate-180" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex flex-1 overflow-hidden px-4 pb-24">
            {children}
          </div>
        </div>
      </SidebarInset>
      {sideBar}
    </SidebarProvider>
  )
}
