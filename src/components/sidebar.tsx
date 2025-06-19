"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, GitCompare, FolderGit2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SidebarProps {
  activeTab: "upload" | "compare" | "projects"
  onTabChange: (tab: "upload" | "compare" | "projects") => void
}

interface User {
  email: string
  role: "superuser" | "admin" | "user"
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [user, setUser] = useState<User | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch user data",
          variant: "destructive",
        })
      }
    }

    fetchUser()
  }, [toast])

  const canUploadMasterAgreement = user?.role === "superuser" || user?.role === "admin"

  return (
    <div className="w-64 border-r bg-background p-4">
      <nav className="space-y-2">
        {canUploadMasterAgreement && (
          <Button
            variant={activeTab === "upload" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => onTabChange("upload")}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Master Trade Agreement
          </Button>
        )}
        <Button
          variant={activeTab === "compare" ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => onTabChange("compare")}
        >
          <GitCompare className="mr-2 h-4 w-4" />
          Document Verification
        </Button>
        <Button
          variant={activeTab === "projects" ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => onTabChange("projects")}
        >
          <FolderGit2 className="mr-2 h-4 w-4" />
          Projects
        </Button>
      </nav>
    </div>
  )
} 
