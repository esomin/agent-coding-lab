// MCP Client service implementation

import type { McpClient as IMcpClient } from './interfaces';
import type {   
  ToolCall, 
  McpResponse, 
  McpServerConfig, 
  ConnectionStatus, 
  ToolDefinition 
} from '../types';

export class McpClient implements IMcpClient {
  private config: McpServerConfig | null = null;
  private status: ConnectionStatus = 'disconnected';
  private websocket: WebSocket | null = null;
  private requestId = 0;
  private pendingRequests = new Map<string, {
    resolve: (value: McpResponse) => void;
    reject: (error: Error) => void;
    startTime: number;
  }>();

  async connect(config: McpServerConfig): Promise<void> {
    this.config = config;
    this.status = 'connecting';

    try {
      if (config.protocol === 'websocket') {
        await this.connectWebSocket(config);
      } else if (config.protocol === 'http') {
        await this.connectHttp(config);
      } else {
        throw new Error(`Unsupported protocol: ${config.protocol}`);
      }
      
      this.status = 'connected';
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    // Reject all pending requests
    for (const [id, request] of this.pendingRequests) {
      request.reject(new Error('Connection closed'));
    }
    this.pendingRequests.clear();
    
    this.status = 'disconnected';
    this.config = null;
  }

  async executeToolCall(toolCall: ToolCall): Promise<McpResponse> {
    if (this.status !== 'connected' || !this.config) {
      throw new Error('Not connected to MCP server');
    }

    const requestId = (++this.requestId).toString();
    const startTime = Date.now();

    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/call',
      params: {
        name: toolCall.name,
        arguments: toolCall.arguments
      }
    };

    if (this.config.protocol === 'websocket' && this.websocket) {
      return this.executeWebSocketRequest(request, startTime);
    } else if (this.config.protocol === 'http') {
      return this.executeHttpRequest(request, startTime);
    } else {
      throw new Error(`Unsupported protocol: ${this.config.protocol}`);
    }
  }

  async listAvailableTools(): Promise<ToolDefinition[]> {
    if (this.status !== 'connected') {
      throw new Error('Not connected to MCP server');
    }

    const requestId = (++this.requestId).toString();
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/list'
    };

    try {
      let response: McpResponse;
      
      if (this.config?.protocol === 'websocket' && this.websocket) {
        response = await this.executeWebSocketRequest(request, Date.now());
      } else if (this.config?.protocol === 'http') {
        response = await this.executeHttpRequest(request, Date.now());
      } else {
        throw new Error(`Unsupported protocol: ${this.config?.protocol}`);
      }

      if (response.error) {
        throw new Error(`Failed to list tools: ${response.error.message}`);
      }

      return response.result?.tools || [];
    } catch (error) {
      // Fallback to mock data if server doesn't support tools/list
      console.warn('Failed to fetch tools from server, using fallback:', error);
      return [
        {
          name: 'file_read',
          description: 'Read contents of a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string' }
            },
            required: ['path']
          }
        },
        {
          name: 'file_write',
          description: 'Write content to a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              content: { type: 'string' }
            },
            required: ['path', 'content']
          }
        },
        {
          name: 'search',
          description: 'Search for content',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string' }
            },
            required: ['query']
          }
        }
      ];
    }
  }

  getServerStatus(): ConnectionStatus {
    return this.status;
  }

  private async connectWebSocket(config: McpServerConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(config.url);
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, config.timeout);

      ws.onopen = () => {
        clearTimeout(timeout);
        this.websocket = ws;
        this.setupWebSocketHandlers();
        resolve();
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        reject(new Error('WebSocket connection failed'));
      };
    });
  }

  private async connectHttp(config: McpServerConfig): Promise<void> {
    // Test connection with a simple request
    try {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.authentication?.type === 'bearer' && {
            'Authorization': `Bearer ${config.authentication.credentials}`
          })
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'test',
          method: 'ping'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Failed to connect via HTTP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private setupWebSocketHandlers(): void {
    if (!this.websocket) return;

    this.websocket.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);
        const pending = this.pendingRequests.get(response.id);
        
        if (pending) {
          this.pendingRequests.delete(response.id);
          const executionTime = Date.now() - pending.startTime;
          
          const mcpResponse: McpResponse = {
            id: response.id,
            result: response.result,
            error: response.error,
            metadata: {
              executionTime,
              payloadSize: event.data.length,
              timestamp: Date.now()
            }
          };
          
          pending.resolve(mcpResponse);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.websocket.onclose = () => {
      this.status = 'disconnected';
      // Reject all pending requests
      for (const [id, request] of this.pendingRequests) {
        request.reject(new Error('WebSocket connection closed'));
      }
      this.pendingRequests.clear();
    };

    this.websocket.onerror = () => {
      this.status = 'error';
    };
  }

  private async executeWebSocketRequest(request: any, startTime: number): Promise<McpResponse> {
    return new Promise((resolve, reject) => {
      if (!this.websocket) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.pendingRequests.set(request.id, { resolve, reject, startTime });
      
      // Set timeout for the request
      setTimeout(() => {
        if (this.pendingRequests.has(request.id)) {
          this.pendingRequests.delete(request.id);
          reject(new Error('Request timeout'));
        }
      }, this.config?.timeout || 30000);

      this.websocket.send(JSON.stringify(request));
    });
  }

  private async executeHttpRequest(request: any, startTime: number): Promise<McpResponse> {
    if (!this.config) {
      throw new Error('No configuration available');
    }

    try {
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.authentication?.type === 'bearer' && {
            'Authorization': `Bearer ${this.config.authentication.credentials}`
          })
        },
        body: JSON.stringify(request)
      });

      const responseText = await response.text();
      const responseData = JSON.parse(responseText);
      const executionTime = Date.now() - startTime;

      return {
        id: request.id,
        result: responseData.result,
        error: responseData.error,
        metadata: {
          executionTime,
          payloadSize: responseText.length,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      throw new Error(`HTTP request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}