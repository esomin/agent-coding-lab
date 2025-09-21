import React, { useState, useCallback, useMemo } from 'react';

export interface SearchFilter {
  type: 'key' | 'value' | 'both';
  dataType: 'all' | 'string' | 'number' | 'boolean' | 'object' | 'array';
  caseSensitive: boolean;
  useRegex: boolean;
}

export interface FilterRule {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'exists' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string;
  enabled: boolean;
}

interface AdvancedSearchProps {
  onSearch: (term: string, filters: SearchFilter) => void;
  onFilter: (rules: FilterRule[]) => void;
  searchTerm: string;
  searchFilters: SearchFilter;
  filterRules: FilterRule[];
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onFilter,
  searchTerm,
  searchFilters,
  filterRules
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newRule, setNewRule] = useState<Partial<FilterRule>>({
    field: '',
    operator: 'contains',
    value: '',
    enabled: true
  });

  const handleSearchChange = useCallback((term: string) => {
    onSearch(term, searchFilters);
  }, [onSearch, searchFilters]);

  const handleFilterChange = useCallback((key: keyof SearchFilter, value: any) => {
    const newFilters = { ...searchFilters, [key]: value };
    onSearch(searchTerm, newFilters);
  }, [onSearch, searchTerm, searchFilters]);

  const addFilterRule = useCallback(() => {
    if (!newRule.field || !newRule.value) return;
    
    const rule: FilterRule = {
      id: `rule-${Date.now()}`,
      field: newRule.field!,
      operator: newRule.operator!,
      value: newRule.value!,
      enabled: newRule.enabled!
    };
    
    const updatedRules = [...filterRules, rule];
    onFilter(updatedRules);
    
    setNewRule({
      field: '',
      operator: 'contains',
      value: '',
      enabled: true
    });
  }, [newRule, filterRules, onFilter]);

  const removeFilterRule = useCallback((ruleId: string) => {
    const updatedRules = filterRules.filter(rule => rule.id !== ruleId);
    onFilter(updatedRules);
  }, [filterRules, onFilter]);

  const toggleFilterRule = useCallback((ruleId: string) => {
    const updatedRules = filterRules.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    );
    onFilter(updatedRules);
  }, [filterRules, onFilter]);

  const operatorOptions = useMemo(() => [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'regex', label: 'Regex' },
    { value: 'exists', label: 'Exists' },
    { value: 'gt', label: 'Greater than' },
    { value: 'lt', label: 'Less than' },
    { value: 'gte', label: 'Greater or equal' },
    { value: 'lte', label: 'Less or equal' }
  ], []);

  return (
    <div className="advanced-search">
      {/* Basic Search */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
        <input
          type="text"
          placeholder="Search in JSON..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={{
            flex: 1,
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.25rem',
            fontSize: '0.875rem'
          }}
        />
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.25rem',
            background: isExpanded ? '#f3f4f6' : 'white',
            cursor: 'pointer',
            fontSize: '0.75rem'
          }}
        >
          {isExpanded ? 'Simple' : 'Advanced'}
        </button>
      </div>

      {/* Advanced Search Options */}
      {isExpanded && (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1rem',
          backgroundColor: '#f9fafb',
          marginBottom: '0.5rem'
        }}>
          {/* Search Options */}
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600' }}>
              Search Options
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                <input
                  type="radio"
                  name="searchType"
                  checked={searchFilters.type === 'both'}
                  onChange={() => handleFilterChange('type', 'both')}
                />
                Keys & Values
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                <input
                  type="radio"
                  name="searchType"
                  checked={searchFilters.type === 'key'}
                  onChange={() => handleFilterChange('type', 'key')}
                />
                Keys Only
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                <input
                  type="radio"
                  name="searchType"
                  checked={searchFilters.type === 'value'}
                  onChange={() => handleFilterChange('type', 'value')}
                />
                Values Only
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                <input
                  type="checkbox"
                  checked={searchFilters.caseSensitive}
                  onChange={(e) => handleFilterChange('caseSensitive', e.target.checked)}
                />
                Case Sensitive
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                <input
                  type="checkbox"
                  checked={searchFilters.useRegex}
                  onChange={(e) => handleFilterChange('useRegex', e.target.checked)}
                />
                Use Regex
              </label>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', marginRight: '0.5rem' }}>Data Type:</label>
              <select
                value={searchFilters.dataType}
                onChange={(e) => handleFilterChange('dataType', e.target.value)}
                style={{
                  padding: '0.25rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem'
                }}
              >
                <option value="all">All Types</option>
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="object">Object</option>
                <option value="array">Array</option>
              </select>
            </div>
          </div>

          {/* Filter Rules */}
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600' }}>
              Filter Rules
            </h4>
            
            {/* Add New Rule */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr auto',
              gap: '0.5rem',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <input
                type="text"
                placeholder="Field path (e.g., data.user.name)"
                value={newRule.field || ''}
                onChange={(e) => setNewRule({ ...newRule, field: e.target.value })}
                style={{
                  padding: '0.25rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem'
                }}
              />
              <select
                value={newRule.operator || 'contains'}
                onChange={(e) => setNewRule({ ...newRule, operator: e.target.value as FilterRule['operator'] })}
                style={{
                  padding: '0.25rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem'
                }}
              >
                {operatorOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Value"
                value={newRule.value || ''}
                onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                style={{
                  padding: '0.25rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem'
                }}
              />
              <button
                onClick={addFilterRule}
                disabled={!newRule.field || !newRule.value}
                style={{
                  padding: '0.25rem 0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  opacity: (!newRule.field || !newRule.value) ? 0.5 : 1
                }}
              >
                Add
              </button>
            </div>

            {/* Existing Rules */}
            {filterRules.map((rule) => (
              <div
                key={rule.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: rule.enabled ? '#ffffff' : '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.25rem',
                  marginBottom: '0.25rem',
                  fontSize: '0.75rem'
                }}
              >
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => toggleFilterRule(rule.id)}
                />
                <span style={{ flex: 1, opacity: rule.enabled ? 1 : 0.6 }}>
                  <strong>{rule.field}</strong> {rule.operator} "{rule.value}"
                </span>
                <button
                  onClick={() => removeFilterRule(rule.id)}
                  style={{
                    padding: '0.25rem',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: '#ef4444',
                    fontSize: '0.75rem'
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            {filterRules.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic', margin: 0 }}>
                No filter rules defined. Add rules above to filter JSON data.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;