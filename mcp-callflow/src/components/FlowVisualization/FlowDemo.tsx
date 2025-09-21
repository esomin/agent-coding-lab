import React, { useEffect } from 'react';
import { FlowDiagram } from './FlowDiagram';
import { useFlowVisualization } from '../../hooks/useFlowVisualization';

export const FlowDemo: React.FC = () => {
  const {
    executionSteps,
    selectedNodeId,
    addNode,
    selectNode,
    createExecutionStep,
    startStep,
    completeStep,
    failStep,
    clearFlow,
  } = useFlowVisualization();

  // Demo: Create sample execution flow
  useEffect(() => {
    const demoFlow = async () => {
      // Clear any existing flow
      clearFlow();

      // Create demo steps
      const inputStep = createExecutionStep('input-1', 'input', 'User Input', 'success');
      const processingStep = createExecutionStep('processing-1', 'processing', 'Processing Request', 'pending');
      const mcpCallStep = createExecutionStep('mcp-call-1', 'mcp_call', 'MCP Tool Call', 'pending');
      const responseStep = createExecutionStep('response-1', 'response', 'Response', 'pending');

      // Add nodes to flow
      addNode(inputStep);
      addNode(processingStep);
      addNode(mcpCallStep);
      addNode(responseStep);

      // Simulate execution flow
      setTimeout(() => startStep('processing-1'), 1000);
      setTimeout(() => completeStep('processing-1', { parsed: true }), 2000);
      setTimeout(() => startStep('mcp-call-1'), 2500);
      setTimeout(() => completeStep('mcp-call-1', { result: 'Tool executed successfully' }), 4000);
      setTimeout(() => startStep('response-1'), 4500);
      setTimeout(() => completeStep('response-1', { status: 'completed' }), 5500);
    };

    demoFlow();
  }, [addNode, createExecutionStep, startStep, completeStep, clearFlow]);

  const handleNodeClick = (nodeId: string | null) => {
    if (nodeId) {
      selectNode(selectedNodeId === nodeId ? null : nodeId);
    } else {
      selectNode(null);
    }
  };

  const handleAddErrorStep = () => {
    const errorStep = createExecutionStep(
      `error-${Date.now()}`, 
      'error', 
      'Error Step', 
      'pending'
    );
    addNode(errorStep);
    setTimeout(() => startStep(errorStep.id), 500);
    setTimeout(() => failStep(errorStep.id, 'Simulated network timeout error'), 1500);
  };

  const handleAddCustomStep = () => {
    const customStep = createExecutionStep(
      `custom-${Date.now()}`, 
      'mcp_call', 
      'Custom Tool Call', 
      'pending'
    );
    addNode(customStep);
    setTimeout(() => startStep(customStep.id), 500);
    setTimeout(() => completeStep(customStep.id, { 
      result: 'Custom operation completed',
      data: { processed: true, items: 42 }
    }), 2000);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2>Flow Visualization Demo</h2>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={clearFlow}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Clear Flow
          </button>
          <button
            onClick={handleAddErrorStep}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Add Error Step
          </button>
          <button
            onClick={handleAddCustomStep}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Add Custom Step
          </button>
        </div>
      </div>

      <FlowDiagram
        executionSteps={executionSteps}
        selectedNodeId={selectedNodeId}
        onNodeClick={handleNodeClick}
      />

      {selectedNodeId && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          border: '1px solid #d1d5db',
        }}>
          <h3>Selected Node Details</h3>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(
              executionSteps.find(step => step.id === selectedNodeId),
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
};