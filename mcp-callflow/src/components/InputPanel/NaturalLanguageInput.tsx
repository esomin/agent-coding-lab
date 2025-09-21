// Natural language input component

import React, { useState, useEffect, useCallback } from 'react';
import { NlpProcessor } from '../../services';
import type { ToolCallResult } from '../../types';
import './NaturalLanguageInput.css';

interface NaturalLanguageInputProps {
  onToolCallGenerated?: (toolCall: string) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({
  onToolCallGenerated,
  onValidationChange
}) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedJson, setGeneratedJson] = useState('');

  const nlpProcessor = new NlpProcessor();

  const processInput = useCallback(async (text: string) => {
    if (!text.trim()) {
      setSuggestions([]);
      setErrors([]);
      setGeneratedJson('');
      onToolCallGenerated?.('');
      onValidationChange?.(false);
      return;
    }

    setIsProcessing(true);
    
    try {
      // Validate input first
      const validation = nlpProcessor.validateInput(text);
      
      if (!validation.isValid) {
        setErrors(validation.errors || []);
        setSuggestions(validation.suggestions || []);
        setGeneratedJson('');
        onToolCallGenerated?.('');
        onValidationChange?.(false);
        return;
      }

      // Convert to tool call
      const result: ToolCallResult = await nlpProcessor.convertToToolCall(text);
      
      if (result.success && result.toolCall) {
        const jsonString = JSON.stringify(result.toolCall, null, 2);
        setGeneratedJson(jsonString);
        setErrors([]);
        setSuggestions([]);
        onToolCallGenerated?.(jsonString);
        onValidationChange?.(true);
      } else {
        setErrors(result.errors || []);
        setSuggestions(result.suggestions || []);
        setGeneratedJson('');
        onToolCallGenerated?.('');
        onValidationChange?.(false);
      }
    } catch (error) {
      setErrors([`처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`]);
      setSuggestions([]);
      setGeneratedJson('');
      onToolCallGenerated?.('');
      onValidationChange?.(false);
    } finally {
      setIsProcessing(false);
    }
  }, [nlpProcessor, onToolCallGenerated, onValidationChange]);

  // Debounce input processing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      processInput(input);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [input, processInput]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const getPartialSuggestions = () => {
    if (input.trim()) {
      return nlpProcessor.getSuggestions(input);
    }
    return nlpProcessor.getSuggestions('');
  };

  return (
    <div className="natural-language-input">
      <div className="input-section">
        <label htmlFor="natural-input" className="input-label">
          자연어로 명령을 입력하세요
        </label>
        <textarea
          id="natural-input"
          className="natural-input-textarea"
          value={input}
          onChange={handleInputChange}
          placeholder="예: 'read file example.txt' 또는 '파일 example.txt를 읽어줘'"
          rows={4}
        />
        
        {isProcessing && (
          <div className="processing-indicator">
            <span className="spinner"></span>
            처리 중...
          </div>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="suggestions-section">
          <h4 className="suggestions-title">제안사항:</h4>
          <ul className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="suggestion-item">
                <button
                  className="suggestion-button"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Partial suggestions for empty or partial input */}
      {!input.trim() && (
        <div className="suggestions-section">
          <h4 className="suggestions-title">사용 가능한 명령어:</h4>
          <ul className="suggestions-list">
            {getPartialSuggestions().map((suggestion, index) => (
              <li key={index} className="suggestion-item">
                <button
                  className="suggestion-button"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="errors-section">
          <h4 className="errors-title">오류:</h4>
          <ul className="errors-list">
            {errors.map((error, index) => (
              <li key={index} className="error-item">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Generated JSON Preview */}
      {generatedJson && (
        <div className="json-preview-section">
          <h4 className="json-preview-title">생성된 Tool Call:</h4>
          <pre className="json-preview">
            <code>{generatedJson}</code>
          </pre>
        </div>
      )}
    </div>
  );
};