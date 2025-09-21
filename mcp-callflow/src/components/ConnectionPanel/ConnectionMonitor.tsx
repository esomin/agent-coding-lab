import React, { useState, useEffect } from 'react';
import type { ConnectionStatus, ToolDefinition } from '../../types';

interface ConnectionMonitorProps {
  connectionStatus: ConnectionStatus;
  availableTools: ToolDefinition[];
  onRefreshTools: () => Promise<void>;
  lastError?: string;
}

export const ConnectionMonitor: React.FC<ConnectionMonitorProps> = ({
  connectionStatus,
  availableTools,
  onRefreshTools,
  lastError
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleRefreshTools = async () => {
    if (connectionStatus !== 'connected') return;

    setIsRefreshing(true);
    try {
      await onRefreshTools();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh tools:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = (status: ConnectionStatus): string => {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const formatLastRefresh = (date: Date): string => {
    return date.toLocaleTimeString();
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-medium">Connection Monitor</h4>
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon(connectionStatus)}</span>
          <span className="text-sm text-gray-600">
            {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
          </span>
        </div>
      </div>

      {lastError && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <strong>Last Error:</strong> {lastError}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Available Tools:</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {availableTools.length} tool{availableTools.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleRefreshTools}
              disabled={connectionStatus !== 'connected' || isRefreshing}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {lastRefresh && (
          <div className="text-xs text-gray-500">
            Last refreshed: {formatLastRefresh(lastRefresh)}
          </div>
        )}

        {availableTools.length > 0 && (
          <div className="max-h-32 overflow-y-auto">
            <div className="space-y-1">
              {availableTools.map((tool, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <div className="text-sm font-medium">{tool.name}</div>
                    <div className="text-xs text-gray-500">{tool.description}</div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {tool.inputSchema.required?.length || 0} required params
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {connectionStatus === 'connected' && availableTools.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-2">
            No tools available or not yet loaded
          </div>
        )}
      </div>
    </div>
  );
};