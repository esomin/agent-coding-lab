// Monaco Editor component (enhanced JSON editor)

import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { JsonValidator } from '../../utils';
import type { JsonValidationError } from '../../utils';
import './MonacoEditor.css';

interface MonacoEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  language?: string;
  theme?: 'light' | 'dark';
  readOnly?: boolean;
  height?: string;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  onValidationChange,
  language = 'json',
  theme = 'light',
  readOnly = false,
  height = '400px'
}) => {
  const [editorValue, setEditorValue] = useState(value);
  const [validationErrors, setValidationErrors] = useState<JsonValidationError[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<JsonValidationError[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  useEffect(() => {
    validateContent(editorValue);
  }, [editorValue]);

  const validateContent = (content: string) => {
    if (!content.trim()) {
      setValidationErrors([]);
      setValidationWarnings([]);
      setIsValid(false);
      onValidationChange?.(false);
      return;
    }

    if (language === 'json') {
      const result = JsonValidator.validateJson(content);
      
      setValidationErrors(result.errors);
      setValidationWarnings(result.warnings || []);
      setIsValid(result.isValid);
      onValidationChange?.(result.isValid);
    } else {
      // For non-JSON languages, assume valid
      setValidationErrors([]);
      setValidationWarnings([]);
      setIsValid(true);
      onValidationChange?.(true);
    }
  };

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    setEditorInstance(editor);
    
    // Configure JSON schema for tool calls
    if (language === 'json') {
      import('monaco-editor').then((monaco) => {
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          schemas: [{
            uri: 'http://myserver/tool-call-schema.json',
            fileMatch: ['*'],
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'The name of the tool to call'
                },
                arguments: {
                  type: 'object',
                  description: 'Arguments to pass to the tool'
                },
                metadata: {
                  type: 'object',
                  description: 'Optional metadata'
                }
              },
              required: ['name', 'arguments']
            }
          }]
        });
      });
    }
  };

  const handleEditorChange = (newValue: string | undefined) => {
    const value = newValue || '';
    setEditorValue(value);
    onChange?.(value);
  };

  const formatJson = () => {
    if (language !== 'json' || !editorInstance) return;
    
    try {
      const parsed = JSON.parse(editorValue);
      const formatted = JSON.stringify(parsed, null, 2);
      editorInstance.setValue(formatted);
    } catch (error) {
      // If JSON is invalid, don't format
    }
  };

  const insertSnippet = (snippet: string) => {
    if (!editorInstance) return;
    
    const selection = editorInstance.getSelection();
    if (selection) {
      editorInstance.executeEdits('insert-snippet', [{
        range: selection,
        text: snippet
      }]);
      editorInstance.focus();
    }
  };

  const insertToolCallTemplate = () => {
    const template = `{
  "name": "tool_name",
  "arguments": {
    "param1": "value1",
    "param2": "value2"
  }
}`;
    insertSnippet(template);
  };

  const insertFileReadTemplate = () => {
    const template = `{
  "name": "file_read",
  "arguments": {
    "path": "example.txt"
  }
}`;
    insertSnippet(template);
  };

  const insertSearchTemplate = () => {
    const template = `{
  "name": "search",
  "arguments": {
    "query": "search_term"
  }
}`;
    insertSnippet(template);
  };

  return (
    <div className={`monaco-editor-container ${theme}`}>
      <div className="monaco-editor-toolbar">
        <div className="editor-actions">
          {language === 'json' && (
            <>
              <button
                className="editor-btn"
                onClick={formatJson}
                disabled={!editorValue.trim() || readOnly}
                title="Format JSON (Ctrl+Shift+F)"
              >
                Format
              </button>
              <div className="template-dropdown">
                <button
                  className="editor-btn dropdown-toggle"
                  disabled={readOnly}
                  title="Insert Template"
                >
                  Templates ▼
                </button>
                <div className="dropdown-menu">
                  <button onClick={insertToolCallTemplate}>Basic Tool Call</button>
                  <button onClick={insertFileReadTemplate}>File Read</button>
                  <button onClick={insertSearchTemplate}>Search</button>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="editor-status">
          <span className="language-indicator">{language.toUpperCase()}</span>
          {editorValue.trim() && (
            <span className={`validation-indicator ${isValid ? 'valid' : 'invalid'}`}>
              {isValid ? '✓' : '✗'}
            </span>
          )}
        </div>
      </div>

      <div className="monaco-editor-content">
        <Editor
          height={height}
          language={language}
          theme={theme === 'dark' ? 'vs-dark' : 'vs'}
          value={editorValue}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto'
            },
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            quickSuggestions: {
              other: true,
              comments: false,
              strings: true
            }
          }}
        />
      </div>

      {(validationErrors.length > 0 || validationWarnings.length > 0) && (
        <div className="monaco-validation">
          {validationErrors.length > 0 && (
            <div className="validation-errors">
              <h4 className="validation-title error">오류:</h4>
              {validationErrors.map((error, index) => (
                <div key={index} className="validation-message error">
                  <span className="validation-icon">⚠</span>
                  <div className="validation-content">
                    <div className="validation-text">{error.message}</div>
                    {error.line && error.column && (
                      <div className="validation-location">
                        Line {error.line}, Column {error.column}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {validationWarnings.length > 0 && (
            <div className="validation-warnings">
              <h4 className="validation-title warning">경고:</h4>
              {validationWarnings.map((warning, index) => (
                <div key={index} className="validation-message warning">
                  <span className="validation-icon">⚠</span>
                  <div className="validation-content">
                    <div className="validation-text">{warning.message}</div>
                    {warning.line && warning.column && (
                      <div className="validation-location">
                        Line {warning.line}, Column {warning.column}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};