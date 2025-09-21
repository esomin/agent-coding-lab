import { useState, useEffect, useCallback, useRef } from 'react';
import { FlowVisualizationService } from '../services/FlowVisualization';
import type { ExecutionStep, NodeUpdate, FlowData } from '../types';

export const useFlowVisualization = () => {
  const serviceRef = useRef<FlowVisualizationService | null>(null);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Initialize service
  if (!serviceRef.current) {
    serviceRef.current = new FlowVisualizationService();
  }

  const service = serviceRef.current!;

  // Subscribe to service updates
  useEffect(() => {
    const unsubscribe = service.subscribe((steps) => {
      setExecutionSteps(steps);
    });

    return unsubscribe;
  }, [service]);

  const addNode = useCallback((step: ExecutionStep) => {
    service.addNode(step);
  }, [service]);

  const updateNode = useCallback((stepId: string, update: NodeUpdate) => {
    service.updateNode(stepId, update);
  }, [service]);

  const connectNodes = useCallback((fromId: string, toId: string) => {
    service.connectNodes(fromId, toId);
  }, [service]);

  const clearFlow = useCallback(() => {
    service.clearFlow();
    setSelectedNodeId(null);
  }, [service]);

  const exportFlow = useCallback((): FlowData => {
    return service.exportFlow();
  }, [service]);

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  // Helper function to create a new execution step
  const createExecutionStep = useCallback((
    id: string,
    type: ExecutionStep['type'],
    label: string,
    status: ExecutionStep['status'] = 'pending'
  ): ExecutionStep => {
    return {
      id,
      type,
      label,
      status,
      data: {
        timing: {
          startTime: Date.now(),
        },
      },
    };
  }, []);

  // Helper function to start a step (set status to running and record start time)
  const startStep = useCallback((stepId: string) => {
    updateNode(stepId, {
      status: 'running',
      data: {
        timing: {
          startTime: Date.now(),
        },
      },
    });
  }, [updateNode]);

  // Helper function to complete a step (set status to success and record end time)
  const completeStep = useCallback((stepId: string, result?: any) => {
    const steps = service.getSteps();
    const step = steps.find(s => s.id === stepId);
    const startTime = step?.data.timing?.startTime || Date.now();
    const endTime = Date.now();
    
    updateNode(stepId, {
      status: 'success',
      data: {
        payload: result,
        timing: {
          startTime,
          endTime,
          duration: endTime - startTime,
        },
      },
    });
  }, [updateNode, service]);

  // Helper function to fail a step (set status to error and record error details)
  const failStep = useCallback((stepId: string, error: string) => {
    const steps = service.getSteps();
    const step = steps.find(s => s.id === stepId);
    const startTime = step?.data.timing?.startTime || Date.now();
    const endTime = Date.now();
    
    updateNode(stepId, {
      status: 'error',
      data: {
        error,
        timing: {
          startTime,
          endTime,
          duration: endTime - startTime,
        },
      },
    });
  }, [updateNode, service]);

  return {
    // State
    executionSteps,
    selectedNodeId,
    
    // Core flow operations
    addNode,
    updateNode,
    connectNodes,
    clearFlow,
    exportFlow,
    selectNode,
    
    // Helper functions
    createExecutionStep,
    startStep,
    completeStep,
    failStep,
  };
};