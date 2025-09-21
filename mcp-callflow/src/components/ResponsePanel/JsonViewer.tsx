import React, { useState, useMemo, useCallback } from 'react';
import { JsonView, allExpanded, darkStyles, defaultStyles } from 'react-json-view-lite';
import AdvancedSearch from './AdvancedSearch';
import { JsonSearchFilter } from '../../utils';
import type { SearchFilter, FilterRule } from './AdvancedSearch';
import type { SearchResult } from '../../utils';

interface JsonViewerProps {
  data: any;
  title?: string;
  maxHeight?: number;
  searchable?: boolean;
  collapsible?: boolean;
  theme?: 'light' | 'dark';
}

// SearchResult is now imported from utils

const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  title,
  maxHeight = 400,
  searchable = true,
  collapsible = true,
  theme = 'light'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [searchFilters, setSearchFilters] = useState<SearchFilter>({
    type: 'both',
    dataType: 'all',
    caseSensitive: false,
    useRegex: false
  });
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
  const [filteredData, setFilteredData] = useState<any>(null);

  // Handle search with advanced filters
  const handleSearch = useCallback((term: string, filters: SearchFilter) => {
    setSearchTerm(term);
    setSearchFilters(filters);
    
    if (!data) {
      setSearchResults([]);
      return;
    }
    
    const results = JsonSearchFilter.search(data, term, filters);
    setSearchResults(results);
    setCurrentSearchIndex(0);
  }, [data]);

  // Handle filter rules
  const handleFilter = useCallback((rules: FilterRule[]) => {
    setFilterRules(rules);
    
    if (!data) {
      setFilteredData(null);
      return;
    }
    
    const filtered = JsonSearchFilter.applyFilters(data, rules);
    setFilteredData(filtered);
  }, [data]);

  // Get search statistics
  const searchStats = useMemo(() => {
    return JsonSearchFilter.getSearchStats(searchResults);
  }, [searchResults]);

  // Navigate search results
  const navigateSearch = useCallback((direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
    
    if (direction === 'next') {
      setCurrentSearchIndex((prev) => (prev + 1) % searchResults.length);
    } else {
      setCurrentSearchIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    }
  }, [searchResults.length]);

  // Memoized processed data for display
  const processedData = useMemo(() => {
    let displayData = filteredData || data;
    
    if (!displayData) return null;
    
    // For very large objects, we might want to truncate or paginate
    const dataSize = JSON.stringify(displayData).length;
    if (dataSize > 1024 * 1024) { // 1MB threshold
      return {
        ...displayData,
        _metadata: {
          originalSize: dataSize,
          truncated: true,
          message: 'Large dataset - some data may be truncated for performance'
        }
      };
    }
    
    return displayData;
  }, [data, filteredData]);

  const jsonViewStyles = theme === 'dark' ? darkStyles : defaultStyles;

  if (!data) {
    return (
      <div className="json-viewer-empty">
        <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
          No data to display
        </p>
      </div>
    );
  }

  return (
    <div className="json-viewer-container">
      {title && (
        <div className="json-viewer-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '0.5rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{title}</h3>
          {collapsible && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'none',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          )}
        </div>
      )}

      {searchable && (
        <div className="json-viewer-search" style={{ marginBottom: '0.5rem' }}>
          <AdvancedSearch
            onSearch={handleSearch}
            onFilter={handleFilter}
            searchTerm={searchTerm}
            searchFilters={searchFilters}
            filterRules={filterRules}
          />
          
          {/* Search Results Navigation */}
          {searchResults.length > 0 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: '#f3f4f6',
              borderRadius: '0.25rem',
              fontSize: '0.75rem'
            }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <span>
                  {currentSearchIndex + 1} of {searchStats.total} matches
                </span>
                <span>
                  Keys: {searchStats.byType.key}, Values: {searchStats.byType.value}
                </span>
                <span>
                  Unique paths: {searchStats.uniquePaths}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  onClick={() => navigateSearch('prev')}
                  disabled={searchResults.length === 0}
                  style={{
                    padding: '0.25rem 0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  Previous
                </button>
                <button
                  onClick={() => navigateSearch('next')}
                  disabled={searchResults.length === 0}
                  style={{
                    padding: '0.25rem 0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isExpanded && (
        <div 
          className="json-viewer-content"
          style={{
            maxHeight: `${maxHeight}px`,
            overflow: 'auto',
            border: '1px solid #e5e7eb',
            borderRadius: '0.25rem',
            padding: '0.5rem',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff'
          }}
        >
          <JsonView
            data={processedData}
            shouldExpandNode={allExpanded}
            style={jsonViewStyles}
          />
        </div>
      )}

      {/* Filter Status */}
      {filterRules.length > 0 && (
        <div style={{ 
          marginTop: '0.5rem', 
          padding: '0.5rem',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '0.25rem',
          fontSize: '0.75rem', 
          color: '#1e40af' 
        }}>
          {filterRules.filter(rule => rule.enabled).length} filter rule(s) applied
          {filteredData && (
            <span style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}>
              (showing filtered results)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default JsonViewer;