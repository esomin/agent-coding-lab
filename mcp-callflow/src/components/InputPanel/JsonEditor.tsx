// Enhanced JSON editor component using Monaco Editor

import React from 'react';
import { MonacoEditor } from './MonacoEditor';
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
  return (
    <div className="json-editor">
      <MonacoEditor
        value={value}
        onChange={onChange}
        onValidationChange={onValidationChange}
        language="json"
        theme="light"
        height="400px"
      />
      
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