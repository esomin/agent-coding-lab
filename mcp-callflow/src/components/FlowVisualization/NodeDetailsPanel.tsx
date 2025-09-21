import React from 'react';
import type { ExecutionStep } from '../../types';

interface NodeDetailsPanelProps {
  step: ExecutionStep | null;
  onClose: () => void;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  step,
  onClose,
}) => {
  if (!step) return null;

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const getStatusColor = (status: ExecutionStep['status']) => {
    switch (status) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'running':
        return '#3b82f6';
      case 'pending':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: ExecutionStep['status']) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'running':
        return '🔄';
      case 'pending':
        return '⏳';
      default:
        return '⚪';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '80vh',
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>{getStatusIcon(step.status)}</span>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
            {step.label}
          </h3>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            color: '#6b7280',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
        {/* Basic Info */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(step.status),
            }} />
            <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
              {step.status}
            </span>
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
            <strong>Type:</strong> {step.type}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
            <strong>ID:</strong> {step.id}
          </div>
        </div>

        {/* Timing Information */}
        {step.data.timing && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
              Timing Information
            </h4>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {step.data.timing.startTime && (
                <div style={{ marginBottom: '4px' }}>
                  <strong>Started:</strong> {formatTimestamp(step.data.timing.startTime)}
                </div>
              )}
              {step.data.timing.endTime && (
                <div style={{ marginBottom: '4px' }}>
                  <strong>Ended:</strong> {formatTimestamp(step.data.timing.endTime)}
                </div>
              )}
              <div style={{ marginBottom: '4px' }}>
                <strong>Duration:</strong> {formatDuration(step.data.timing.duration)}
              </div>
            </div>
          </div>
        )}

        {/* Error Information */}
        {step.data.error && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>
              Error Details
            </h4>
            <div style={{
              padding: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#dc2626',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
            }}>
              {step.data.error}
            </div>
          </div>
        )}

        {/* Payload Information */}
        {step.data.payload && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
              Payload Data
            </h4>
            <div style={{
              padding: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: 'monospace',
              overflow: 'auto',
              maxHeight: '200px',
            }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(step.data.payload, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Raw Step Data */}
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
            Raw Step Data
          </h4>
          <div style={{
            padding: '12px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '11px',
            fontFamily: 'monospace',
            overflow: 'auto',
            maxHeight: '300px',
          }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(step, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};