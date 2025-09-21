# Design Document

## Overview

Agent Playground는 MCP(Model Context Protocol) 서버와의 상호작용을 시각화하고 디버깅하는 웹 애플리케이션입니다. 자연어 입력을 tool call JSON으로 변환하는 기능과 실행 흐름을 실시간으로 시각화하는 기능을 제공합니다.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   MCP Callflow                      │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Natural Lang   │  │   JSON Editor   │              │
│  │  Input Panel    │  │   (Monaco)      │              │
│  └─────────────────┘  └─────────────────┘              │
│           │                     │                       │
│           └─────────┬───────────┘                       │
│                     │                                   │
│  ┌─────────────────────────────────────────────────────┐│
│  │            Tool Call Processor                      ││
│  └─────────────────────────────────────────────────────┘│
│                     │                                   │
│  ┌─────────────────────────────────────────────────────┐│
│  │              MCP Client                             ││
│  └─────────────────────────────────────────────────────┘│
│                     │                                   │
│  ┌─────────────────────────────────────────────────────┐│
│  │         Flow Visualization (React Flow)             ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Response View  │  │  Session Mgmt   │              │
│  │  (JSON Viewer)  │  │                 │              │
│  └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   MCP Server                            │
│              (External Process)                         │
└─────────────────────────────────────────────────────────┘
```

### Component Architecture

```
Frontend (React + TypeScript)
├── Components/
│   ├── InputPanel/
│   │   ├── NaturalLanguageInput.tsx
│   │   └── JsonEditor.tsx
│   ├── Visualization/
│   │   ├── FlowDiagram.tsx
│   │   └── NodeComponents.tsx
│   ├── ResponsePanel/
│   │   └── JsonViewer.tsx
│   └── Settings/
│       └── ConnectionConfig.tsx
├── Services/
│   ├── McpClient.ts
│   ├── NlpProcessor.ts
│   └── SessionManager.ts
├── State/
│   ├── AppState.ts
│   └── FlowState.ts
└── Utils/
    ├── JsonValidator.ts
    └── PerformanceTracker.ts
```

## Components and Interfaces

### 1. Natural Language Processor

자연어 입력을 tool call JSON으로 변환하는 핵심 컴포넌트입니다.

```typescript
interface NlpProcessor {
  convertToToolCall(input: string): Promise<ToolCallResult>;
  validateInput(input: string): ValidationResult;
  getSuggestions(partialInput: string): string[];
}

interface ToolCallResult {
  success: boolean;
  toolCall?: ToolCall;
  suggestions?: string[];
  errors?: string[];
}

interface ToolCall {
  name: string;
  arguments: Record<string, any>;
  metadata?: {
    confidence: number;
    alternatives?: ToolCall[];
  };
}
```

**구현 전략:**
- 패턴 매칭 기반 파서 사용
- 일반적인 tool call 패턴 템플릿 제공
- 사용자 입력 히스토리 학습을 통한 개선

### 2. MCP Client

MCP 서버와의 통신을 담당하는 클라이언트입니다.

```typescript
interface McpClient {
  connect(config: McpServerConfig): Promise<void>;
  disconnect(): Promise<void>;
  executeToolCall(toolCall: ToolCall): Promise<McpResponse>;
  listAvailableTools(): Promise<ToolDefinition[]>;
  getServerStatus(): ConnectionStatus;
}

interface McpServerConfig {
  url: string;
  protocol: 'websocket' | 'stdio' | 'http';
  authentication?: {
    type: 'bearer' | 'basic' | 'none';
    credentials?: string;
  };
  timeout: number;
}

