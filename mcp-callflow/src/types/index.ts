// Core data types for MCP Callflow application

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
  metadata?: {
    confidence: number;
    alternatives?: ToolCall[];
  };
}

export interface ToolCallResult {
  success: boolean;
  toolCall?: ToolCall;
  suggestions?: string[];
  errors?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  suggestions?: string[];
}

export interface McpResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  metadata: {
    executionTime: number;
    payloadSize: number;
    timestamp: number;
  };
}

export interface ExecutionStep {
  id: string;
  type: 'input' | 'processing' | 'mcp_call' | 'response' | 'error';
  label: string;
  status: 'pending' | 'running' | 'success' | 'error';
  data: {
    payload?: any;
    timing?: {
      startTime: number;
      endTime?: number;
      duration?: number;
    };
    error?: string;
  };
}

export interface NodeUpdate {
  status?: ExecutionStep['status'];
  data?: Partial<ExecutionStep['data']>;
  label?: string;
}

// Re-export all types from other modules
export * from './mcp';
export * from './session';
export * from './state';
export * from './errors';