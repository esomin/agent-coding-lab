import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ExecutionStep } from '../../types';

interface ExecutionStepNodeData {
  step: ExecutionStep;
  isSelected?: boolean;
}

export const ExecutionStepNode: React.FC<NodeProps> = ({
  data,
  selected,
}) => {
  const { step, isSelected } = (data as unknown) as ExecutionStepNodeData;
  const [isHovered, setIsHovered] = React.useState(false);

  const getNodeStyle = () => {
    const baseStyle = {
      padding: '12px 16px',
      borderRadius: '8px',
      border: '2px solid',
      background: 'white',
      minWidth: '200px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      position: 'relative' as const,
    };

    const statusStyles = {
      pending: {
        borderColor: '#d1d5db',
        backgroundColor: '#f9fafb',
      },
      running: {
        borderColor: '#3b82f6',
        backgroundColor: '#dbeafe',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
      },
      success: {
        borderColor: '#10b981',
        backgroundColor: '#d1fae5',
      },
      error: {
        borderColor: '#ef4444',
        backgroundColor: '#fee2e2',
      },
    };

    const selectedStyle = selected || isSelected ? {
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)',
      transform: 'scale(1.02)',
    } : {};

    const hoverStyle = isHovered ? {
      transform: selected || isSelected ? 'scale(1.02)' : 'scale(1.01)',
      boxShadow: selected || isSelected
        ? '0 0 0 3px rgba(59, 130, 246, 0.3)'
        : '0 4px 8px rgba(0, 0, 0, 0.15)',
    } : {};

    return {
      ...baseStyle,
      ...statusStyles[step.status as keyof typeof statusStyles],
      ...selectedStyle,
      ...hoverStyle,
    };
  };

  const getStatusIcon = () => {
    switch (step.status) {
      case 'pending':
        return '⏳';
      case 'running':
        return '🔄';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⚪';
    }
  };

  const getTypeIcon = () => {
    switch (step.type) {
      case 'input':
        return '📝';
      case 'processing':
        return '⚙️';
      case 'mcp_call':
        return '🔗';
      case 'response':
        return '📤';
      case 'error':
        return '⚠️';
      default:
        return '📋';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  return (
    <div
      style={getNodeStyle()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#6b7280' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ fontSize: '16px' }}>{getTypeIcon()}</span>
        <span style={{ fontSize: '16px' }}>{getStatusIcon()}</span>
        <span style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>
          {step.label}
        </span>
      </div>

      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
        Type: {step.type}
      </div>

      {step.data.timing?.duration && (
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
          Duration: {formatDuration(step.data.timing.duration)}
        </div>
      )}

      {step.data.timing?.startTime && !step.data.timing?.endTime && step.status === 'running' && (
        <div style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '4px' }}>
          Started: {new Date(step.data.timing.startTime).toLocaleTimeString()}
        </div>
      )}

      {step.data.error && (
        <div style={{
          fontSize: '12px',
          color: '#dc2626',
          backgroundColor: '#fef2f2',
          padding: '4px 6px',
          borderRadius: '4px',
          marginTop: '4px',
          border: '1px solid #fecaca',
          maxWidth: '180px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          Error: {step.data.error}
        </div>
      )}

      {step.data.payload && step.status === 'success' && (
        <div style={{
          fontSize: '12px',
          color: '#059669',
          backgroundColor: '#ecfdf5',
          padding: '4px 6px',
          borderRadius: '4px',
          marginTop: '4px',
          border: '1px solid #a7f3d0'
        }}>
          ✓ Data available
        </div>
      )}

      {/* Hover tooltip */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
          padding: '4px 8px',
          backgroundColor: '#1f2937',
          color: 'white',
          fontSize: '11px',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          pointerEvents: 'none',
        }}>
          Click for details
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: '4px solid #1f2937',
          }} />
        </div>
      )}

      {step.status === 'running' && (
        <div style={{
          position: 'absolute',
          top: '-2px',
          left: '-2px',
          right: '-2px',
          bottom: '-2px',
          borderRadius: '8px',
          background: 'linear-gradient(45deg, transparent 30%, rgba(59, 130, 246, 0.3) 50%, transparent 70%)',
          backgroundSize: '20px 20px',
          animation: 'shimmer 2s infinite linear',
          pointerEvents: 'none',
        }} />
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#6b7280' }}
      />

      <style>{`
        @keyframes shimmer {
          0% { background-position: -20px 0; }
          100% { background-position: 20px 0; }
        }
      `}</style>
    </div>
  );
};