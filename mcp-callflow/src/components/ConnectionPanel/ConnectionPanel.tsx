import React from 'react';
import { McpConnectionSettings } from './McpConnectionSettings';
import { ConnectionMonitor } from './ConnectionMonitor';
import { useMcpConnection } from '../../hooks/useMcpConnection';

export const ConnectionPanel: React.FC = () => {
  const {
    connectionStatus,
    currentConfig,
    availableTools,
    lastError,
    connect,
    disconnect,
    refreshTools
  } = useMcpConnection();

  return (
    <div className="space-y-4">
      <McpConnectionSettings
        onConnect={connect}
        onDisconnect={disconnect}
        connectionStatus={connectionStatus}
        currentConfig={currentConfig || undefined}
      />
      
      <ConnectionMonitor
        connectionStatus={connectionStatus}
        availableTools={availableTools}
        onRefreshTools={refreshTools}
        lastError={lastError || undefined}
      />
    </div>
  );
};