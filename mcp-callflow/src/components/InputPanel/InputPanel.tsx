// Input panel component with natural language and JSON editor modes

import React, { useState } from 'react';
import { NaturalLanguageInput } from './NaturalLanguageInput';
import { JsonEditor } from './JsonEditor';
import './InputPanel.css';

export type InputMode = 'natural' | 'json';

interface InputPanelProps {
  onToolCallGenerated?: (toolCall: string) => void;
  onExecute?: (toolCall: string) => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  onToolCallGenerated,
  onExecute
}) => {
  const [inputMode, setInputMode] = useState<InputMode>('natural');
  const [toolCallJson, setToolCallJson] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleModeChange = (mode: InputMode) => {
    setInputMode(mode);
  };

  const handleToolCallChange = (toolCall: string) => {
    setToolCallJson(toolCall);
    onToolCallGenerated?.(toolCall);
  };

  const handleValidationChange = (valid: boolean) => {
    setIsValid(valid);
  };

  const handleExecute = () => {
    if (isValid && toolCallJson) {
      onExecute?.(toolCallJson);
    }
  };

  return (
    <div className="input-panel">
      <div className="input-panel-header">
        <div className="mode-tabs">
          <button
            className={`mode-tab ${inputMode === 'natural' ? 'active' : ''}`}
            onClick={() => handleModeChange('natural')}
          >
            자연어 입력
          </button>
          <button
            className={`mode-tab ${inputMode === 'json' ? 'active' : ''}`}
            onClick={() => handleModeChange('json')}
          >
            JSON 에디터
          </button>
        </div>
        
        <div className="input-actions">
          <button
            className="execute-btn primary"
            disabled={!isValid || !toolCallJson}
            onClick={handleExecute}
          >
            실행
          </button>
        </div>
      </div>

      <div className="input-panel-content">
        {inputMode === 'natural' ? (
          <NaturalLanguageInput
            onToolCallGenerated={handleToolCallChange}
            onValidationChange={handleValidationChange}
          />
        ) : (
          <JsonEditor
            value={toolCallJson}
            onChange={handleToolCallChange}
            onValidationChange={handleValidationChange}
          />
        )}
      </div>
    </div>
  );
};