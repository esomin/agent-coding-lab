// Responsive grid system components

import React from 'react';
import type { ReactNode, CSSProperties } from 'react';
import './GridSystem.css';

interface GridContainerProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

interface GridItemProps {
  children: ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  className?: string;
  style?: CSSProperties;
}

export const GridContainer: React.FC<GridContainerProps> = ({ 
  children, 
  className = '', 
  style 
}) => {
  return (
    <div className={`grid-container ${className}`} style={style}>
      {children}
    </div>
  );
};

export const GridItem: React.FC<GridItemProps> = ({ 
  children, 
  xs = 12, 
  sm, 
  md, 
  lg, 
  xl, 
  className = '', 
  style 
}) => {
  const getGridClasses = () => {
    const classes = [`grid-item-xs-${xs}`];
    
    if (sm !== undefined) classes.push(`grid-item-sm-${sm}`);
    if (md !== undefined) classes.push(`grid-item-md-${md}`);
    if (lg !== undefined) classes.push(`grid-item-lg-${lg}`);
    if (xl !== undefined) classes.push(`grid-item-xl-${xl}`);
    
    return classes.join(' ');
  };

  return (
    <div className={`grid-item ${getGridClasses()} ${className}`} style={style}>
      {children}
    </div>
  );
};

// Panel component for content sections
interface PanelProps {
  children: ReactNode;
  title?: string;
  className?: string;
  style?: CSSProperties;
}

export const Panel: React.FC<PanelProps> = ({ 
  children, 
  title, 
  className = '', 
  style 
}) => {
  return (
    <div className={`panel ${className}`} style={style}>
      {title && (
        <div className="panel-header">
          <h3 className="panel-title">{title}</h3>
        </div>
      )}
      <div className="panel-content">
        {children}
      </div>
    </div>
  );
};