import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ConnectionMode,
} from '@xyflow/react';
import type { Node, Edge, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ExecutionStepNode } from './ExecutionStepNode';
import { NodeDetailsPanel } from './NodeDetailsPanel';
import type { ExecutionStep, FlowData } from '../../types';

interface FlowDiagramProps {
  executionSteps: ExecutionStep[];
  selectedNodeId?: string | null;
  onNodeClick?: (nodeId: string | null) => void;
  onFlowChange?: (flowData: FlowData) => void;
}

const nodeTypes = {
  executionStep: ExecutionStepNode,
} as const;

export const FlowDiagram: React.FC<FlowDiagramProps> = ({
  executionSteps,
  selectedNodeId,
  onNodeClick,
  onFlowChange,
}) => {
  const [showDetailsPanel, setShowDetailsPanel] = React.useState(false);
  const selectedStep = selectedNodeId ? executionSteps.find(step => step.id === selectedNodeId) : null;
  
  // Convert execution steps to React Flow nodes
  const nodes = useMemo(() => {
    return executionSteps.map((step, index) => ({
      id: step.id,
      type: 'executionStep',
      position: { x: 100, y: index * 120 + 50 },
      data: {
        step,
        isSelected: selectedNodeId === step.id,
      },
      selected: selectedNodeId === step.id,
    }));
  }, [executionSteps, selectedNodeId]);

  // Create edges between consecutive steps
  const edges = useMemo(() => {
    const edgeList: Edge[] = [];
    for (let i = 0; i < executionSteps.length - 1; i++) {
      edgeList.push({
        id: `${executionSteps[i].id}-${executionSteps[i + 1].id}`,
        source: executionSteps[i].id,
        target: executionSteps[i + 1].id,
        type: 'smoothstep',
        animated: executionSteps[i + 1].status === 'running',
      });
    }
    return edgeList;
  }, [executionSteps]);

  const onConnect = useCallback(
    (params: Connection) => {
      // For now, we don't allow manual connections in the demo
      console.log('Connection attempted:', params);
    },
    []
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        onNodeClick(node.id);
      }
      setShowDetailsPanel(true);
    },
    [onNodeClick]
  );

  const handleCloseDetailsPanel = useCallback(() => {
    setShowDetailsPanel(false);
    if (onNodeClick) {
      onNodeClick(null);
    }
  }, [onNodeClick]);

  // Notify parent of flow changes when needed
  React.useEffect(() => {
    if (onFlowChange) {
      const viewport = { x: 0, y: 0, zoom: 1 };
      onFlowChange({
        nodes,
        edges,
        viewport,
      });
    }
  }, [nodes, edges, onFlowChange]);

  return (
    <>
      <div className="flow-diagram" style={{ width: '100%', height: '600px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Strict}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <MiniMap
            nodeStrokeColor={(n) => {
              const step = n.data?.step as ExecutionStep;
              if (!step) return '#999';
              
              switch (step.status) {
                case 'success':
                  return '#10b981';
                case 'error':
                  return '#ef4444';
                case 'running':
                  return '#3b82f6';
                default:
                  return '#6b7280';
              }
            }}
            nodeColor={(n) => {
              const step = n.data?.step as ExecutionStep;
              if (!step) return '#f3f4f6';
              
              switch (step.status) {
                case 'success':
                  return '#d1fae5';
                case 'error':
                  return '#fee2e2';
                case 'running':
                  return '#dbeafe';
                default:
                  return '#f9fafb';
              }
            }}
            nodeBorderRadius={8}
          />
        </ReactFlow>
      </div>

      {/* Node Details Panel */}
      {showDetailsPanel && selectedStep && (
        <NodeDetailsPanel
          step={selectedStep}
          onClose={handleCloseDetailsPanel}
        />
      )}
    </>
  );
};