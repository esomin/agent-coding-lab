// Session management types

import { ExecutionStep } from './index';
import { McpServerConfig, McpResponse } from './mcp';

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