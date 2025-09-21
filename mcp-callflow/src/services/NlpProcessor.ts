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
      let bestMatch: ToolCall | null = null;
      let bestScore = 0;
      
      // Try each pattern to find the best match
      for (const [pattern, converter] of this.patterns) {
        const score = this.calculatePatternScore(normalizedInput, pattern);
        if (score > 0) {
          const toolCall = converter(input);
          if (toolCall && score > bestScore) {
            bestMatch = toolCall;
            bestScore = score;
          }
        }
      }

      if (bestMatch) {
        // Validate the generated tool call
        const validation = this.validateToolCall(bestMatch);
        if (validation.isValid) {
          return {
            success: true,
            toolCall: bestMatch,
            suggestions: []
          };
        } else {
          return {
            success: false,
            errors: validation.errors,
            suggestions: validation.suggestions
          };
        }
      }

      // If no pattern matches, provide intelligent suggestions
      const intelligentSuggestions = this.generateIntelligentSuggestions(input);
      return {
        success: false,
        suggestions: intelligentSuggestions,
        errors: ['입력을 Tool Call로 변환할 수 없습니다']
      };
    } catch (error) {
      return {
        success: false,
        errors: [`처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`],
        suggestions: ['다시 시도해주세요']
      };
    }
  }

  private calculatePatternScore(input: string, pattern: string): number {
    let score = 0;
    
    // Direct pattern match
    if (input.includes(pattern)) {
      score += 10;
    }
    
    // Fuzzy matching for similar words
    const inputWords = input.split(/\s+/);
    const patternWords = pattern.split(/\s+/);
    
    for (const inputWord of inputWords) {
      for (const patternWord of patternWords) {
        if (inputWord.includes(patternWord) || patternWord.includes(inputWord)) {
          score += 3;
        }
        // Check for similar words (simple edit distance)
        if (this.calculateEditDistance(inputWord, patternWord) <= 2) {
          score += 1;
        }
      }
    }
    
    return score;
  }

  private calculateEditDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private validateToolCall(toolCall: ToolCall): ValidationResult {
    // Check if tool name is valid
    const validToolNames = [
      'file_read', 'file_write', 'search', 'list_files', 
      'execute_command', 'http_request'
    ];
    
    if (!validToolNames.includes(toolCall.name)) {
      return {
        isValid: false,
        errors: [`알 수 없는 도구: ${toolCall.name}`],
        suggestions: [`사용 가능한 도구: ${validToolNames.join(', ')}`]
      };
    }

    // Validate arguments based on tool type
    switch (toolCall.name) {
      case 'file_read':
      case 'list_files':
        if (!toolCall.arguments.path || typeof toolCall.arguments.path !== 'string') {
          return {
            isValid: false,
            errors: ['파일 경로가 필요합니다'],
            suggestions: ['예: "read file example.txt"']
          };
        }
        break;
        
      case 'file_write':
        if (!toolCall.arguments.path || !toolCall.arguments.content) {
          return {
            isValid: false,
            errors: ['파일 경로와 내용이 모두 필요합니다'],
            suggestions: ['예: "write file output.txt with Hello World"']
          };
        }
        break;
        
      case 'search':
        if (!toolCall.arguments.query || typeof toolCall.arguments.query !== 'string') {
          return {
            isValid: false,
            errors: ['검색어가 필요합니다'],
            suggestions: ['예: "search for TODO"']
          };
        }
        break;
        
      case 'execute_command':
        if (!toolCall.arguments.command || typeof toolCall.arguments.command !== 'string') {
          return {
            isValid: false,
            errors: ['실행할 명령어가 필요합니다'],
            suggestions: ['예: "execute npm install"']
          };
        }
        break;
        
      case 'http_request':
        if (!toolCall.arguments.url || typeof toolCall.arguments.url !== 'string') {
          return {
            isValid: false,
            errors: ['URL이 필요합니다'],
            suggestions: ['예: "get https://api.example.com/users"']
          };
        }
        // Validate URL format
        try {
          new URL(toolCall.arguments.url);
        } catch {
          return {
            isValid: false,
            errors: ['유효하지 않은 URL 형식입니다'],
            suggestions: ['예: "https://api.example.com/users"']
          };
        }
        break;
    }

    return { isValid: true };
  }

  private generateIntelligentSuggestions(input: string): string[] {
    const normalizedInput = input.toLowerCase();
    const suggestions: string[] = [];
    
    // Analyze input for potential intent
    if (normalizedInput.includes('file') || normalizedInput.includes('파일')) {
      suggestions.push('파일 example.txt를 읽어줘');
      suggestions.push('파일 output.txt에 Hello World를 써줘');
    }
    
    if (normalizedInput.includes('search') || normalizedInput.includes('find') || 
        normalizedInput.includes('검색') || normalizedInput.includes('찾')) {
      suggestions.push('TODO를 검색해줘');
      suggestions.push('search for function main');
    }
    
    if (normalizedInput.includes('list') || normalizedInput.includes('show') || 
        normalizedInput.includes('목록') || normalizedInput.includes('보여')) {
      suggestions.push('src 디렉토리의 파일 목록');
      suggestions.push('list files in current directory');
    }
    
    if (normalizedInput.includes('run') || normalizedInput.includes('execute') || 
        normalizedInput.includes('실행') || normalizedInput.includes('명령')) {
      suggestions.push('git status를 실행');
      suggestions.push('execute npm install');
    }
    
    if (normalizedInput.includes('http') || normalizedInput.includes('api') || 
        normalizedInput.includes('get') || normalizedInput.includes('post')) {
      suggestions.push('get https://api.example.com/users');
      suggestions.push('post https://api.example.com/data with {"key": "value"}');
    }
    
    // If no specific intent found, provide general suggestions
    if (suggestions.length === 0) {
      suggestions.push('파일 example.txt를 읽어줘');
      suggestions.push('TODO를 검색해줘');
      suggestions.push('src 디렉토리의 파일 목록');
      suggestions.push('git status를 실행');
    }
    
    return suggestions.slice(0, 5);
  }

  validateInput(input: string): ValidationResult {
    // Empty input check
    if (!input || input.trim().length === 0) {
      return {
        isValid: false,
        errors: ['입력이 비어있습니다'],
        suggestions: [
          '파일 example.txt를 읽어줘',
          'TODO를 검색해줘',
          'src 디렉토리의 파일 목록'
        ]
      };
    }

    // Length validation
    if (input.length > 1000) {
      return {
        isValid: false,
        errors: ['입력이 너무 깁니다 (최대 1000자)'],
        suggestions: ['더 간단하고 명확한 명령어를 사용해보세요']
      };
    }

    // Minimum length check
    if (input.trim().length < 3) {
      return {
        isValid: false,
        errors: ['입력이 너무 짧습니다'],
        suggestions: [
          '최소 3글자 이상 입력해주세요',
          '예: "파일 읽기", "검색", "목록"'
        ]
      };
    }

    // Check for potentially dangerous patterns
    const dangerousPatterns = [
      /rm\s+-rf\s+\//i,
      /del\s+\/[sq]/i,
      /format\s+c:/i,
      /shutdown/i,
      /reboot/i,
      /halt/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(input)) {
        return {
          isValid: false,
          errors: ['위험한 명령어가 감지되었습니다'],
          suggestions: ['안전한 명령어를 사용해주세요']
        };
      }
    }

    // Check for common typos and provide suggestions
    const typoSuggestions = this.checkForTypos(input);
    if (typoSuggestions.length > 0) {
      return {
        isValid: true, // Still valid, but with suggestions
        suggestions: typoSuggestions
      };
    }

    // Check if input looks like it might be incomplete
    const incompleteness = this.checkCompleteness(input);
    if (incompleteness.isIncomplete) {
      return {
        isValid: false,
        errors: incompleteness.errors,
        suggestions: incompleteness.suggestions
      };
    }

    return {
      isValid: true
    };
  }

  private checkForTypos(input: string): string[] {
    const suggestions: string[] = [];
    const normalizedInput = input.toLowerCase().trim();

    // Common typos and their corrections
    const typoMap = {
      'raed': 'read',
      'reed': 'read',
      'wirte': 'write',
      'wrtie': 'write',
      'serach': 'search',
      'seach': 'search',
      'fiel': 'file',
      'flie': 'file',
      'excute': 'execute',
      'exeute': 'execute',
      '읽어': '읽어줘',
      '써': '써줘',
      '찾아': '찾아줘',
      '보여': '보여줘'
    };

    for (const [typo, correction] of Object.entries(typoMap)) {
      if (normalizedInput.includes(typo)) {
        const corrected = input.replace(new RegExp(typo, 'gi'), correction);
        suggestions.push(`혹시 이것을 의미하셨나요: "${corrected}"`);
      }
    }

    return suggestions;
  }

  private checkCompleteness(input: string): {
    isIncomplete: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const normalizedInput = input.toLowerCase().trim();
    
    // Check for incomplete file operations
    if (normalizedInput.match(/(?:read|open|show)\s*(?:file)?\s*$/i)) {
      return {
        isIncomplete: true,
        errors: ['파일명이 누락되었습니다'],
        suggestions: [
          '파일명을 추가해주세요: "read file example.txt"',
          '또는: "파일 example.txt를 읽어줘"'
        ]
      };
    }

    if (normalizedInput.match(/(?:write|create|save)\s*(?:file)?\s*$/i)) {
      return {
        isIncomplete: true,
        errors: ['파일명과 내용이 누락되었습니다'],
        suggestions: [
          '파일명과 내용을 추가해주세요: "write file output.txt with Hello World"',
          '또는: "파일 output.txt에 Hello World를 써줘"'
        ]
      };
    }

    if (normalizedInput.match(/(?:search|find|look)\s*(?:for)?\s*$/i)) {
      return {
        isIncomplete: true,
        errors: ['검색어가 누락되었습니다'],
        suggestions: [
          '검색어를 추가해주세요: "search for TODO"',
          '또는: "TODO를 검색해줘"'
        ]
      };
    }

    if (normalizedInput.match(/(?:list|ls|dir|show)\s*(?:files?)?\s*$/i)) {
      return {
        isIncomplete: true,
        errors: ['디렉토리 경로가 누락되었습니다'],
        suggestions: [
          '경로를 추가해주세요: "list files in src"',
          '또는: "src 디렉토리의 파일 목록"'
        ]
      };
    }

    if (normalizedInput.match(/(?:execute|run|exec)\s*(?:command)?\s*$/i)) {
      return {
        isIncomplete: true,
        errors: ['실행할 명령어가 누락되었습니다'],
        suggestions: [
          '명령어를 추가해주세요: "execute npm install"',
          '또는: "git status를 실행"'
        ]
      };
    }

    // Check for Korean incomplete patterns
    if (normalizedInput.match(/파일\s*$/i)) {
      return {
        isIncomplete: true,
        errors: ['파일명과 동작이 누락되었습니다'],
        suggestions: [
          '"파일 example.txt를 읽어줘"',
          '"파일 output.txt에 내용을 써줘"'
        ]
      };
    }

    if (normalizedInput.match(/검색\s*$/i) || normalizedInput.match(/찾기\s*$/i)) {
      return {
        isIncomplete: true,
        errors: ['검색어가 누락되었습니다'],
        suggestions: [
          '"TODO를 검색해줘"',
          '"함수 이름을 찾아줘"'
        ]
      };
    }

    return {
      isIncomplete: false,
      errors: [],
      suggestions: []
    };
  }

  getSuggestions(partialInput: string): string[] {
    const allSuggestions = [
      // File operations - English
      'read file example.txt',
      'open file config.json',
      'write file output.txt with content Hello World',
      'create file new.md with # Title',
      'save to file data.csv content name,age',
      
      // File operations - Korean
      '파일 example.txt를 읽어줘',
      'config.json 파일을 열어줘',
      '파일 output.txt에 Hello World를 써줘',
      
      // Search operations - English
      'search for TODO',
      'find function main',
      'look for error message',
      'grep import',
      
      // Search operations - Korean
      'TODO를 검색해줘',
      'main 함수를 찾아줘',
      '에러 메시지 찾기',
      
      // Directory operations - English
      'list files in src',
      'show files in current directory',
      'ls /home/user',
      'dir C:\\Users',
      
      // Directory operations - Korean
      'src 디렉토리의 파일 목록',
      '현재 폴더의 파일들을 보여줘',
      
      // Command execution - English
      'execute npm install',
      'run git status',
      'exec ls -la',
      
      // Command execution - Korean
      'npm install 명령어를 실행해줘',
      'git status를 실행',
      
      // HTTP requests - English
      'get https://api.example.com/users',
      'post https://api.example.com/data with {"key": "value"}',
      'fetch https://jsonplaceholder.typicode.com/posts/1',
      'curl https://httpbin.org/get'
    ];

    if (!partialInput || partialInput.trim().length === 0) {
      // Return most common suggestions when no input
      return [
        'read file example.txt',
        '파일 example.txt를 읽어줘',
        'search for TODO',
        'TODO를 검색해줘',
        'list files in src',
        'src 디렉토리의 파일 목록'
      ];
    }

    const normalizedInput = partialInput.toLowerCase().trim();
    
    // Filter suggestions based on input
    const filtered = allSuggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(normalizedInput) ||
      this.matchesIntent(normalizedInput, suggestion)
    );

    // Sort by relevance
    return filtered.sort((a, b) => {
      const aScore = this.calculateRelevanceScore(normalizedInput, a);
      const bScore = this.calculateRelevanceScore(normalizedInput, b);
      return bScore - aScore;
    }).slice(0, 8); // Limit to 8 suggestions
  }

  private matchesIntent(input: string, suggestion: string): boolean {
    const inputWords = input.split(/\s+/);
    const suggestionLower = suggestion.toLowerCase();
    
    // Check for intent matches
    const intentMap = {
      'read': ['read', 'open', 'show', '읽', '열', '보여'],
      'write': ['write', 'create', 'save', '쓰', '저장', '작성'],
      'search': ['search', 'find', 'look', 'grep', '검색', '찾'],
      'list': ['list', 'ls', 'dir', 'show', '목록', '리스트', '나열'],
      'execute': ['execute', 'run', 'exec', '실행'],
      'http': ['get', 'post', 'fetch', 'curl', 'http']
    };
    
    for (const word of inputWords) {
      for (const [intent, keywords] of Object.entries(intentMap)) {
        if (keywords.some(keyword => word.includes(keyword))) {
          if (suggestionLower.includes(intent) || 
              keywords.some(keyword => suggestionLower.includes(keyword))) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  private calculateRelevanceScore(input: string, suggestion: string): number {
    let score = 0;
    const inputLower = input.toLowerCase();
    const suggestionLower = suggestion.toLowerCase();
    
    // Exact substring match gets highest score
    if (suggestionLower.includes(inputLower)) {
      score += 10;
    }
    
    // Word matches
    const inputWords = inputLower.split(/\s+/);
    const suggestionWords = suggestionLower.split(/\s+/);
    
    for (const inputWord of inputWords) {
      for (const suggestionWord of suggestionWords) {
        if (suggestionWord.includes(inputWord)) {
          score += 5;
        } else if (inputWord.includes(suggestionWord)) {
          score += 3;
        }
      }
    }
    
    // Prefer shorter suggestions (more concise)
    score -= suggestion.length * 0.01;
    
    return score;
  }

  private initializePatterns(): void {
    // File operations - English
    this.patterns.set('read file', (input: string) => {
      const patterns = [
        /read file\s+(.+)/i,
        /open file\s+(.+)/i,
        /show (?:me )?(?:the )?(?:contents? of )?file\s+(.+)/i,
        /cat\s+(.+)/i
      ];
      
      for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
          return {
            name: 'file_read',
            arguments: { path: match[1].trim().replace(/['"]/g, '') }
          };
        }
      }
      return null;
    });

    // File operations - Korean
    this.patterns.set('파일', (input: string) => {
      const patterns = [
        /파일\s+(.+?)\s*(?:을|를)\s*(?:읽어|열어|보여)/i,
        /(.+?)\s*파일\s*(?:을|를)\s*(?:읽어|열어|보여)/i,
        /(.+?)\s*(?:을|를)\s*읽어/i
      ];
      
      for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
          return {
            name: 'file_read',
            arguments: { path: match[1].trim().replace(/['"]/g, '') }
          };
        }
      }
      return null;
    });

    this.patterns.set('write file', (input: string) => {
      const patterns = [
        /write (?:to )?file\s+(.+?)\s+(?:with content\s+)?(.+)/i,
        /create file\s+(.+?)\s+(?:with\s+)?(.+)/i,
        /save (?:to )?file\s+(.+?)\s+(?:content\s+)?(.+)/i
      ];
      
      for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
          return {
            name: 'file_write',
            arguments: { 
              path: match[1].trim().replace(/['"]/g, ''),
              content: match[2].trim().replace(/^["']|["']$/g, '')
            }
          };
        }
      }
      return null;
    });

    // File operations - Korean write
    this.patterns.set('파일 쓰기', (input: string) => {
      const patterns = [
        /파일\s+(.+?)\s*(?:에|으로)\s+(.+?)\s*(?:을|를)\s*(?:쓰기|저장|작성)/i,
        /(.+?)\s*파일\s*(?:에|으로)\s+(.+?)\s*(?:을|를)\s*(?:쓰기|저장|작성)/i,
        /(.+?)\s*(?:을|를)\s*(.+?)\s*파일\s*(?:에|으로)\s*(?:쓰기|저장)/i
      ];
      
      for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
          return {
            name: 'file_write',
            arguments: { 
              path: match[1].trim().replace(/['"]/g, ''),
              content: match[2].trim().replace(/^["']|["']$/g, '')
            }
          };
        }
      }
      return null;
    });

    // Search operations - English
    this.patterns.set('search', (input: string) => {
      const patterns = [
        /search (?:for\s+)?(.+)/i,
        /find (?:me\s+)?(.+)/i,
        /look for\s+(.+)/i,
        /grep\s+(.+)/i
      ];
      
      for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
          return {
            name: 'search',
            arguments: { query: match[1].trim().replace(/^["']|["']$/g, '') }
          };
        }
      }
      return null;
    });

    // Search operations - Korean
    this.patterns.set('검색', (input: string) => {
      const patterns = [
        /(.+?)\s*(?:을|를)\s*검색/i,
        /검색\s+(.+)/i,
        /(.+?)\s*찾기/i,
        /(.+?)\s*(?:을|를)\s*찾아/i
      ];
      
      for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
          return {
            name: 'search',
            arguments: { query: match[1].trim().replace(/^["']|["']$/g, '') }
          };
        }
      }
      return null;
    });

    // Directory operations - English
    this.patterns.set('list', (input: string) => {
      const patterns = [
        /list (?:files (?:in\s+)?)?(.+)/i,
        /ls\s+(.+)/i,
        /show (?:me )?(?:files (?:in\s+)?)?(.+)/i,
        /dir\s+(.+)/i
      ];
      
      for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
          return {
            name: 'list_files',
            arguments: { path: match[1].trim().replace(/['"]/g, '') }
          };
        }
      }
      return null;
    });

    // Directory operations - Korean
    this.patterns.set('목록', (input: string) => {
      const patterns = [
        /(.+?)\s*(?:의\s+)?(?:파일\s+)?목록/i,
        /(.+?)\s*(?:디렉토리|폴더)\s*(?:의\s+)?(?:파일\s+)?(?:목록|리스트)/i,
        /(.+?)\s*(?:에\s+)?(?:있는\s+)?파일(?:들)?(?:을|를)\s*(?:보여|나열)/i
      ];
      
      for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
          return {
            name: 'list_files',
            arguments: { path: match[1].trim().replace(/['"]/g, '') }
          };
        }
      }
      return null;
    });

    // Command execution - English
    this.patterns.set('execute', (input: string) => {
      const patterns = [
        /execute (?:command\s+)?(.+)/i,
        /run (?:command\s+)?(.+)/i,
        /exec\s+(.+)/i
      ];
      
      for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
          return {
            name: 'execute_command',
            arguments: { command: match[1].trim().replace(/^["']|["']$/g, '') }
          };
        }
      }
      return null;
    });

    // Command execution - Korean
    this.patterns.set('실행', (input: string) => {
      const patterns = [
        /(.+?)\s*(?:명령어|커맨드)\s*(?:을|를)\s*실행/i,
        /(.+?)\s*(?:을|를)\s*실행/i,
        /실행\s+(.+)/i
      ];
      
      for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
          return {
            name: 'execute_command',
            arguments: { command: match[1].trim().replace(/^["']|["']$/g, '') }
          };
        }
      }
      return null;
    });

    // HTTP requests - English
    this.patterns.set('http', (input: string) => {
      const patterns = [
        /(?:make\s+)?(?:http\s+)?get (?:request (?:to\s+)?)?(.+)/i,
        /(?:make\s+)?(?:http\s+)?post (?:request (?:to\s+)?)?(.+?)(?:\s+with\s+(.+))?/i,
        /fetch\s+(.+)/i,
        /curl\s+(.+)/i
      ];
      
      for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
          const method = input.toLowerCase().includes('post') ? 'POST' : 'GET';
          const toolCall: ToolCall = {
            name: 'http_request',
            arguments: { 
              url: match[1].trim().replace(/^["']|["']$/g, ''),
              method: method
            }
          };
          
          if (match[2] && method === 'POST') {
            toolCall.arguments.body = match[2].trim().replace(/^["']|["']$/g, '');
          }
          
          return toolCall;
        }
      }
      return null;
    });
  }

  private generateSuggestions(input: string): string[] {
    const words = input.toLowerCase().split(/\s+/);
    const suggestions: string[] = [];

    // Analyze input for intent
    const hasFileIntent = words.some(word => 
      ['file', 'read', 'open', 'write', 'create', 'save', '파일', '읽', '쓰', '저장'].includes(word)
    );
    
    const hasSearchIntent = words.some(word => 
      ['search', 'find', 'look', 'grep', '검색', '찾'].includes(word)
    );
    
    const hasListIntent = words.some(word => 
      ['list', 'ls', 'dir', 'show', '목록', '리스트'].includes(word)
    );
    
    const hasExecuteIntent = words.some(word => 
      ['execute', 'run', 'exec', '실행', '명령'].includes(word)
    );
    
    const hasHttpIntent = words.some(word => 
      ['http', 'get', 'post', 'fetch', 'curl', 'api'].includes(word)
    );

    // Generate contextual suggestions
    if (hasFileIntent) {
      suggestions.push('파일 example.txt를 읽어줘');
      suggestions.push('read file config.json');
      suggestions.push('파일 output.txt에 Hello World를 써줘');
      suggestions.push('write file data.csv with name,age,city');
    }
    
    if (hasSearchIntent) {
      suggestions.push('TODO를 검색해줘');
      suggestions.push('search for function main');
      suggestions.push('에러 메시지 찾기');
      suggestions.push('find import statements');
    }
    
    if (hasListIntent) {
      suggestions.push('src 디렉토리의 파일 목록');
      suggestions.push('list files in current directory');
      suggestions.push('현재 폴더의 파일들을 보여줘');
    }
    
    if (hasExecuteIntent) {
      suggestions.push('npm install 명령어를 실행해줘');
      suggestions.push('execute git status');
      suggestions.push('ls -la를 실행');
    }
    
    if (hasHttpIntent) {
      suggestions.push('get https://api.example.com/users');
      suggestions.push('post https://api.example.com/data with {"key": "value"}');
      suggestions.push('fetch https://jsonplaceholder.typicode.com/posts/1');
    }

    // If no specific intent detected, provide general suggestions
    if (suggestions.length === 0) {
      suggestions.push('파일을 읽으려면: "파일 example.txt를 읽어줘"');
      suggestions.push('검색하려면: "TODO를 검색해줘"');
      suggestions.push('파일 목록을 보려면: "src 디렉토리의 파일 목록"');
      suggestions.push('명령어를 실행하려면: "git status를 실행"');
    }

    return suggestions.slice(0, 6); // Limit to 6 suggestions
  }
}