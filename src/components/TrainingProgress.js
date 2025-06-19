import React, { useEffect, useState } from 'react';
import { Progress, Card, Typography, Space, Alert } from 'antd';
import { Line } from '@ant-design/charts';

const { Title, Text } = Typography;

const TrainingProgress = ({ sessionId }) => {
    const [status, setStatus] = useState(null);
    const [error, setError] = useState(null);
    const [ws, setWs] = useState(null);

    useEffect(() => {
        // Initialize WebSocket connection
        const websocket = new WebSocket(`ws://74.208.7.169:8000/api/v1/admin/ws/training-progress/${sessionId}`);
        
        websocket.onopen = () => {
            console.log('WebSocket connected');
        };
        
        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setStatus(data);
            
            // If training is complete, show visualization
            if (!data.is_training && data.progress === 100 && data.training_visualization) {
                // Handle visualization display
            }
        };
        
        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            setError('Failed to connect to training progress updates');
        };
        
        websocket.onclose = () => {
            console.log('WebSocket disconnected');
        };
        
        setWs(websocket);
        
        // Cleanup on unmount
        return () => {
            if (websocket) {
                websocket.close();
            }
        };
    }, [sessionId]);

    if (error) {
        return <Alert type="error" message={error} />;
    }

    if (!status) {
        return <Progress percent={0} status="active" />;
    }

    return (
        <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
                <Title level={4}>Training Progress</Title>
                
                <Progress 
                    percent={status.progress} 
                    status={status.is_training ? "active" : "success"}
                    format={percent => `${percent}%`}
                />
                
                <Text>
                    Epoch: {status.current_epoch}/{status.total_epochs}
                </Text>
                
                <Text>
                    Batch: {status.current_batch}/{status.total_batches}
                </Text>
                
                {status.metrics && (
                    <Card size="small" title="Current Metrics">
                        <Space direction="vertical">
                            <Text>Training Loss: {status.metrics.loss[status.metrics.loss.length - 1]?.toFixed(4)}</Text>
                            <Text>Training Accuracy: {(status.metrics.accuracy[status.metrics.accuracy.length - 1] * 100).toFixed(2)}%</Text>
                            <Text>Validation Loss: {status.metrics.validation_loss[status.metrics.validation_loss.length - 1]?.toFixed(4)}</Text>
                            <Text>Validation Accuracy: {(status.metrics.validation_accuracy[status.metrics.validation_accuracy.length - 1] * 100).toFixed(2)}%</Text>
                        </Space>
                    </Card>
                )}
                
                {status.training_visualization && (
                    <Card size="small" title="Training Visualization">
                        <img 
                            src={status.training_visualization} 
                            alt="Training Metrics" 
                            style={{ width: '100%' }}
                        />
                    </Card>
                )}
            </Space>
        </Card>
    );
};

export default TrainingProgress; 
