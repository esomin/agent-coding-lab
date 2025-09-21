import { useState, useEffect, useCallback } from 'react';
import { McpClient } from '../services/McpClient';
import type { McpServerConfig, ConnectionStatus, ToolDefinition } from '../types';

export const useMcpConnection = () => {
  const [mcpClient] = useState(() => new McpClient());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [currentConfig, setCurrentConfig] = useState<McpServerConfig | null>(null);
  const [availableTools, setAvailableTools] = useState<ToolDefinition[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  // Monitor connection status
  useEffect(() => {
    const interval = setInterval(() => {
      const status = mcpClient.getServerStatus();
      setConnectionStatus(status);
    }, 1000);

    return () => clearInterval(interval);
  }, [mcpClient]);

  const connect = useCallback(async (config: McpServerConfig) => {
    try {
      setLastError(null);
      await mcpClient.connect(config);
      setCurrentConfig(config);
      
      // Load available tools after successful connection
      try {
        const tools = await mcpClient.listAvailableTools();
        setAvailableTools(tools);
      } catch (toolError) {
        console.warn('Failed to load tools:', toolError);
        setAvailableTools([]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setLastError(errorMessage);
      throw error;
    }
  }, [mcpClient]);

  const disconnect = useCallback(async () => {
    try {
      setLastError(null);
      await mcpClient.disconnect();
      setCurrentConfig(null);
      setAvailableTools([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Disconnect failed';
      setLastError(errorMessage);
      throw error;
    }
  }, [mcpClient]);

  const refreshTools = useCallback(async () => {
    if (connectionStatus !== 'connected') {
      throw new Error('Not connected to MCP server');
    }

    try {
      const tools = await mcpClient.listAvailableTools();
      setAvailableTools(tools);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh tools';
      setLastError(errorMessage);
      throw error;
    }
  }, [mcpClient, connectionStatus]);

  const executeToolCall = useCallback(async (toolCall: { name: string; arguments: Record<string, any> }) => {
    if (connectionStatus !== 'connected') {
      throw new Error('Not connected to MCP server');
    }

    try {
      setLastError(null);
      return await mcpClient.executeToolCall(toolCall);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Tool call failed';
      setLastError(errorMessage);
      throw error;
    }
  }, [mcpClient, connectionStatus]);

  // Auto-reconnect logic (optional, can be enabled/disabled)
  const attemptReconnection = useCallback(async (maxAttempts: number = 3, delay: number = 2000) => {
    if (!currentConfig || connectionStatus === 'connected') {
      return false;
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Reconnection attempt ${attempt}/${maxAttempts}`);
        await connect(currentConfig);
        console.log('Reconnection successful');
        return true;
      } catch (error) {
        console.warn(`Reconnection attempt ${attempt} failed:`, error);
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }

    console.error('All reconnection attempts failed');
    return false;
  }, [currentConfig, connectionStatus, connect]);

  return {
    mcpClient,
    connectionStatus,
    currentConfig,
    availableTools,
    lastError,
    connect,
    disconnect,
    refreshTools,
    executeToolCall,
    attemptReconnection
  };
};