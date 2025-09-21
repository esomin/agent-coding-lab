import React, { useState, useEffect } from 'react';
import type { McpServerConfig, ConnectionStatus } from '../../types';

interface McpConnectionSettingsProps {
  onConnect: (config: McpServerConfig) => Promise<void>;
  onDisconnect: () => Promise<void>;
  connectionStatus: ConnectionStatus;
  currentConfig?: McpServerConfig;
}

export const McpConnectionSettings: React.FC<McpConnectionSettingsProps> = ({
  onConnect,
  onDisconnect,
  connectionStatus,
  currentConfig
}) => {
  const [config, setConfig] = useState<McpServerConfig>({
    url: currentConfig?.url || '',
    protocol: currentConfig?.protocol || 'websocket',
    timeout: currentConfig?.timeout || 30000,
    authentication: currentConfig?.authentication || { type: 'none' }
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig);
    }
  }, [currentConfig]);

  const handleConnect = async () => {
    if (!config.url.trim()) {
      setError('URL is required');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await onConnect(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await onDisconnect();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed');
    }
  };

  const getStatusColor = (status: ConnectionStatus): string => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: ConnectionStatus): string => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">MCP Server Connection</h3>
        <div className={`font-medium ${getStatusColor(connectionStatus)}`}>
          {getStatusText(connectionStatus)}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Server URL
          </label>
          <input
            type="text"
            value={config.url}
            onChange={(e) => setConfig({ ...config, url: e.target.value })}
            placeholder="ws://localhost:8080 or http://localhost:8080"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={connectionStatus === 'connected' || isConnecting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Protocol
          </label>
          <select
            value={config.protocol}
            onChange={(e) => setConfig({ ...config, protocol: e.target.value as 'websocket' | 'http' | 'stdio' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={connectionStatus === 'connected' || isConnecting}
          >
            <option value="websocket">WebSocket</option>
            <option value="http">HTTP</option>
            <option value="stdio">STDIO</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timeout (ms)
          </label>
          <input
            type="number"
            value={config.timeout}
            onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) || 30000 })}
            min="1000"
            max="120000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={connectionStatus === 'connected' || isConnecting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Authentication
          </label>
          <select
            value={config.authentication?.type || 'none'}
            onChange={(e) => setConfig({ 
              ...config, 
              authentication: { 
                type: e.target.value as 'none' | 'bearer' | 'basic',
                credentials: e.target.value === 'none' ? undefined : config.authentication?.credentials
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            disabled={connectionStatus === 'connected' || isConnecting}
          >
            <option value="none">None</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
          </select>

          {config.authentication?.type !== 'none' && (
            <input
              type="password"
              value={config.authentication?.credentials || ''}
              onChange={(e) => setConfig({ 
                ...config, 
                authentication: { 
                  ...config.authentication!, 
                  credentials: e.target.value 
                }
              })}
              placeholder={config.authentication?.type === 'bearer' ? 'Bearer token' : 'username:password'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={connectionStatus === 'connected' || isConnecting}
            />
          )}
        </div>

        <div className="flex gap-2">
          {connectionStatus === 'connected' ? (
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting || !config.url.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};