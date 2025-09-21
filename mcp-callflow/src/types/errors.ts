// Error handling types

export interface AppError {
  type: 'connection' | 'validation' | 'execution' | 'ui';
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
  timestamp: number;
}

export type ErrorType = AppError['type'];
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
}