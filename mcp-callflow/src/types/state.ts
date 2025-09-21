// Application state types

import { PlaygroundSession } from './session';
import { McpServerConfig, ConnectionStatus, ToolDefinition } from './mcp';

export interface AppState {
  currentSession: PlaygroundSession | null;
  mcpConnection: {
    status: ConnectionStatus;
    config: McpServerConfig | null;
    availableTools: ToolDefinition[];
  };
  ui: {
    inputMode: 'natural' | 'json';
    showAdvancedOptions: boolean;
    selectedNode: string | null;
  };
  performance: {
    metrics: PerformanceMetric[];
    warnings: PerformanceWarning[];
  };
}

export interface PerformanceMetric {
  stepId: string;
  type: 'latency' | 'payload_size' | 'memory_usage';
  value: number;
  timestamp: number;
  threshold?: number;
}

export interface PerformanceWarning {
  type: 'high_latency' | 'large_payload' | 'timeout';
  message: string;
  stepId: string;
  severity: 'low' | 'medium' | 'high';
}

export interface FlowData {
  nodes: any[];
  edges: any[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}