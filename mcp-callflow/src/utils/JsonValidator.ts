// JSON validation utilities for Tool Call validation

import type { ToolCall, ValidationResult } from '../types';

export interface JsonValidationError {
  line?: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface JsonValidationResult extends ValidationResult {
  errors: JsonValidationError[];
  warnings?: JsonValidationError[];
}

export class JsonValidator {
  private static toolCallSchema = {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        pattern: '^[a-zA-Z][a-zA-Z0-9_]*$'
      },
      arguments: {
        type: 'object'
      },
      metadata: {
        type: 'object',
        properties: {
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1
          },
          alternatives: {
            type: 'array',
            items: {
              type: 'object'
            }
          }
        }
      }
    },
    required: ['name', 'arguments'],
    additionalProperties: false
  };

  private static validToolNames = [
    'file_read',
    'file_write',
    'search',
    'list_files',
    'execute_command',
    'http_request'
  ];

  static validateJson(jsonString: string): JsonValidationResult {
    const errors: JsonValidationError[] = [];
    const warnings: JsonValidationError[] = [];

    // Empty input
    if (!jsonString.trim()) {
      return {
        isValid: false,
        errors: [{
          message: 'JSON이 비어있습니다',
          severity: 'error'
        }]
      };
    }

    // Parse JSON
    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (error) {
      const syntaxError = this.parseSyntaxError(error, jsonString);
      return {
        isValid: false,
        errors: [syntaxError]
      };
    }

    // Validate structure
    const structureValidation = this.validateStructure(parsed);
    errors.push(...structureValidation.errors);
    warnings.push(...(structureValidation.warnings || []));

    // Validate tool call specific rules
    const toolCallValidation = this.validateToolCall(parsed);
    errors.push(...toolCallValidation.errors);
    warnings.push(...(toolCallValidation.warnings || []));

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  private static parseSyntaxError(error: any, jsonString: string): JsonValidationError {
    const message = error.message || 'JSON 구문 오류';
    
    // Try to extract line/column information
    const match = message.match(/at position (\d+)/);
    if (match) {
      const position = parseInt(match[1]);
      const { line, column } = this.getLineColumn(jsonString, position);
      return {
        line,
        column,
        message: `JSON 구문 오류: ${message}`,
        severity: 'error'
      };
    }

    return {
      message: `JSON 구문 오류: ${message}`,
      severity: 'error'
    };
  }

  private static getLineColumn(text: string, position: number): { line: number; column: number } {
    const lines = text.substring(0, position).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  }

  private static validateStructure(obj: any): JsonValidationResult {
    const errors: JsonValidationError[] = [];
    const warnings: JsonValidationError[] = [];

    // Must be an object
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      errors.push({
        message: 'Tool Call은 객체여야 합니다',
        severity: 'error'
      });
      return { isValid: false, errors };
    }

    // Required fields
    if (!obj.hasOwnProperty('name')) {
      errors.push({
        message: '"name" 필드가 필요합니다',
        severity: 'error'
      });
    }

    if (!obj.hasOwnProperty('arguments')) {
      errors.push({
        message: '"arguments" 필드가 필요합니다',
        severity: 'error'
      });
    }

    // Type validation
    if (obj.name !== undefined && typeof obj.name !== 'string') {
      errors.push({
        message: '"name" 필드는 문자열이어야 합니다',
        severity: 'error'
      });
    }

    if (obj.arguments !== undefined && (typeof obj.arguments !== 'object' || Array.isArray(obj.arguments))) {
      errors.push({
        message: '"arguments" 필드는 객체여야 합니다',
        severity: 'error'
      });
    }

    // Optional metadata validation
    if (obj.metadata !== undefined) {
      if (typeof obj.metadata !== 'object' || Array.isArray(obj.metadata)) {
        warnings.push({
          message: '"metadata" 필드는 객체여야 합니다',
          severity: 'warning'
        });
      } else {
        // Validate metadata structure
        if (obj.metadata.confidence !== undefined) {
          if (typeof obj.metadata.confidence !== 'number' || 
              obj.metadata.confidence < 0 || 
              obj.metadata.confidence > 1) {
            warnings.push({
              message: '"metadata.confidence"는 0과 1 사이의 숫자여야 합니다',
              severity: 'warning'
            });
          }
        }
      }
    }

    // Check for unknown fields
    const knownFields = ['name', 'arguments', 'metadata'];
    const unknownFields = Object.keys(obj).filter(key => !knownFields.includes(key));
    if (unknownFields.length > 0) {
      warnings.push({
        message: `알 수 없는 필드: ${unknownFields.join(', ')}`,
        severity: 'warning'
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private static validateToolCall(obj: any): JsonValidationResult {
    const errors: JsonValidationError[] = [];
    const warnings: JsonValidationError[] = [];

    if (typeof obj !== 'object' || !obj.name) {
      return { isValid: true, errors }; // Structure validation will catch this
    }

    const toolName = obj.name;
    const args = obj.arguments || {};

    // Validate tool name
    if (!this.validToolNames.includes(toolName)) {
      warnings.push({
        message: `알 수 없는 도구: "${toolName}". 사용 가능한 도구: ${this.validToolNames.join(', ')}`,
        severity: 'warning'
      });
    }

    // Tool-specific argument validation
    switch (toolName) {
      case 'file_read':
      case 'list_files':
        if (!args.path || typeof args.path !== 'string') {
          errors.push({
            message: '"path" 매개변수가 필요합니다 (문자열)',
            severity: 'error'
          });
        } else if (args.path.trim().length === 0) {
          errors.push({
            message: '"path"는 비어있을 수 없습니다',
            severity: 'error'
          });
        }
        break;

      case 'file_write':
        if (!args.path || typeof args.path !== 'string') {
          errors.push({
            message: '"path" 매개변수가 필요합니다 (문자열)',
            severity: 'error'
          });
        }
        if (!args.content || typeof args.content !== 'string') {
          errors.push({
            message: '"content" 매개변수가 필요합니다 (문자열)',
            severity: 'error'
          });
        }
        break;

      case 'search':
        if (!args.query || typeof args.query !== 'string') {
          errors.push({
            message: '"query" 매개변수가 필요합니다 (문자열)',
            severity: 'error'
          });
        } else if (args.query.trim().length === 0) {
          errors.push({
            message: '"query"는 비어있을 수 없습니다',
            severity: 'error'
          });
        }
        break;

      case 'execute_command':
        if (!args.command || typeof args.command !== 'string') {
          errors.push({
            message: '"command" 매개변수가 필요합니다 (문자열)',
            severity: 'error'
          });
        } else if (args.command.trim().length === 0) {
          errors.push({
            message: '"command"는 비어있을 수 없습니다',
            severity: 'error'
          });
        }
        // Check for dangerous commands
        const dangerousCommands = ['rm -rf', 'del /s', 'format', 'shutdown', 'reboot'];
        if (dangerousCommands.some(cmd => args.command.toLowerCase().includes(cmd))) {
          warnings.push({
            message: '위험할 수 있는 명령어가 감지되었습니다',
            severity: 'warning'
          });
        }
        break;

      case 'http_request':
        if (!args.url || typeof args.url !== 'string') {
          errors.push({
            message: '"url" 매개변수가 필요합니다 (문자열)',
            severity: 'error'
          });
        } else {
          // Validate URL format
          try {
            new URL(args.url);
          } catch {
            errors.push({
              message: '유효하지 않은 URL 형식입니다',
              severity: 'error'
            });
          }
        }
        
        if (args.method && typeof args.method !== 'string') {
          warnings.push({
            message: '"method"는 문자열이어야 합니다',
            severity: 'warning'
          });
        } else if (args.method && !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(args.method.toUpperCase())) {
          warnings.push({
            message: '지원되지 않는 HTTP 메서드입니다',
            severity: 'warning'
          });
        }
        break;
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  static formatValidationErrors(result: JsonValidationResult): string[] {
    const messages: string[] = [];
    
    result.errors.forEach(error => {
      let message = error.message;
      if (error.line && error.column) {
        message = `Line ${error.line}, Column ${error.column}: ${message}`;
      }
      messages.push(message);
    });

    if (result.warnings) {
      result.warnings.forEach(warning => {
        let message = `Warning: ${warning.message}`;
        if (warning.line && warning.column) {
          message = `Line ${warning.line}, Column ${warning.column}: ${message}`;
        }
        messages.push(message);
      });
    }

    return messages;
  }

  static isValidToolCall(obj: any): obj is ToolCall {
    const result = this.validateJson(JSON.stringify(obj));
    return result.isValid;
  }
}