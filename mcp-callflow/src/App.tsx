import React, { useState } from 'react';
import { MainLayout, GridContainer, GridItem, Panel, InputPanel } from './components';
import './App.css';

function App() {
  const [toolCallJson, setToolCallJson] = useState('');
  const [executionResult, setExecutionResult] = useState<string | null>(null);

  const handleToolCallGenerated = (toolCall: string) => {
    setToolCallJson(toolCall);
  };

  const handleExecute = (toolCall: string) => {
    // TODO: Implement actual MCP execution
    console.log('Executing tool call:', toolCall);
    setExecutionResult(`Tool call executed: ${toolCall}`);
  };

  return (
    <MainLayout>
      <GridContainer>
        <GridItem xs={12} md={6} lg={4}>
          <InputPanel
            onToolCallGenerated={handleToolCallGenerated}
            onExecute={handleExecute}
          />
        </GridItem>
        
        <GridItem xs={12} md={6} lg={8}>
          <Panel title="Flow Visualization">
            <p>실행 흐름 다이어그램이 여기에 표시됩니다.</p>
            {toolCallJson && (
              <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.25rem' }}>
                <strong>현재 Tool Call:</strong>
                <pre style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>{toolCallJson}</pre>
              </div>
            )}
          </Panel>
        </GridItem>
        
        <GridItem xs={12} lg={6}>
          <Panel title="Response Viewer">
            {executionResult ? (
              <div>
                <p><strong>실행 결과:</strong></p>
                <pre style={{ fontSize: '0.875rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.25rem' }}>
                  {executionResult}
                </pre>
              </div>
            ) : (
              <p>MCP 서버 응답이 여기에 표시됩니다.</p>
            )}
          </Panel>
        </GridItem>
        
        <GridItem xs={12} lg={6}>
          <Panel title="Performance Metrics">
            <p>성능 메트릭과 경고가 여기에 표시됩니다.</p>
          </Panel>
        </GridItem>
      </GridContainer>
    </MainLayout>
  );
}

export default App;
