'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

interface ModelMetrics {
  final_accuracy: number;
  final_loss: number;
  training_duration: number;
}

interface TrainingSession {
  id: number;
  start_time: string;
  end_time: string;
  user: {
    username: string;
  };
}

interface Model {
  id: number;
  version: string;
  deployed_at: string;
  is_active: boolean;
  metrics: ModelMetrics;
  training_session: TrainingSession;
}

export default function ModelComparison() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await api.get('/admin/model-comparison');
        setModels(response.data);
      } catch (err) {
        setError('Failed to fetch model comparison data');
        console.error('Error fetching model comparison:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  if (loading) {
    return <div>Loading model comparison data...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Model Performance Comparison</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Deployed At</TableHead>
              <TableHead>Accuracy</TableHead>
              <TableHead>Loss</TableHead>
              <TableHead>Training Duration</TableHead>
              <TableHead>Trained By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model) => (
              <TableRow key={model.id}>
                <TableCell>{model.version}</TableCell>
                <TableCell>
                  <Badge variant={model.is_active ? 'success' : 'secondary'}>
                    {model.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(model.deployed_at), 'MMM d, yyyy HH:mm')}
                </TableCell>
                <TableCell>{(model.metrics.final_accuracy * 100).toFixed(2)}%</TableCell>
                <TableCell>{model.metrics.final_loss.toFixed(4)}</TableCell>
                <TableCell>{model.metrics.training_duration.toFixed(2)} min</TableCell>
                <TableCell>{model.training_session.user.username}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 