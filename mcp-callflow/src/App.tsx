import { useState } from 'react';
import { MainLayout, GridContainer, GridItem, Panel, InputPanel, FlowDemo, ResponsePanel } from './components';
import type { McpResponse } from './types';
import './App.css';

function App() {
  const [toolCallJson, setToolCallJson] = useState('');
  const [executionResult, setExecutionResult] = useState<McpResponse | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const handleToolCallGenerated = (toolCall: string) => {
    setToolCallJson(toolCall);
  };

  const handleExecute = async (toolCall: string) => {
    setIsExecuting(true);
    setExecutionError(null);
    setExecutionResult(null);

    try {
      // TODO: Implement actual MCP execution
      console.log('Executing tool call:', toolCall);
      
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock response for demonstration
      const mockResponse: McpResponse = {
        id: `exec-${Date.now()}`,
        result: {
          success: true,
          data: {
            message: "Tool call executed successfully",
            toolCall: JSON.parse(toolCall),
            timestamp: new Date().toISOString(),
            details: {
              processedFiles: 3,
              totalSize: "1.2MB",
              operations: ["read", "process", "write"]
            }
          }
        },
        metadata: {
          executionTime: 1450,
          payloadSize: 2048,
          timestamp: Date.now()
        }
      };
      
      setExecutionResult(mockResponse);
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsExecuting(false);
    }
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
            <FlowDemo />
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
            <ResponsePanel
              response={executionResult}
              loading={isExecuting}
              error={executionError}
              title="MCP Server Response"
            />
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
