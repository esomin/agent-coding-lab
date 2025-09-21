import React, { useState, useMemo } from 'react';
import JsonViewer from './JsonViewer';
import type { McpResponse } from '../../types';

interface ResponsePanelProps {
  response: McpResponse | null;
  loading?: boolean;
  error?: string | null;
  title?: string;
}

interface ResponseTab {
  id: string;
  label: string;
  content: any;
}

const ResponsePanel: React.FC<ResponsePanelProps> = ({
  response,
  loading = false,
  error = null,
  title = "MCP Response"
}) => {
  const [activeTab, setActiveTab] = useState<string>('result');
  const [filterType, setFilterType] = useState<'all' | 'errors' | 'success'>('all');

  // Prepare tabs based on response content
  const tabs = useMemo((): ResponseTab[] => {
    if (!response) return [];

    const tabList: ResponseTab[] = [];

    // Result tab
    if (response.result !== undefined) {
      tabList.push({
        id: 'result',
        label: 'Result',
        content: response.result
      });
    }

    // Error tab
    if (response.error) {
      tabList.push({
        id: 'error',
        label: 'Error',
        content: response.error
      });
    }

    // Metadata tab
    if (response.metadata) {
      tabList.push({
        id: 'metadata',
        label: 'Metadata',
        content: response.metadata
      });
    }

    // Full response tab
    tabList.push({
      id: 'full',
      label: 'Full Response',
      content: response
    });

    return tabList;
  }, [response]);

  // Get performance indicators
  const performanceIndicators = useMemo(() => {
    if (!response?.metadata) return null;

    const { executionTime, payloadSize } = response.metadata;
    const indicators = [];

    // Execution time indicator
    if (executionTime > 5000) {
      indicators.push({
        type: 'warning',
        message: `High latency: ${executionTime}ms`,
        severity: 'high' as const
      });
    } else if (executionTime > 2000) {
      indicators.push({
        type: 'warning',
        message: `Moderate latency: ${executionTime}ms`,
        severity: 'medium' as const
      });
    }

    // Payload size indicator
    if (payloadSize > 1024 * 1024) {
      indicators.push({
        type: 'warning',
        message: `Large payload: ${(payloadSize / 1024 / 1024).toFixed(2)}MB`,
        severity: 'high' as const
      });
    }

    return indicators.length > 0 ? indicators : null;
  }, [response]);

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get status color
  const getStatusColor = () => {
    if (error) return '#ef4444';
    if (response?.error) return '#f59e0b';
    if (response?.result !== undefined) return '#10b981';
    return '#6b7280';
  };

  if (loading) {
    return (
      <div className="response-panel-loading" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        color: '#6b7280'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '1rem',
            height: '1rem',
            border: '2px solid #e5e7eb',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Executing tool call...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="response-panel-error" style={{
        padding: '1rem',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '0.5rem',
        color: '#dc2626'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Execution Error</h4>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>{error}</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="response-panel-empty" style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#6b7280',
        fontStyle: 'italic'
      }}>
        Execute a tool call to see the response here
      </div>
    );
  }

  return (
    <div className="response-panel">
      {/* Header with status and performance indicators */}
      <div className="response-panel-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{title}</h3>
          <div style={{
            width: '0.5rem',
            height: '0.5rem',
            borderRadius: '50%',
            backgroundColor: getStatusColor()
          }} />
        </div>
        
        {response.metadata && (
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            {formatTimestamp(response.metadata.timestamp)} • 
            {response.metadata.executionTime}ms • 
            {(response.metadata.payloadSize / 1024).toFixed(1)}KB
          </div>
        )}
      </div>

      {/* Performance warnings */}
      {performanceIndicators && (
        <div className="performance-indicators" style={{ marginBottom: '1rem' }}>
          {performanceIndicators.map((indicator, index) => (
            <div
              key={index}
              style={{
                padding: '0.5rem',
                backgroundColor: indicator.severity === 'high' ? '#fef2f2' : '#fffbeb',
                border: `1px solid ${indicator.severity === 'high' ? '#fecaca' : '#fed7aa'}`,
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                color: indicator.severity === 'high' ? '#dc2626' : '#d97706',
                marginBottom: '0.25rem'
              }}
            >
              ⚠️ {indicator.message}
            </div>
          ))}
        </div>
      )}

      {/* Filter controls */}
      <div className="response-panel-filters" style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as typeof filterType)}
          style={{
            padding: '0.25rem 0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.25rem',
            fontSize: '0.75rem'
          }}
        >
          <option value="all">All Data</option>
          <option value="errors">Errors Only</option>
          <option value="success">Success Only</option>
        </select>
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="response-panel-tabs" style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '1rem'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                background: activeTab === tab.id ? '#f3f4f6' : 'transparent',
                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: activeTab === tab.id ? '600' : '400'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="response-panel-content">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            style={{ display: activeTab === tab.id ? 'block' : 'none' }}
          >
            <JsonViewer
              data={tab.content}
              searchable={true}
              collapsible={false}
              maxHeight={500}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponsePanel;