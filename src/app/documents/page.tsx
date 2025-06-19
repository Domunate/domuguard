'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Document {
  id: string;
  title: string;
  type: string;
  uploadDate: string;
  status: string;
  metadata?: {
    pages?: number;
    author?: string;
    creationDate?: string;
    images?: number;
  };
}

interface ComparisonResult {
  exact_matches: Array<{
    text: string;
    location: string;
  }>;
  semantic_matches: Array<{
    text1: string;
    text2: string;
    similarity: number;
  }>;
  structural_differences: {
    sections: Array<{
      name: string;
      status: string;
      differences: string[];
    }>;
    formatting: Array<{
      type: string;
      description: string;
    }>;
  };
  similarity_scores: {
    exact_match: number;
    semantic_similarity: number;
    structural_similarity: number;
  };
  enhanced_analysis: {
    text_statistics: {
      word_count: number;
      sentence_count: number;
      readability_score: number;
    };
    key_phrases: string[];
    content_changes: Array<{
      type: string;
      description: string;
    }>;
  };
  quality_metrics: {
    completeness: number;
    consistency: number;
    clarity: number;
    legal_quality: number;
  };
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [comparisonType, setComparisonType] = useState<string>('full');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setUploadFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      await fetchDocuments();
      setUploadFile(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentSelect = (docId: string) => {
    setSelectedDocs(prev => {
      if (prev.includes(docId)) {
        return prev.filter(id => id !== docId);
      }
      if (prev.length < 2) {
        return [...prev, docId];
      }
      return prev;
    });
  };

  const handleCompare = async () => {
    if (selectedDocs.length !== 2) {
      setError('Please select exactly 2 documents to compare');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          documentIds: selectedDocs,
          comparisonType,
          sections: selectedSections
        })
      });

      if (!response.ok) {
        throw new Error('Failed to compare documents');
      }

      const result = await response.json();
      setComparisonResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare documents');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Legal Document Analysis</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Document</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleUpload}
              disabled={!uploadFile || isLoading}
            >
              {isLoading ? 'Uploading...' : 'Upload'}
            </Button>
          </CardContent>
        </Card>

        {/* Document List */}
        <Card>
          <CardHeader>
            <CardTitle>Document List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedDocs.includes(doc.id) ? 'border-primary bg-primary/10' : 'border-border'
                  }`}
                  onClick={() => handleDocumentSelect(doc.id)}
                >
                  <h3 className="font-semibold">{doc.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Type: {doc.type} | Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                  </p>
                  {doc.metadata && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {doc.metadata.pages && <p>Pages: {doc.metadata.pages}</p>}
                      {doc.metadata.author && <p>Author: {doc.metadata.author}</p>}
                      {doc.metadata.images && <p>Images: {doc.metadata.images}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comparison Section */}
        <Card>
          <CardHeader>
            <CardTitle>Compare Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Comparison Type</Label>
              <select
                className="w-full p-2 border rounded"
                value={comparisonType}
                onChange={(e) => setComparisonType(e.target.value)}
              >
                <option value="full">Full Analysis</option>
                <option value="semantic">Semantic Similarity</option>
                <option value="structural">Structural Analysis</option>
                <option value="legal">Legal Quality</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Selected Documents ({selectedDocs.length}/2)</Label>
              {selectedDocs.map((docId) => {
                const doc = documents.find(d => d.id === docId);
                return doc ? (
                  <div key={docId} className="p-2 bg-muted rounded">
                    {doc.title}
                  </div>
                ) : null;
              })}
            </div>

            <Button
              className="w-full"
              onClick={handleCompare}
              disabled={selectedDocs.length !== 2 || isLoading}
            >
              {isLoading ? 'Analyzing...' : 'Compare Documents'}
            </Button>

            {/* Comparison Results */}
            {comparisonResult && (
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold">Analysis Results</h3>
                
                {/* Similarity Scores */}
                <div className="space-y-2">
                  <h4 className="font-medium">Similarity Scores</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-muted rounded">
                      <p className="text-sm">Exact Match</p>
                      <p className="font-semibold">{(comparisonResult.similarity_scores.exact_match * 100).toFixed(1)}%</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="text-sm">Semantic Similarity</p>
                      <p className="font-semibold">{(comparisonResult.similarity_scores.semantic_similarity * 100).toFixed(1)}%</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="text-sm">Structural Similarity</p>
                      <p className="font-semibold">{(comparisonResult.similarity_scores.structural_similarity * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                {/* Quality Metrics */}
                <div className="space-y-2">
                  <h4 className="font-medium">Quality Metrics</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-muted rounded">
                      <p className="text-sm">Completeness</p>
                      <p className="font-semibold">{(comparisonResult.quality_metrics.completeness * 100).toFixed(1)}%</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="text-sm">Consistency</p>
                      <p className="font-semibold">{(comparisonResult.quality_metrics.consistency * 100).toFixed(1)}%</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="text-sm">Clarity</p>
                      <p className="font-semibold">{(comparisonResult.quality_metrics.clarity * 100).toFixed(1)}%</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="text-sm">Legal Quality</p>
                      <p className="font-semibold">{(comparisonResult.quality_metrics.legal_quality * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                {/* Key Differences */}
                <div className="space-y-2">
                  <h4 className="font-medium">Key Differences</h4>
                  <div className="space-y-2">
                    {comparisonResult.structural_differences.sections.map((section, index) => (
                      <div key={index} className="p-2 bg-muted rounded">
                        <p className="font-medium">{section.name}</p>
                        <p className="text-sm">{section.status}</p>
                        {section.differences.length > 0 && (
                          <ul className="mt-1 text-sm list-disc list-inside">
                            {section.differences.map((diff, i) => (
                              <li key={i}>{diff}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enhanced Analysis */}
                <div className="space-y-2">
                  <h4 className="font-medium">Enhanced Analysis</h4>
                  <div className="space-y-2">
                    <div className="p-2 bg-muted rounded">
                      <p className="font-medium">Text Statistics</p>
                      <p className="text-sm">Word Count: {comparisonResult.enhanced_analysis.text_statistics.word_count}</p>
                      <p className="text-sm">Sentence Count: {comparisonResult.enhanced_analysis.text_statistics.sentence_count}</p>
                      <p className="text-sm">Readability Score: {comparisonResult.enhanced_analysis.text_statistics.readability_score.toFixed(1)}</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="font-medium">Key Phrases</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {comparisonResult.enhanced_analysis.key_phrases.map((phrase, index) => (
                          <span key={index} className="px-2 py-1 text-sm bg-background rounded">
                            {phrase}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 