// Basic JSON editor component (will be enhanced with Monaco Editor later)

import React, { useState, useEffect } from 'react';
import './JsonEditor.css';

interface JsonEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  value,
  onChange,
  onValidationChange
}) => {
  const [jsonValue, setJsonValue] = useState(value);
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setJsonValue(value);
  }, [value]);

  const validateJson = (jsonString: string) => {
    if (!jsonString.trim()) {
      setErrors([]);
      setIsValid(false);
      onValidationChange?.(false);
      return;
    }

    try {
      const parsed = JSON.parse(jsonString);
      
      // Validate tool call structure
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Tool call must be an object');
      }
      
      if (!parsed.name || typeof parsed.name !== 'string') {
        throw new Error('Tool call must have a "name" field of type string');
      }
      
      if (!parsed.arguments || typeof parsed.arguments !== 'object') {
        throw new Error('Tool call must have an "arguments" field of type object');
      }

      setErrors([]);
      setIsValid(true);
      onValidationChange?.(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid JSON';
      setErrors([errorMessage]);
      setIsValid(false);
      onValidationChange?.(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setJsonValue(newValue);
    onChange?.(newValue);
    validateJson(newValue);
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonValue);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonValue(formatted);
      onChange?.(formatted);
    } catch (error) {
      // If JSON is invalid, don't format
    }
  };

  const insertTemplate = () => {
    const template = {
      name: "example_tool",
      arguments: {
        param1: "value1",
        param2: "value2"
      }
    };
    const templateJson = JSON.stringify(template, null, 2);
    setJsonValue(templateJson);
    onChange?.(templateJson);
    validateJson(templateJson);
  };

  return (
    <div className="json-editor">
      <div className="json-editor-header">
        <div className="editor-actions">
          <button
            className="editor-action-btn"
            onClick={formatJson}
            disabled={!jsonValue.trim()}
          >
            포맷
          </button>
          <button
            className="editor-action-btn"
            onClick={insertTemplate}
          >
            템플릿 삽입
          </button>
        </div>
        
        <div className="validation-status">
          {jsonValue.trim() && (
            <span className={`status-indicator ${isValid ? 'valid' : 'invalid'}`}>
              {isValid ? '✓ 유효함' : '✗ 오류'}
            </span>
          )}
        </div>
      </div>

      <div className="json-editor-content">
        <textarea
          className={`json-textarea ${errors.length > 0 ? 'error' : ''}`}
          value={jsonValue}
          onChange={handleChange}
          placeholder={`Tool Call JSON을 입력하세요:

{
  "name": "tool_name",
  "arguments": {
    "param": "value"
  }
}`}
          spellCheck={false}
        />
      </div>

      {errors.length > 0 && (
        <div className="json-errors">
          <h4 className="errors-title">JSON 오류:</h4>
          <ul className="errors-list">
            {errors.map((error, index) => (
              <li key={index} className="error-item">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="json-help">
        <h4 className="help-title">Tool Call 형식:</h4>
        <ul className="help-list">
          <li><code>name</code>: 실행할 도구의 이름 (문자열)</li>
          <li><code>arguments</code>: 도구에 전달할 매개변수 (객체)</li>
          <li><code>metadata</code>: 선택적 메타데이터 (객체)</li>
        </ul>
      </div>
    </div>
  );
};