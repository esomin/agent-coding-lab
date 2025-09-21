// Main layout component for the application

import React from 'react';
import type { ReactNode } from 'react';
import './MainLayout.css';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="main-layout">
      <header className="main-header">
        <div className="header-content">
          <h1 className="app-title">MCP Callflow</h1>
          <div className="header-actions">
            <button className="connection-status">
              <span className="status-indicator disconnected"></span>
              Disconnected
            </button>
          </div>
        </div>
      </header>
      
      <div className="main-content">
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <div className="nav-section">
              <h3>Tools</h3>
              <ul>
                <li><a href="#input">Input</a></li>
                <li><a href="#flow">Flow</a></li>
                <li><a href="#response">Response</a></li>
              </ul>
            </div>
            <div className="nav-section">
              <h3>Sessions</h3>
              <ul>
                <li><a href="#sessions">Manage Sessions</a></li>
                <li><a href="#settings">Settings</a></li>
              </ul>
            </div>
          </nav>
        </aside>
        
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
};