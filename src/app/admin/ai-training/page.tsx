'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Settings, Play, StopCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Progress } from '@/components/ui/progress';

export default function AITrainingPage() {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingFiles, setTrainingFiles] = useState<File[]>([]);
  const [trainingConfig, setTrainingConfig] = useState({
    epochs: 10,
    batchSize: 32,
    learningRate: 0.001,
    validationSplit: 0.2
  });
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      console.log('No authenticated user, redirecting to login...');
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  // Don't render the page if not authenticated
  if (!user) {
    return null;
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      // Validate input event
      if (!e.target.files) {
        throw new Error('No files selected in the input event');
      }

      const files = Array.from(e.target.files);
      
      // Validate file types
      const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
      const invalidFiles = files.filter(file => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        return !allowedTypes.includes(extension);
      });

      if (invalidFiles.length > 0) {
        throw new Error(`Invalid file types detected: ${invalidFiles.map(f => f.name).join(', ')}. Allowed types: ${allowedTypes.join(', ')}`);
      }

      // Validate file sizes (max 10MB per file)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      const oversizedFiles = files.filter(file => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        throw new Error(`Files exceeding 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      }

      setTrainingFiles(prev => [...prev, ...files]);
      
      // Get adjusted configuration after files are uploaded
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found in localStorage');
        }

        // Create request body with config and num_files
        const requestBody = {
          config: {
            epochs: trainingConfig.epochs,
            batchSize: trainingConfig.batchSize,
            learningRate: trainingConfig.learningRate,
            validationSplit: trainingConfig.validationSplit
          },
          num_files: trainingFiles.length + files.length
        };

        console.log('Sending request with body:', requestBody);

        const response = await fetch('http://localhost:8000/api/v1/admin/get-adjusted-config', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Failed to parse error response' }));
          
          // Handle specific error cases
          if (response.status === 422) {
            console.error('Validation error:', {
              status: response.status,
              errorData,
              requestData: requestBody,
              responseText: await response.text().catch(() => 'Could not read response text')
            });
            throw new Error(`Configuration validation failed: ${JSON.stringify(errorData.detail)}`);
          }
          
          throw new Error(`Server responded with status ${response.status}: ${JSON.stringify(errorData.detail || 'Unknown error')}`);
        }

        const adjustedConfig = await response.json();
        
        // Validate adjusted configuration
        if (!adjustedConfig || typeof adjustedConfig !== 'object') {
          throw new Error('Invalid configuration format received from server');
        }

        const requiredKeys = ['epochs', 'batchSize', 'learningRate', 'validationSplit'];
        const missingKeys = requiredKeys.filter(key => !(key in adjustedConfig));
        if (missingKeys.length > 0) {
          throw new Error(`Missing required configuration keys: ${missingKeys.join(', ')}`);
        }

        // Validate configuration values
        if (adjustedConfig.epochs < 1 || adjustedConfig.epochs > 100) {
          throw new Error(`Invalid epochs value received: ${adjustedConfig.epochs}. Must be between 1 and 100.`);
        }
        if (adjustedConfig.batchSize < 1 || adjustedConfig.batchSize > 512) {
          throw new Error(`Invalid batch size received: ${adjustedConfig.batchSize}. Must be between 1 and 512.`);
        }
        if (adjustedConfig.learningRate <= 0 || adjustedConfig.learningRate >= 1) {
          throw new Error(`Invalid learning rate received: ${adjustedConfig.learningRate}. Must be between 0 and 1.`);
        }
        if (adjustedConfig.validationSplit <= 0 || adjustedConfig.validationSplit >= 1) {
          throw new Error(`Invalid validation split received: ${adjustedConfig.validationSplit}. Must be between 0 and 1.`);
        }

        setTrainingConfig(adjustedConfig);
        
        toast({
          title: "Configuration Updated",
          description: "Training configuration has been automatically adjusted based on the number of files.",
          variant: "default"
        });
      } catch (configError) {
        console.error('Configuration adjustment error:', {
          error: configError,
          message: configError instanceof Error ? configError.message : 'Unknown error',
          stack: configError instanceof Error ? configError.stack : undefined,
          timestamp: new Date().toISOString(),
          files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
          currentConfig: trainingConfig,
          numFiles: trainingFiles.length + files.length
        });

        toast({
          title: "Configuration Warning",
          description: configError instanceof Error ? configError.message : 'Failed to adjust configuration. Using default values.',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('File selection error:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        event: {
          type: e.type,
          target: e.target ? {
            files: e.target.files ? Array.from(e.target.files).map(f => ({
              name: f.name,
              size: f.size,
              type: f.type
            })) : null
          } : null
        }
      });

      toast({
        title: "File Selection Error",
        description: error instanceof Error ? error.message : 'Failed to process selected files',
        variant: "destructive"
      });
    }
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTrainingConfig(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  const handleStartTraining = async () => {
    try {
      // Validate training files
      if (trainingFiles.length === 0) {
        throw new Error('No training files selected');
      }

      // Validate training configuration
      const requiredConfigKeys = ['epochs', 'batchSize', 'learningRate', 'validationSplit'];
      const missingKeys = requiredConfigKeys.filter(key => !(key in trainingConfig));
      if (missingKeys.length > 0) {
        throw new Error(`Missing required configuration keys: ${missingKeys.join(', ')}`);
      }

      // Validate configuration values
      if (trainingConfig.epochs < 1 || trainingConfig.epochs > 100) {
        throw new Error(`Invalid epochs value: ${trainingConfig.epochs}. Must be between 1 and 100.`);
      }
      if (trainingConfig.batchSize < 1 || trainingConfig.batchSize > 512) {
        throw new Error(`Invalid batch size: ${trainingConfig.batchSize}. Must be between 1 and 512.`);
      }
      if (trainingConfig.learningRate <= 0 || trainingConfig.learningRate >= 1) {
        throw new Error(`Invalid learning rate: ${trainingConfig.learningRate}. Must be between 0 and 1.`);
      }
      if (trainingConfig.validationSplit <= 0 || trainingConfig.validationSplit >= 1) {
        throw new Error(`Invalid validation split: ${trainingConfig.validationSplit}. Must be between 0 and 1.`);
      }

      setIsTraining(true);
      setTrainingProgress(0);

      const formData = new FormData();
      trainingFiles.forEach(file => {
        formData.append('training_files', file);
      });
      formData.append('config', JSON.stringify(trainingConfig));

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found in localStorage');
      }

      const response = await fetch('http://localhost:8000/api/v1/admin/train-model', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Server responded with status ${response.status}: ${errorData.detail || 'Unknown error'}`);
      }

      const responseData = await response.json();
      
      // Validate response data
      if (!responseData.task_id) {
        throw new Error('Invalid response from server: missing task_id');
      }

      // Start progress monitoring
      const startTime = Date.now();
      const estimatedDuration = responseData.estimated_duration || 30; // Default to 30 minutes if not provided
      
      const interval = setInterval(() => {
        const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);
        const progress = Math.min(100, Math.floor((elapsedMinutes / estimatedDuration) * 100));
        
        setTrainingProgress(prev => {
          if (progress >= 100) {
            clearInterval(interval);
            setIsTraining(false);
            toast({
              title: "Training Complete",
              description: "The model has been successfully trained!",
              variant: "default"
            });
            return 100;
          }
          return progress;
        });
      }, 1000);

    } catch (error) {
      console.error('Training start error:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        trainingConfig: trainingConfig,
        files: trainingFiles.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        }))
      });

      setIsTraining(false);
      toast({
        title: "Training Error",
        description: error instanceof Error ? error.message : 'Failed to start training',
        variant: "destructive"
      });
    }
  };

  const handleStopTraining = async () => {
    try {
      // Validate training state
      if (!isTraining) {
        throw new Error('No training process is currently running');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found in localStorage');
      }

      const response = await fetch('http://localhost:8000/api/v1/admin/stop-training', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Server responded with status ${response.status}: ${errorData.detail || 'Unknown error'}`);
      }

      const responseData = await response.json();
      
      // Validate response data
      if (!responseData.message) {
        throw new Error('Invalid response from server: missing message');
      }

      setIsTraining(false);
      setTrainingProgress(0);
      
      toast({
        title: "Training Stopped",
        description: responseData.message || "The training process has been stopped.",
        variant: "default"
      });
    } catch (error) {
      console.error('Training stop error:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        trainingState: {
          isTraining,
          progress: trainingProgress,
          config: trainingConfig
        }
      });

      toast({
        title: "Stop Training Error",
        description: error instanceof Error ? error.message : 'Failed to stop training',
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 text-white">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Button>
        </div>

        <h1 className="text-4xl font-bold mb-8 text-center text-white drop-shadow-lg">AI Model Training</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Training Files Upload */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Training Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-white/20 border-dashed rounded-lg p-6 text-center hover:border-white/40 transition-colors">
                  <Upload className="mx-auto h-12 w-12 text-white/70" />
                  <div className="space-y-2 mt-4">
                    <p className="text-sm text-white/70">
                      Upload training data files
                    </p>
                    <p className="text-xs text-white/50">
                      Supported formats: PDF, DOC, DOCX, TXT
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    multiple
                    className="hidden"
                    id="training-files-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('training-files-upload')?.click()}
                    className="mt-4 bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    Select Files
                  </Button>
                </div>

                {trainingFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-white">Selected Files:</p>
                    <ul className="space-y-2">
                      {trainingFiles.map((file, index) => (
                        <li key={index} className="text-sm text-white/70">
                          {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Training Configuration */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Training Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="epochs" className="text-white">Number of Epochs</Label>
                  <Input
                    id="epochs"
                    name="epochs"
                    type="number"
                    value={trainingConfig.epochs}
                    onChange={handleConfigChange}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batchSize" className="text-white">Batch Size</Label>
                  <Input
                    id="batchSize"
                    name="batchSize"
                    type="number"
                    value={trainingConfig.batchSize}
                    onChange={handleConfigChange}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="learningRate" className="text-white">Learning Rate</Label>
                  <Input
                    id="learningRate"
                    name="learningRate"
                    type="number"
                    step="0.0001"
                    value={trainingConfig.learningRate}
                    onChange={handleConfigChange}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validationSplit" className="text-white">Validation Split</Label>
                  <Input
                    id="validationSplit"
                    name="validationSplit"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={trainingConfig.validationSplit}
                    onChange={handleConfigChange}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Training Progress */}
        {isTraining && (
          <Card className="mt-6 bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Training Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={trainingProgress} className="h-2" />
                <p className="text-center text-white/70">
                  Training in progress... {trainingProgress}%
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Training Controls */}
        <div className="mt-6 flex justify-center space-x-4">
          {!isTraining ? (
            <Button
              className="bg-white/20 hover:bg-white/30 text-white border-white/20 shadow-lg"
              onClick={handleStartTraining}
              disabled={trainingFiles.length === 0}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Training
            </Button>
          ) : (
            <Button
              className="bg-red-500/20 hover:bg-red-500/30 text-white border-red-500/20 shadow-lg"
              onClick={handleStopTraining}
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Stop Training
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 