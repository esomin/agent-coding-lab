import type { ExecutionStep, NodeUpdate, FlowData } from '../types';

export interface FlowVisualization {
  addNode(step: ExecutionStep): void;
  updateNode(stepId: string, update: NodeUpdate): void;
  connectNodes(fromId: string, toId: string): void;
  clearFlow(): void;
  exportFlow(): FlowData;
}

export class FlowVisualizationService implements FlowVisualization {
  private steps: ExecutionStep[] = [];
  private connections: Array<{ from: string; to: string }> = [];
  private listeners: Array<(steps: ExecutionStep[]) => void> = [];

  addNode(step: ExecutionStep): void {
    this.steps.push(step);
    this.notifyListeners();
  }

  updateNode(stepId: string, update: NodeUpdate): void {
    const stepIndex = this.steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) return;

    const step = this.steps[stepIndex];
    this.steps[stepIndex] = {
      ...step,
      status: update.status ?? step.status,
      label: update.label ?? step.label,
      data: {
        ...step.data,
        ...update.data,
      },
    };

    this.notifyListeners();
  }

  connectNodes(fromId: string, toId: string): void {
    const existingConnection = this.connections.find(
      conn => conn.from === fromId && conn.to === toId
    );
    
    if (!existingConnection) {
      this.connections.push({ from: fromId, to: toId });
      this.notifyListeners();
    }
  }

  clearFlow(): void {
    this.steps = [];
    this.connections = [];
    this.notifyListeners();
  }

  exportFlow(): FlowData {
    const nodes = this.steps.map((step, index) => ({
      id: step.id,
      type: 'executionStep',
      position: { x: 100, y: index * 120 + 50 },
      data: { step },
    }));

    const edges = this.connections.map(conn => ({
      id: `${conn.from}-${conn.to}`,
      source: conn.from,
      target: conn.to,
      type: 'smoothstep',
    }));

    return {
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 1 },
    };
  }

  getSteps(): ExecutionStep[] {
    return [...this.steps];
  }

  getConnections(): Array<{ from: string; to: string }> {
    return [...this.connections];
  }

  subscribe(listener: (steps: ExecutionStep[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.steps]));
  }
}