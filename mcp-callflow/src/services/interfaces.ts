// Service interfaces for MCP Callflow application

import type {
  ToolCall,
  ToolCallResult,
  ValidationResult,
  McpResponse,
  McpServerConfig,
  ConnectionStatus,
  ToolDefinition,
  PlaygroundSession,
  SessionMetadata,
  ExecutionStep,
  NodeUpdate,
  FlowData,
  AppError
} from '../types';

export interface NlpProcessor {
  convertToToolCall(input: string): Promise<ToolCallResult>;
  validateInput(input: string): ValidationResult;
  getSuggestions(partialInput: string): string[];
}

export interface McpClient {
  connect(config: McpServerConfig): Promise<void>;
  disconnect(): Promise<void>;
  executeToolCall(toolCall: ToolCall): Promise<McpResponse>;
  listAvailableTools(): Promise<ToolDefinition[]>;
  getServerStatus(): ConnectionStatus;
}

export interface SessionManager {
  saveSession(session: PlaygroundSession): Promise<string>;
  loadSession(sessionId: string): Promise<PlaygroundSession>;
  exportSession(sessionId: string): Promise<Blob>;
  importSession(file: File): Promise<PlaygroundSession>;
  listSessions(): Promise<SessionMetadata[]>;
  deleteSession(sessionId: string): Promise<void>;
}

export interface FlowVisualization {
  addNode(step: ExecutionStep): void;
  updateNode(stepId: string, update: NodeUpdate): void;
  connectNodes(fromId: string, toId: string): void;
  clearFlow(): void;
  exportFlow(): FlowData;
}

export interface ErrorHandler {
  handleError(error: AppError): void;
  recoverFromError(errorType: string): Promise<boolean>;
  logError(error: AppError): void;
}

export interface PerformanceMonitor {
  trackMetric(name: string, value: number): void;
  startTimer(name: string): () => void;
  reportMetrics(): PerformanceReport;
}

export interface PerformanceReport {
  averageLatency: number;
  peakMemoryUsage: number;
  errorRate: number;
  throughput: number;
}

export interface MemoryManager {
  cleanupOldSessions(maxAge: number): void;
  limitFlowNodes(maxNodes: number): void;
  compressLargePayloads(threshold: number): void;
}