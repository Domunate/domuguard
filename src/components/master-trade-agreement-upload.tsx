"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { useToast } from "../hooks/use-toast"

export function MasterTradeAgreementUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file type", description: "Only PDF files are allowed.", variant: "destructive" })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "File size must be less than 10MB.", variant: "destructive" })
      return
    }
    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents/master-agreement`, {
        method: "POST",
        body: formData,
      })
      if (!response.ok) throw new Error("Upload failed")
      toast({ title: "Upload successful", description: "Master Trade Agreement uploaded successfully." })
    } catch (err) {
      toast({ title: "Upload failed", description: (err as Error).message, variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <label htmlFor="master-trade-agreement-upload">
        <Button asChild disabled={isUploading}>
          <span>{isUploading ? "Uploading..." : "Upload Master Trade Agreement (PDF)"}</span>
        </Button>
        <input
          id="master-trade-agreement-upload"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </label>
    </div>
  )
} 