# Agent Playground

**MCP 서버와의 상호작용을 시각화하고 디버깅하는 웹 기반 개발 도구**

Agent Playground는 개발자들이 MCP(Model Context Protocol) 서버와의 tool call 실행 흐름을 이해하고, 성능을 모니터링하며, 문제를 진단할 수 있도록 직관적인 인터페이스를 제공하는 웹 애플리케이션입니다.

## 🎯 핵심 기능

### 1. 자연어 → Tool Call 변환
* 자연어로 요청사항을 입력하면 자동으로 tool call JSON으로 변환
* 복잡한 JSON 문법을 직접 작성하지 않고도 MCP 도구 테스트 가능
* 고급 사용자를 위한 Monaco Editor 직접 편집 모드 제공

### 2. 실시간 실행 흐름 시각화
* React Flow를 사용한 시퀀스 다이어그램으로 실행 과정 표시
* 각 단계별 타이밍 정보, 페이로드 크기, 상태 표시
* 성공/실패 상태를 색상으로 구분하여 직관적 파악

### 3. 성능 모니터링 및 디버깅
* 실행 시간, 지연 시간, 페이로드 크기 등 성능 메트릭 추적
* 병목 지점 식별 및 성능 경고 표시
* 상세한 응답 데이터를 JSON 뷰어로 탐색

### 4. 세션 관리
* Tool call 세션 저장 및 로드 기능
* 팀과 디버깅 시나리오 공유를 위한 내보내기/가져오기
* 문제 재현을 위한 완전한 상태 복원

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                   Agent Playground                      │
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

## 🛠️ 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend Framework | React + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| 시각화 | React Flow |
| 코드 에디터 | Monaco Editor |
| JSON 뷰어 | React JSON View |
| 상태 관리 | Zustand |
| 테스팅 | Jest + React Testing Library + Playwright |

## 📁 프로젝트 구조

```
agent-playground/
├── src/
│   ├── components/
│   │   ├── InputPanel/
│   │   │   ├── NaturalLanguageInput.tsx
│   │   │   └── JsonEditor.tsx
│   │   ├── Visualization/
│   │   │   ├── FlowDiagram.tsx
│   │   │   └── NodeComponents.tsx
│   │   ├── ResponsePanel/
│   │   │   └── JsonViewer.tsx
│   │   └── Settings/
│   │       └── ConnectionConfig.tsx
│   ├── services/
│   │   ├── McpClient.ts
│   │   ├── NlpProcessor.ts
│   │   └── SessionManager.ts
│   ├── state/
│   │   ├── AppState.ts
│   │   └── FlowState.ts
│   ├── utils/
│   │   ├── JsonValidator.ts
│   │   └── PerformanceTracker.ts
│   └── types/
│       └── index.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/
    ├── requirements.md
    └── design.md
```

## 🚀 개발 로드맵

### Phase 1: 기본 인프라
- [ ] Vite + React + TypeScript 프로젝트 설정
- [ ] 기본 UI 레이아웃 구성
- [ ] MCP 클라이언트 기본 구조 구현
- [ ] 자연어 입력 패널 구현

### Phase 2: 핵심 기능
- [ ] 자연어 → Tool Call JSON 변환 엔진
- [ ] Monaco Editor 통합 및 JSON 검증
- [ ] MCP 서버 연결 및 Tool Call 실행
- [ ] React Flow 기반 시각화 구현

### Phase 3: 고급 기능
- [ ] 성능 모니터링 및 메트릭 수집
- [ ] 세션 저장/로드 기능
- [ ] 오류 처리 및 복구 메커니즘
- [ ] 반응형 UI 및 사용성 개선

## 🔧 MCP 서버 연동 예시

### 기본 MCP 서버 설정

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "uvx",
      "args": ["mcp-server-filesystem", "/path/to/allowed/directory"],
      "env": {}
    },
    "git": {
      "command": "uvx", 
      "args": ["mcp-server-git", "--repository", "/path/to/repo"],
      "env": {}
    }
  }
}
```

### Tool Call 예시

```json
{
  "name": "read_file",
  "arguments": {
    "path": "/path/to/file.txt"
  }
}
```

## 🧪 테스트 전략

### 단위 테스트
- React 컴포넌트 테스트 (React Testing Library)
- 서비스 로직 테스트 (Jest)
- 유틸리티 함수 테스트

### 통합 테스트
- MCP 클라이언트 통신 테스트
- 자연어 처리 파이프라인 테스트
- 세션 관리 테스트

### E2E 테스트
- 전체 사용자 워크플로 테스트 (Playwright)
- 성능 벤치마크 테스트
- 오류 시나리오 테스트

## 🔒 보안 고려사항

- MCP 서버 연결시 TLS/SSL 사용
- 민감한 데이터의 로컬 스토리지 암호화
- 입력 검증 및 XSS 방지
- 파일 업로드 제한 및 검증

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 🆘 지원

문제가 발생하거나 질문이 있으시면:
- GitHub Issues에 문제를 보고해주세요
- 문서를 확인해주세요: `docs/` 폴더
- 예제를 참조해주세요: `examples/` 폴더
