// Session management types

import type { ExecutionStep, McpResponse } from './index';
import type { McpServerConfig } from './mcp';

export interface PlaygroundSession {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  data: {
    input: {
      naturalLanguage?: string;
      jsonToolCall?: string;
      mode: 'natural' | 'json';
    };
    mcpConfig: McpServerConfig;
    executionFlow: ExecutionStep[];
    response?: McpResponse;
  };
}

export interface SessionMetadata {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  size: number;
}

export interface SessionData {
  sessions: PlaygroundSession[];
  currentSessionId: string | null;
}