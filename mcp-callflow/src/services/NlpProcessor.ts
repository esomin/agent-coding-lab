// Natural Language Processing service implementation

import type { NlpProcessor as INlpProcessor } from './interfaces';
import type { ToolCall, ToolCallResult, ValidationResult } from '../types';

export class NlpProcessor implements INlpProcessor {
  private patterns: Map<string, (input: string) => ToolCall | null> = new Map();

  constructor() {
    this.initializePatterns();
  }

  async convertToToolCall(input: string): Promise<ToolCallResult> {
    try {
      const normalizedInput = input.toLowerCase().trim();
      
      // Try each pattern to find a match
      for (const [pattern, converter] of this.patterns) {
        if (normalizedInput.includes(pattern)) {
          const toolCall = converter(input);
          if (toolCall) {
            return {
              success: true,
              toolCall,
              suggestions: []
            };
          }
        }
      }

      // If no pattern matches, return suggestions
      return {
        success: false,
        suggestions: this.generateSuggestions(input),
        errors: ['Could not parse natural language input into a tool call']
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Error processing input: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  validateInput(input: string): ValidationResult {
    if (!input || input.trim().length === 0) {
      return {
        isValid: false,
        errors: ['Input cannot be empty'],
        suggestions: ['Try describing what you want to do, e.g., "read file example.txt"']
      };
    }

    if (input.length > 1000) {
      return {
        isValid: false,
        errors: ['Input is too long (max 1000 characters)']
      };
    }

    return {
      isValid: true
    };
  }

  getSuggestions(partialInput: string): string[] {
    const suggestions = [
      'read file <filename>',
      'write to file <filename> with content <content>',
      'search for <query>',
      'list files in <directory>',
      'execute command <command>'
    ];

    if (!partialInput) {
      return suggestions;
    }

    return suggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(partialInput.toLowerCase())
    );
  }

  private initializePatterns(): void {
    // File operations
    this.patterns.set('read file', (input: string) => {
      const match = input.match(/read file\s+(.+)/i);
      if (match) {
        return {
          name: 'file_read',
          arguments: { path: match[1].trim() }
        };
      }
      return null;
    });

    this.patterns.set('write file', (input: string) => {
      const match = input.match(/write (?:to )?file\s+(.+?)\s+(?:with content\s+)?(.+)/i);
      if (match) {
        return {
          name: 'file_write',
          arguments: { 
            path: match[1].trim(),
            content: match[2].trim()
          }
        };
      }
      return null;
    });

    // Search operations
    this.patterns.set('search', (input: string) => {
      const match = input.match(/search (?:for\s+)?(.+)/i);
      if (match) {
        return {
          name: 'search',
          arguments: { query: match[1].trim() }
        };
      }
      return null;
    });
  }

  private generateSuggestions(input: string): string[] {
    const words = input.toLowerCase().split(/\s+/);
    const suggestions: string[] = [];

    if (words.includes('file') || words.includes('read')) {
      suggestions.push('Try: "read file <filename>"');
    }
    
    if (words.includes('write') || words.includes('create')) {
      suggestions.push('Try: "write file <filename> with content <your content>"');
    }
    
    if (words.includes('search') || words.includes('find')) {
      suggestions.push('Try: "search for <your query>"');
    }

    if (suggestions.length === 0) {
      suggestions.push('Try describing an action like "read file", "write file", or "search for"');
    }

    return suggestions;
  }
}