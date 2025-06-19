"use client"

import { useState, useEffect } from "react"
import { Navbar } from "./navbar"
import { Sidebar } from "./sidebar"
import { MasterTradeAgreementUpload } from "./master-trade-agreement-upload"
import { DocumentComparison } from "./document-comparison"
import { Projects } from "./projects"
import { useToast } from "../hooks/use-toast"

type UserRole = "superuser" | "admin" | "user"

interface User {
  email: string
  role: UserRole
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<"upload" | "compare" | "projects">("upload")
  const [user, setUser] = useState<User | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Fetch user data and role
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
    <div className="flex h-screen">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6">
          {activeTab === "upload" && canUploadMasterAgreement && (
            <MasterTradeAgreementUpload />
          )}
          {activeTab === "compare" && (
            <DocumentComparison />
          )}
          {activeTab === "projects" && (
            <Projects />
          )}
        </main>
      </div>
    </div>
  )
} 
