"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"

interface LayoutProps {
  children: React.ReactNode
  sidebar: React.ReactNode
}

export function Layout({ children, sidebar }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 border-b bg-background lg:hidden">
        <div className="flex h-16 items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
          <h1 className="text-lg font-semibold">DomuGuard</h1>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-background/80 backdrop-blur-sm transition-opacity lg:hidden",
          isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setIsSidebarOpen(false)}
      >
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-background transition-transform duration-200 ease-in-out",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {sidebar}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden w-64 border-r bg-muted/40 lg:block">
          {sidebar}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <main className="container mx-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
} 