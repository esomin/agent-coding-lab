# Agent Playground

**LLM + Tool 기반 에이전트 실행 흐름을 시각화하고 디버깅하는 실험 UI**

`agent-playground` 앱은 Claude와 MCP 서버 간의 상호작용을 실시간으로 시각화하고 디버깅할 수 있는 개발 도구입니다.

## ✅ 1. 전체 구조 설계

```
┌──────────────────────────────────────────────┐
│              agent-playground UI             │
│                                              │
│  ┌────────────┐    ┌────────────┐            │
│  │ Monaco     │ →  │ JSON View  │ ← Claude   │
│  │ tool_call  │    │ 응답 확인  │ ← MCP 서버 │
│  └────┬───────┘    └────┬───────┘            │
│       ↓                 ↓                    │
│  ┌─────────────────────────────┐             │
│  │  react-flow 시퀀스 다이어그램 │            │
│  └─────────────────────────────┘             │
│            ↑     ↑     ↑                     │
│      latency, payload, 에러 확인             │
└──────────────────────────────────────────────┘
```

## ✅ 2. 기술 스택 정리

| 기능 | 라이브러리 / 도구 |
|------|------------------|
| 시퀀스 다이어그램 | `react-flow` |
| 상태 흐름 관리 | `xstate` |
| 코드 입력 및 편집 | `monaco-editor` |
| 응답 JSON 탐색 | `react-json-view` |
| LLM 연동 | Claude Desktop + MCP |
| 요청/응답 시각화 | Custom Hook + Context |

## ✅ 3. 핵심 기능 정의

### 1. `tool_call` 시나리오 실행
* Monaco Editor에서 `tool_call` JSON 작성
* Claude Desktop 또는 LangGraph로 전송
* 결과 JSON을 MCP → Playground에 전송

### 2. 시각화 흐름
* `react-flow`를 이용해 시퀀스 흐름 표시
   * 사용자 → Claude → MCP Tool → Claude → 사용자
* 각 노드마다:
   * request/response payload 요약
   * latency(ms)
   * 상태 (`success`, `fail`, `timeout`)

### 3. 실시간 디버깅
* 요청 시 `xstate`로 실행 흐름 추적
* 실패 시 에러 로그 및 HTTP 응답 헤더 표시
* `react-json-view`로 결과값 확인 및 필터링

## ✅ 4. 개발 단계 로드맵

### 📦 Phase 1: 초기 구조
* Vite + TypeScript + Tailwind로 프로젝트 초기화
* Layout 구성 (좌측 editor, 우측 json-view, 하단 react-flow)
* tool_call JSON을 Monaco Editor로 작성
* MCP 서버와 WebSocket/HTTP로 연결

### 🔁 Phase 2: 시퀀스 다이어그램
* 요청이 실행될 때마다 react-flow에 노드/링크 추가
* latency, payload 크기 메타데이터 표시
* 실패 시 빨간 노드, 성공은 초록 노드 등 시각 구분

### 🧪 Phase 3: Claude & LangGraph 연동
* Claude tool_call 명령을 실행하고
* 해당 결과를 실시간으로 agent-playground로 브로드캐스트
* LangGraph 실행 흐름도 (xstate 기반) 시각화 추가

## ✅ 5. 폴더 구조 예시

```
agent-playground/
├── src/
│   ├── components/
│   │   ├── FlowDiagram.tsx
│   │   ├── JsonResponseView.tsx
│   │   └── ToolCallEditor.tsx
│   ├── state/
│   │   └── agentMachine.ts (xstate)
│   ├── hooks/
│   │   └── useMcpConnection.ts
│   ├── pages/
│   │   └── PlaygroundPage.tsx
│   └── App.tsx
└── public/
```

## 🔧 연동 테스트 예시

### Claude Desktop 예시 (MCP tool 등록):

```bash
claude mcp add playground \
  -e TOOL_API_KEY=abcd1234 \
  -- node ./src/mcp-server.js
```

### 응답 JSON 전송 (tool 응답 예시):

```json
{
  "tool_call_id": "xyz-123",
  "status": "success",
  "result": {
    "summary": "Server responded in 420ms.",
    "data": { ... }
  }
}
```

## 시작하기

이 프로젝트를 시작하려면:

1. 프로젝트 클론
2. 의존성 설치: `npm install`
3. 개발 서버 실행: `npm run dev`
4. MCP 서버 설정 및 Claude Desktop 연동