interface McpResponse {
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
```

### 3. Flow Visualization Engine

React Flow를 사용한 실행 흐름 시각화 엔진입니다.

```typescript
interface FlowVisualization {
  addNode(step: ExecutionStep): void;
  updateNode(stepId: string, update: NodeUpdate): void;
  connectNodes(fromId: string, toId: string): void;
  clearFlow(): void;
  exportFlow(): FlowData;
}

interface ExecutionStep {
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

interface NodeUpdate {
  status?: ExecutionStep['status'];
  data?: Partial<ExecutionStep['data']>;
  label?: string;
}
```

### 4. Session Management

세션 저장 및 복원 기능을 제공합니다.

```typescript
interface SessionManager {
  saveSession(session: PlaygroundSession): Promise<string>;
  loadSession(sessionId: string): Promise<PlaygroundSession>;
  exportSession(sessionId: string): Promise<Blob>;
  importSession(file: File): Promise<PlaygroundSession>;
  listSessions(): Promise<SessionMetadata[]>;
}

interface PlaygroundSession {
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
```

## Data Models

### Core Data Structures

```typescript
// Application State
interface AppState {
  currentSession: PlaygroundSession | null;
  mcpConnection: {
    status: 'disconnected' | 'connecting' | 'connected' | 'error';
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

// Tool Definition from MCP Server
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema?: JSONSchema;
  examples?: ToolCallExample[];
}

// Performance Tracking
interface PerformanceMetric {
  stepId: string;
  type: 'latency' | 'payload_size' | 'memory_usage';
  value: number;
  timestamp: number;
  threshold?: number;
}

interface PerformanceWarning {
  type: 'high_latency' | 'large_payload' | 'timeout';
  message: string;
  stepId: string;
  severity: 'low' | 'medium' | 'high';
}
```

## Error Handling

### Error Categories

1. **Connection Errors**
   - MCP 서버 연결 실패
   - 네트워크 타임아웃
   - 인증 실패

2. **Validation Errors**
   - 잘못된 JSON 형식
   - 스키마 검증 실패
   - 필수 필드 누락

3. **Execution Errors**
   - Tool call 실행 실패
   - MCP 서버 오류 응답
   - 예상치 못한 응답 형식

4. **UI Errors**
   - 세션 로드/저장 실패
   - 파일 가져오기/내보내기 오류
   - 브라우저 호환성 문제

### Error Handling Strategy

```typescript
interface ErrorHandler {
  handleError(error: AppError): void;
  recoverFromError(errorType: string): Promise<boolean>;
  logError(error: AppError): void;
}

interface AppError {
  type: 'connection' | 'validation' | 'execution' | 'ui';
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
  timestamp: number;
}
```

## Testing Strategy

### Unit Testing
- **Components**: React Testing Library를 사용한 컴포넌트 테스트
- **Services**: Jest를 사용한 비즈니스 로직 테스트
- **Utils**: 유틸리티 함수 단위 테스트

### Integration Testing
- **MCP Client**: Mock MCP 서버를 사용한 통신 테스트
- **Flow Visualization**: React Flow 통합 테스트
- **Session Management**: 로컬 스토리지 통합 테스트

### E2E Testing
- **User Workflows**: Playwright를 사용한 전체 사용자 시나리오 테스트
- **Performance**: 성능 메트릭 수집 및 검증
- **Error Scenarios**: 오류 상황 처리 테스트

### Test Data Strategy

```typescript
// Mock MCP Server Responses
const mockToolDefinitions: ToolDefinition[] = [
  {
    name: "file_read",
    description: "Read contents of a file",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" }
      },
      required: ["path"]
    }
  }
];

// Test Sessions
const testSessions: PlaygroundSession[] = [
  {
    id: "test-session-1",
    name: "File Operations Test",
    // ... session data
  }
];
```

## Performance Considerations

### Optimization Strategies

1. **Virtual Scrolling**: 대량의 로그나 노드 처리시 가상 스크롤링 적용
2. **Lazy Loading**: 세션 데이터와 히스토리의 지연 로딩
3. **Debouncing**: 자연어 입력 변환의 디바운싱
4. **Memoization**: React 컴포넌트 최적화

### Memory Management

```typescript
interface MemoryManager {
  cleanupOldSessions(maxAge: number): void;
  limitFlowNodes(maxNodes: number): void;
  compressLargePayloads(threshold: number): void;
}
```

### Performance Monitoring

```typescript
interface PerformanceMonitor {
  trackMetric(name: string, value: number): void;
  startTimer(name: string): () => void;
  reportMetrics(): PerformanceReport;
}

interface PerformanceReport {
  averageLatency: number;
  peakMemoryUsage: number;
  errorRate: number;
  throughput: number;
}
```

## Security Considerations

### Data Protection
- 민감한 데이터의 로컬 스토리지 암호화
- MCP 서버 연결시 TLS/SSL 사용
- 세션 데이터 내보내기시 개인정보 필터링

### Input Validation
- JSON 스키마 기반 입력 검증
- XSS 방지를 위한 출력 이스케이핑
- 파일 업로드시 타입 및 크기 제한

### Connection Security
```typescript
interface SecurityConfig {
  allowedOrigins: string[];
  maxPayloadSize: number;
  connectionTimeout: number;
  rateLimiting: {
    maxRequestsPerMinute: number;
    burstLimit: number;
  };
}
```