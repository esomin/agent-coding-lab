import type { SearchFilter, FilterRule } from '../components/ResponsePanel/AdvancedSearch';

export interface SearchResult {
  path: string[];
  key: string;
  value: any;
  type: 'key' | 'value';
  matchedText?: string;
}

export class JsonSearchFilter {
  /**
   * Search through JSON data with advanced filters
   */
  static search(
    data: any,
    searchTerm: string,
    filters: SearchFilter,
    path: string[] = []
  ): SearchResult[] {
    if (!searchTerm.trim()) return [];

    const results: SearchResult[] = [];
    const searchValue = filters.caseSensitive ? searchTerm : searchTerm.toLowerCase();

    const matchesSearch = (text: string, isKey: boolean = false): boolean => {
      if (!text) return false;
      
      const testText = filters.caseSensitive ? String(text) : String(text).toLowerCase();
      
      // Check if we should search this type
      if (filters.type === 'key' && !isKey) return false;
      if (filters.type === 'value' && isKey) return false;
      
      if (filters.useRegex) {
        try {
          const regex = new RegExp(searchValue, filters.caseSensitive ? 'g' : 'gi');
          return regex.test(testText);
        } catch {
          // If regex is invalid, fall back to simple contains
          return testText.includes(searchValue);
        }
      }
      
      return testText.includes(searchValue);
    };

    const matchesDataType = (value: any): boolean => {
      if (filters.dataType === 'all') return true;
      
      const valueType = Array.isArray(value) ? 'array' : typeof value;
      return valueType === filters.dataType;
    };

    const traverse = (current: any, currentPath: string[]) => {
      if (current === null || current === undefined) return;

      if (typeof current === 'object' && !Array.isArray(current)) {
        Object.entries(current).forEach(([key, value]) => {
          const newPath = [...currentPath, key];
          
          // Search in key
          if (matchesSearch(key, true) && matchesDataType(value)) {
            results.push({
              path: newPath,
              key,
              value,
              type: 'key',
              matchedText: key
            });
          }
          
          // Search in value if it's a primitive
          if ((typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') 
              && matchesSearch(String(value), false) && matchesDataType(value)) {
            results.push({
              path: newPath,
              key,
              value,
              type: 'value',
              matchedText: String(value)
            });
          }
          
          // Recurse into nested objects/arrays
          if (typeof value === 'object' && value !== null) {
            traverse(value, newPath);
          }
        });
      } else if (Array.isArray(current)) {
        current.forEach((item, index) => {
          const newPath = [...currentPath, String(index)];
          
          if ((typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') 
              && matchesSearch(String(item), false) && matchesDataType(item)) {
            results.push({
              path: newPath,
              key: String(index),
              value: item,
              type: 'value',
              matchedText: String(item)
            });
          }
          
          if (typeof item === 'object' && item !== null) {
            traverse(item, newPath);
          }
        });
      }
    };

    traverse(data, path);
    return results;
  }

  /**
   * Apply filter rules to JSON data
   */
  static applyFilters(data: any, rules: FilterRule[]): any {
    if (!rules.length || !rules.some(rule => rule.enabled)) {
      return data;
    }

    const enabledRules = rules.filter(rule => rule.enabled);
    
    const matchesRules = (obj: any): boolean => {
      return enabledRules.every(rule => {
        const fieldPath = rule.field.split('.');
        const value = this.getNestedValue(obj, fieldPath);
        
        return this.evaluateRule(value, rule);
      });
    };

    const filterObject = (obj: any, path: string[] = []): any => {
      if (obj === null || obj === undefined) return obj;
      
      if (Array.isArray(obj)) {
        return obj
          .map((item, index) => filterObject(item, [...path, String(index)]))
          .filter((item) => {
            if (typeof item === 'object' && item !== null) {
              return matchesRules(item);
            }
            return true;
          });
      }
      
      if (typeof obj === 'object') {
        const filtered: any = {};
        
        Object.entries(obj).forEach(([key, value]) => {
          const newPath = [...path, key];
          
          if (typeof value === 'object' && value !== null) {
            const filteredValue = filterObject(value, newPath);
            if (matchesRules({ [key]: filteredValue })) {
              filtered[key] = filteredValue;
            }
          } else {
            if (matchesRules({ [key]: value })) {
              filtered[key] = value;
            }
          }
        });
        
        return filtered;
      }
      
      return obj;
    };

    return filterObject(data);
  }

  /**
   * Get nested value from object using dot notation path
   */
  private static getNestedValue(obj: any, path: string[]): any {
    return path.reduce((current, key) => {
      if (current === null || current === undefined) return undefined;
      return current[key];
    }, obj);
  }

  /**
   * Evaluate a single filter rule
   */
  private static evaluateRule(value: any, rule: FilterRule): boolean {
    if (value === undefined || value === null) {
      return rule.operator === 'exists' ? false : true;
    }

    const stringValue = String(value).toLowerCase();
    const ruleValue = rule.value.toLowerCase();

    switch (rule.operator) {
      case 'equals':
        return stringValue === ruleValue;
      case 'contains':
        return stringValue.includes(ruleValue);
      case 'startsWith':
        return stringValue.startsWith(ruleValue);
      case 'endsWith':
        return stringValue.endsWith(ruleValue);
      case 'regex':
        try {
          const regex = new RegExp(rule.value, 'i');
          return regex.test(stringValue);
        } catch {
          return false;
        }
      case 'exists':
        return true;
      case 'gt':
        return Number(value) > Number(rule.value);
      case 'lt':
        return Number(value) < Number(rule.value);
      case 'gte':
        return Number(value) >= Number(rule.value);
      case 'lte':
        return Number(value) <= Number(rule.value);
      default:
        return true;
    }
  }

  /**
   * Highlight search matches in text
   */
  static highlightMatches(text: string, searchTerm: string, caseSensitive: boolean = false): string {
    if (!searchTerm.trim()) return text;
    
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, flags);
    
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Escape special regex characters
   */
  private static escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get statistics about search results
   */
  static getSearchStats(results: SearchResult[]): {
    total: number;
    byType: Record<'key' | 'value', number>;
    uniquePaths: number;
  } {
    const byType = results.reduce(
      (acc, result) => {
        acc[result.type]++;
        return acc;
      },
      { key: 0, value: 0 }
    );

    const uniquePaths = new Set(results.map(result => result.path.join('.'))).size;

    return {
      total: results.length,
      byType,
      uniquePaths
    };
  }
}