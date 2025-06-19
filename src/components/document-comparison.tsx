"use client"

import { useState } from "react"
import { Upload, FileText, X, GitCompare } from "lucide-react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { handleError, AppError } from "../lib/error-handler"
import { apiClient } from "../lib/api-client"
import { Textarea } from "./ui/textarea"
import { useToast } from "../hooks/use-toast"

interface Document {
  file: File | null
  name: string
  size: number
  id?: string
}

interface ComparisonResult {
  comparison_id: string
  status: string
  differences: Array<{
    type: string
    description: string
    location: string
  }>
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

export function DocumentComparison() {
  const [documents, setDocuments] = useState<[Document, Document]>([
    { file: null, name: "", size: 0 },
    { file: null, name: "", size: 0 },
  ])
  const [isDragging, setIsDragging] = useState<number | null>(null)
  const [isComparing, setIsComparing] = useState(false)
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [fieldWrittenPO, setFieldWrittenPO] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const { toast } = useToast()

  const validateFile = (file: File) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new AppError("Invalid file type. Please upload a PDF or Word document.")
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new AppError("File size exceeds 10MB limit.")
    }
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setIsDragging(index)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(null)
  }

  const handleDrop = async (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setIsDragging(null)
    try {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) {
        validateFile(droppedFile)
        const uploadedDoc = await apiClient.documents.upload(droppedFile)
        const newDocuments = [...documents]
        newDocuments[index] = {
          file: droppedFile,
          name: droppedFile.name,
          size: droppedFile.size,
          id: uploadedDoc.id,
        }
        setDocuments(newDocuments as [Document, Document])
      }
    } catch (error) {
      handleError(error)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    try {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        validateFile(selectedFile)
        const uploadedDoc = await apiClient.documents.upload(selectedFile)
        const newDocuments = [...documents]
        newDocuments[index] = {
          file: selectedFile,
          name: selectedFile.name,
          size: selectedFile.size,
          id: uploadedDoc.id,
        }
        setDocuments(newDocuments as [Document, Document])
      }
    } catch (error) {
      handleError(error)
    }
  }

  const handleRemoveFile = (index: number) => {
    const newDocuments = [...documents]
    newDocuments[index] = { file: null, name: "", size: 0 }
    setDocuments(newDocuments as [Document, Document])
  }

  const handleCompare = async () => {
    if (!documents[0].id || !documents[1].id) {
      handleError(new AppError("Please upload both documents to compare"))
      return
    }

    setIsComparing(true)
    try {
      const result = await apiClient.documents.compare(documents[0].id, documents[1].id)
      setComparisonResult(result)
    } catch (error) {
      handleError(error)
    } finally {
      setIsComparing(false)
    }
  }

  const canCompare = documents[0].id && documents[1].id

  const handleInvoiceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith(".pdf")) {
      toast({
        title: "Error",
        description: "Please upload a PDF file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 10MB",
        variant: "destructive",
      })
      return
    }

    setInvoiceFile(file)
  }

  const handleScan = async () => {
    if (!invoiceFile) {
      toast({
        title: "Error",
        description: "Please upload an invoice",
        variant: "destructive",
      })
      return
    }

    if (!fieldWrittenPO.trim()) {
      toast({
        title: "Error",
        description: "Please enter the field written PO",
        variant: "destructive",
      })
      return
    }

    setIsScanning(true)

    try {
      const formData = new FormData()
      formData.append("invoice", invoiceFile)
      formData.append("fieldWrittenPO", fieldWrittenPO)

      const response = await fetch("/api/documents/scan", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Scan failed")
      }

      const result = await response.json()
      toast({
        title: "Scan Complete",
        description: "Document verification completed successfully",
      })
      // Handle the scan results here
      console.log(result)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform document verification",
        variant: "destructive",
      })
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h2 className="text-2xl font-bold">Compare Documents</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {documents.map((doc, index) => (
          <Card
            key={index}
            className={`relative overflow-hidden transition-colors ${
              isDragging === index ? "border-primary bg-primary/5" : ""
            }`}
          >
            <div
              className="p-6"
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
            >
              {!doc.file ? (
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Drag and drop document {index + 1} here, or click to select
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: PDF, DOC, DOCX (max 10MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileSelect(e, index)}
                    className="hidden"
                    id={`file-upload-${index}`}
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById(`file-upload-${index}`)?.click()}
                  >
                    Select File
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(doc.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
      {canCompare && (
        <div className="flex justify-end">
          <Button 
            className="w-full sm:w-auto"
            onClick={handleCompare}
            disabled={isComparing}
          >
            <GitCompare className="mr-2 h-4 w-4" />
            <span>{isComparing ? "Comparing..." : "Compare Documents"}</span>
          </Button>
        </div>
      )}
      {comparisonResult && (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-medium">Comparison Results</h3>
          <div className="space-y-4">
            {comparisonResult.differences.map((diff, index) => (
              <div key={index} className="rounded-lg border p-4">
                <p className="font-medium">{diff.type}</p>
                <p className="text-sm text-muted-foreground">{diff.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">Location: {diff.location}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Upload Invoice</h3>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => document.getElementById("invoice-upload")?.click()}
              disabled={isScanning}
            >
              {invoiceFile ? "Change File" : "Select Invoice"}
            </Button>
            <input
              id="invoice-upload"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleInvoiceChange}
              disabled={isScanning}
            />
            {invoiceFile && (
              <span className="text-sm text-muted-foreground">
                {invoiceFile.name}
              </span>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Field Written PO</h3>
          <Textarea
            placeholder="Enter the field written PO details..."
            value={fieldWrittenPO}
            onChange={(e) => setFieldWrittenPO(e.target.value)}
            disabled={isScanning}
            className="min-h-[200px]"
          />
        </div>

        <Button
          onClick={handleScan}
          disabled={isScanning || !invoiceFile || !fieldWrittenPO.trim()}
          className="w-full"
        >
          {isScanning ? "Running DomuGuard Scan..." : "Run DomuGuard Scan"}
        </Button>
      </div>
    </div>
  )
} 