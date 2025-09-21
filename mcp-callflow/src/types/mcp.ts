// MCP Server related types

export interface McpServerConfig {
  url: string;
  protocol: 'websocket' | 'stdio' | 'http';
  authentication?: {
    type: 'bearer' | 'basic' | 'none';
    credentials?: string;
  };
  timeout: number;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema?: JSONSchema;
  examples?: ToolCallExample[];
}

export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  [key: string]: any;
}

export interface ToolCallExample {
  name: string;
  arguments: Record<string, any>;
  description?: string;
}