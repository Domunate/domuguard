"use client"

import { useState } from "react"
import { Upload, FileText, X } from "lucide-react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { handleError, AppError } from "@/lib/error-handler"
import { apiClient } from "@/lib/api-client"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

export function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const validateFile = (file: File) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new AppError("Invalid file type. Please upload a PDF or Word document.")
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new AppError("File size exceeds 10MB limit.")
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    try {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) {
        validateFile(droppedFile)
        setFile(droppedFile)
      }
    } catch (error) {
      handleError(error)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        validateFile(selectedFile)
        setFile(selectedFile)
      }
    } catch (error) {
      handleError(error)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      handleError(new AppError("Please select a file to upload"))
      return
    }

    setIsUploading(true)
    try {
      await apiClient.documents.upload(file)
      setFile(null)
    } catch (error) {
      handleError(error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h2 className="text-2xl font-bold">Upload Document</h2>
      </div>
      <Card
        className={`relative overflow-hidden transition-colors ${
          isDragging ? "border-primary bg-primary/5" : ""
        }`}
      >
        <div
          className="p-6"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!file ? (
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Drag and drop your document here, or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, DOC, DOCX (max 10MB)
                </p>
              </div>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                Select File
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FileText className="h-8 w-8 text-primary" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
} 