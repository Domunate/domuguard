'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, X, Camera, FileInput, ArrowLeft } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

export default function DocumentProcessPage() {
  const [tradeAgreement, setTradeAgreement] = useState<File | null>(null);
  const [invoice, setInvoice] = useState<File | null>(null);
  const [poDescription, setPoDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();
  const { user, isLoading, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    if (!isLoading && !user) {
      console.log('User not authenticated, redirecting to login...');
      toast({
        title: "Authentication Required",
        description: "Please log in to access the document processing page.",
        variant: "destructive"
      });
      router.push('/login');
    }
  }, [user, isLoading, router, toast]);

  const validateFile = (file: File) => {
    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
    
    if (!extension || !allowedExtensions.includes(extension)) {
      throw new Error('Invalid file type. Please upload a PDF, Word document, or image.');
    }

    // Check MIME type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a PDF, Word document, or image.');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 10MB limit.');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'trade' | 'invoice') => {
    try {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        validateFile(selectedFile);
        if (type === 'trade') {
          setTradeAgreement(selectedFile);
        } else {
          setInvoice(selectedFile);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to process file',
        variant: "destructive"
      });
    }
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const capturedFile = e.target.files?.[0];
      if (capturedFile) {
        validateFile(capturedFile);
        setInvoice(capturedFile);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to process camera capture',
        variant: "destructive"
      });
    }
  };

  const handleProcess = async () => {
    try {
      if (!tradeAgreement || !invoice) {
        toast({
          title: "Error",
          description: "Please select both trade agreement and invoice files",
          variant: "destructive"
        });
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Error",
          description: "Session expired. Please log in again.",
          variant: "destructive"
        });
        router.push('/login');
        return;
      }

      setIsProcessing(true);
      const formData = new FormData();
      formData.append('trade_agreement', tradeAgreement);
      formData.append('invoice', invoice);
      formData.append('po_description', poDescription || "");

      console.log('Sending request with token:', token.substring(0, 10) + '...'); // Log partial token for debugging

      const response = await fetch('http://localhost:8000/api/v1/documents/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        let errorMessage = 'Failed to process documents';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || `Error: ${response.status}`;
        } catch (e) {
          // If parsing JSON fails, use status text
          errorMessage = `${response.status}: ${response.statusText || 'Unknown error'}`;
        }
        
        if (response.status === 401) {
          // Only redirect to login if we get a proper 401 response
          localStorage.removeItem('token');
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive"
          });
          router.push('/login');
          return;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Check if OCR was available
      if (result.metadata?.invoice?.ocr_available === false) {
        toast({
          title: "Information",
          description: "OCR is not available. Image text extraction may be limited.",
          variant: "default"
        });
      }

      setProcessingResult(result);
      toast({
        title: "Success",
        description: "Documents processed successfully!",
        variant: "default"
      });
    } catch (error) {
      console.error('Error processing documents:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to process documents',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      console.log('Initiating logout...');
      await logout();
      toast({
        title: "Success",
        description: "Logged out successfully.",
        variant: "default"
      });
      router.push('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNavigation = async (path: string) => {
    if (isNavigating) return;
    
    try {
      setIsNavigating(true);
      console.log(`Navigating to ${path}...`);
      
      // If there are unsaved changes, show a confirmation dialog
      if (tradeAgreement || invoice || poDescription) {
        const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
        if (!confirmed) {
          setIsNavigating(false);
          return;
        }
      }
      
      router.push(path);
    } catch (error) {
      console.error(`Error navigating to ${path}:`, error);
      toast({
        title: "Error",
        description: "Failed to navigate. Please try again.",
        variant: "destructive"
      });
      setIsNavigating(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></div>
        <span>Checking authentication...</span>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  const handleRemoveFile = (type: 'trade' | 'invoice') => {
    if (type === 'trade') {
      setTradeAgreement(null);
    } else {
      setInvoice(null);
    }
    setProcessingResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 text-white">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="outline"
            onClick={() => handleNavigation('/dashboard')}
            disabled={isNavigating}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isNavigating ? 'Navigating...' : 'Return to Dashboard'}
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </div>

        <h1 className="text-4xl font-bold mb-8 text-center text-white drop-shadow-lg">Process Documents</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trade Agreement Upload */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Upload Trade Agreement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!tradeAgreement ? (
                  <div className="border-2 border-white/20 border-dashed rounded-lg p-6 text-center hover:border-white/40 transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-white/70" />
                    <div className="space-y-2 mt-4">
                      <p className="text-sm text-white/70">
                        Upload your trade agreement document
                      </p>
                      <p className="text-xs text-white/50">
                        Supported formats: PDF, DOC, DOCX (max 10MB)
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileSelect(e, 'trade')}
                      className="hidden"
                      ref={fileInputRef}
                      id="trade-agreement-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('trade-agreement-upload')?.click()}
                      className="mt-4 bg-white/10 hover:bg-white/20 text-white border-white/20"
                    >
                      Select File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-8 w-8 text-white/70" />
                        <div className="text-left">
                          <p className="font-medium text-white">{tradeAgreement.name}</p>
                          <p className="text-sm text-white/50">
                            {tradeAgreement.size > 0 ? 
                              tradeAgreement.size < 1024 * 1024 ? 
                                `${(tradeAgreement.size / 1024).toFixed(2)} KB` : 
                                `${(tradeAgreement.size / 1024 / 1024).toFixed(2)} MB` 
                              : '0.00 KB'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFile('trade')}
                        className="text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Invoice Upload */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Upload Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!invoice ? (
                  <div className="border-2 border-white/20 border-dashed rounded-lg p-6 text-center hover:border-white/40 transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-white/70" />
                    <div className="space-y-2 mt-4">
                      <p className="text-sm text-white/70">
                        Upload your invoice or take a photo
                      </p>
                      <p className="text-xs text-white/50">
                        Supported formats: PDF, DOC, DOCX, JPG, PNG (max 10MB)
                      </p>
                    </div>
                    <div className="flex flex-col space-y-2 mt-4">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileSelect(e, 'invoice')}
                        className="hidden"
                        ref={fileInputRef}
                        id="invoice-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('invoice-upload')?.click()}
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                      >
                        Select File
                      </Button>
                      <Input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleCameraCapture}
                        className="hidden"
                        ref={cameraInputRef}
                        id="camera-capture"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('camera-capture')?.click()}
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Take Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-8 w-8 text-white/70" />
                        <div className="text-left">
                          <p className="font-medium text-white">{invoice.name}</p>
                          <p className="text-sm text-white/50">
                            {invoice.size > 0 ? 
                              invoice.size < 1024 * 1024 ? 
                                `${(invoice.size / 1024).toFixed(2)} KB` : 
                                `${(invoice.size / 1024 / 1024).toFixed(2)} MB` 
                              : '0.00 KB'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFile('invoice')}
                        className="text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PO Description Form */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Field Written PO Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter your PO description here..."
                  value={poDescription}
                  onChange={(e) => setPoDescription(e.target.value)}
                  className="min-h-[200px] bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-white/40"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Button
            className="w-full bg-white/20 hover:bg-white/30 text-white border-white/20 shadow-lg"
            onClick={handleProcess}
            disabled={isProcessing || !tradeAgreement || !invoice}
          >
            {isProcessing ? 'Processing...' : 'Process Documents'}
          </Button>
        </div>

        {processingResult && (
          <Card className="mt-6 bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Processing Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* AI Summary */}
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <Label className="text-lg font-semibold text-white mb-4">Summary</Label>
                  <div className="space-y-4">
                    {/* Overall Similarity Summary */}
                    <div>
                      <p className="text-sm text-white/90">
                        The documents show a {processingResult.comparison.similarity_scores.exact_match > 0.7 ? 'high' : 
                          processingResult.comparison.similarity_scores.exact_match > 0.4 ? 'moderate' : 'low'} level of similarity, 
                        with {Math.round(processingResult.comparison.similarity_scores.exact_match * 100)}% exact matches and 
                        {Math.round(processingResult.comparison.similarity_scores.semantic_similarity * 100)}% semantic similarity.
                      </p>
                    </div>

                    {/* Quality Assessment Summary */}
                    <div>
                      <p className="text-sm text-white/90">
                        The quality assessment indicates {processingResult.comparison.quality_metrics.completeness.score > 0.7 ? 'strong' : 
                          processingResult.comparison.quality_metrics.completeness.score > 0.4 ? 'moderate' : 'weak'} completeness 
                        ({Math.round(processingResult.comparison.quality_metrics.completeness.score * 100)}%) and 
                        {processingResult.comparison.quality_metrics.consistency.score > 0.7 ? 'high' : 
                          processingResult.comparison.quality_metrics.consistency.score > 0.4 ? 'moderate' : 'low'} consistency 
                        ({Math.round(processingResult.comparison.quality_metrics.consistency.score * 100)}%).
                      </p>
                    </div>

                    {/* Content Changes Summary */}
                    {processingResult.comparison.enhanced_analysis.content_changes.added?.length > 0 || 
                     processingResult.comparison.enhanced_analysis.content_changes.removed?.length > 0 && (
                      <div>
                        <p className="text-sm text-white/90">
                          {processingResult.comparison.enhanced_analysis.content_changes.added?.length > 0 && 
                            `${processingResult.comparison.enhanced_analysis.content_changes.added.length} sections were added, `}
                          {processingResult.comparison.enhanced_analysis.content_changes.removed?.length > 0 && 
                            `${processingResult.comparison.enhanced_analysis.content_changes.removed.length} sections were removed.`}
                        </p>
                      </div>
                    )}

                    {/* PO Analysis Summary */}
                    {processingResult.comparison.po_analysis && (
                      <div>
                        <p className="text-sm text-white/90">
                          The purchase order shows {processingResult.comparison.po_analysis.similarities.trade_agreement > 0.7 ? 'strong' : 
                            processingResult.comparison.po_analysis.similarities.trade_agreement > 0.4 ? 'moderate' : 'weak'} alignment 
                          with the trade agreement ({Math.round(processingResult.comparison.po_analysis.similarities.trade_agreement * 100)}%) 
                          and {processingResult.comparison.po_analysis.similarities.invoice > 0.7 ? 'strong' : 
                            processingResult.comparison.po_analysis.similarities.invoice > 0.4 ? 'moderate' : 'weak'} alignment 
                          with the invoice ({Math.round(processingResult.comparison.po_analysis.similarities.invoice * 100)}%).
                        </p>
                      </div>
                    )}

                    {/* Key Findings */}
                    <div>
                      <p className="text-sm text-white/90">
                        Key findings include:
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-white/70 list-disc list-inside">
                        {processingResult.comparison.quality_metrics.completeness.missing_sections && 
                         Object.entries(processingResult.comparison.quality_metrics.completeness.missing_sections).some(([_, sections]) => 
                           (sections as string[]).length > 0) && (
                          <li>Some required sections are missing from the documents</li>
                        )}
                        {processingResult.comparison.quality_metrics.consistency.inconsistencies?.length > 0 && (
                          <li>Several inconsistencies were found between the documents</li>
                        )}
                        {processingResult.comparison.enhanced_analysis.content_changes.added?.length > 0 && (
                          <li>New content has been added to the documents</li>
                        )}
                        {processingResult.comparison.enhanced_analysis.content_changes.removed?.length > 0 && (
                          <li>Some content has been removed from the documents</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Similarity Scores */}
                <div>
                  <Label className="text-lg font-semibold text-white">Similarity Analysis</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-sm text-white/70">Exact Match</p>
                      <p className="text-2xl font-bold text-white">
                        {(processingResult.comparison.similarity_scores.exact_match * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-sm text-white/70">Semantic Similarity</p>
                      <p className="text-2xl font-bold text-white">
                        {(processingResult.comparison.similarity_scores.semantic_similarity * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-sm text-white/70">Structural Similarity</p>
                      <p className="text-2xl font-bold text-white">
                        {(processingResult.comparison.similarity_scores.structural_similarity * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quality Metrics */}
                <div>
                  <Label className="text-lg font-semibold text-white">Quality Assessment</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-sm text-white/70">Completeness</p>
                      <p className="text-2xl font-bold text-white">
                        {(processingResult.comparison.quality_metrics.completeness.score * 100).toFixed(1)}%
                      </p>
                      {processingResult.comparison.quality_metrics.completeness.missing_sections && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-white/90">Missing Sections:</p>
                          <ul className="text-sm text-white/70 list-disc list-inside">
                            {Object.entries(processingResult.comparison.quality_metrics.completeness.missing_sections).map(([doc, sections]) => (
                              <li key={doc} className="mb-2">
                                <span className="font-medium">{doc}:</span>
                                <ul className="ml-4">
                                  {(sections as string[]).map((section: string, index: number) => (
                                    <li key={index}>{section}</li>
                                  ))}
                                </ul>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-sm text-white/70">Consistency</p>
                      <p className="text-2xl font-bold text-white">
                        {(processingResult.comparison.quality_metrics.consistency.score * 100).toFixed(1)}%
                      </p>
                      {processingResult.comparison.quality_metrics.consistency.inconsistencies && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-white/90">Inconsistencies:</p>
                          <ul className="text-sm text-white/70 list-disc list-inside">
                            {processingResult.comparison.quality_metrics.consistency.inconsistencies.map((item: string, index: number) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Changes */}
                <div>
                  <Label className="text-lg font-semibold text-white">Content Changes</Label>
                  <div className="mt-2 space-y-4">
                    {processingResult.comparison.enhanced_analysis.content_changes.added?.length > 0 && (
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-sm font-medium text-white/90">Added Content</p>
                        <ul className="mt-2 space-y-2">
                          {processingResult.comparison.enhanced_analysis.content_changes.added.map((sentence: string, index: number) => (
                            <li key={index} className="text-sm text-white/70">{sentence}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {processingResult.comparison.enhanced_analysis.content_changes.removed?.length > 0 && (
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-sm font-medium text-white/90">Removed Content</p>
                        <ul className="mt-2 space-y-2">
                          {processingResult.comparison.enhanced_analysis.content_changes.removed.map((sentence: string, index: number) => (
                            <li key={index} className="text-sm text-white/70">{sentence}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {processingResult.comparison.enhanced_analysis.content_changes.po_changes && (
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-sm font-medium text-white/90">PO Changes</p>
                        <div className="mt-2 space-y-4">
                          {Object.entries(processingResult.comparison.enhanced_analysis.content_changes.po_changes).map(([doc, changes]) => (
                            <div key={doc}>
                              <p className="text-sm font-medium text-white/80">{doc}:</p>
                              <ul className="mt-2 space-y-2">
                                {(changes as string[]).map((change: string, index: number) => (
                                  <li key={index} className="text-sm text-white/70">{change}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Phrases */}
                <div>
                  <Label className="text-lg font-semibold text-white">Key Phrases</Label>
                  <div className="mt-2 p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex flex-wrap gap-2">
                      {processingResult.comparison.enhanced_analysis.key_phrases.common_phrases.map((phrase: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-white/10 rounded-full text-sm text-white/90">
                          {phrase}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PO Analysis (if available) */}
                {processingResult.comparison.po_analysis && (
                  <div>
                    <Label className="text-lg font-semibold text-white">Purchase Order Analysis</Label>
                    <div className="mt-2 space-y-4">
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-sm font-medium text-white/90">Similarity with PO</p>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <p className="text-sm text-white/70">Trade Agreement</p>
                            <p className="text-xl font-bold text-white">
                              {(processingResult.comparison.po_analysis.similarities.trade_agreement * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-white/70">Invoice</p>
                            <p className="text-xl font-bold text-white">
                              {(processingResult.comparison.po_analysis.similarities.invoice * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                      {processingResult.comparison.po_analysis.discrepancies && (
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-sm font-medium text-white/90">Discrepancies</p>
                          <ul className="mt-2 space-y-2">
                            {Object.entries(processingResult.comparison.po_analysis.discrepancies).map(([key, value], index) => (
                              <li key={index} className="text-sm text-white/70">
                                <span className="font-medium">{key}:</span> {String(value)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 