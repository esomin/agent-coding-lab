// Session management service implementation

import type { SessionManager as ISessionManager } from './interfaces';
import type { PlaygroundSession, SessionMetadata } from '../types';

export class SessionManager implements ISessionManager {
  private readonly STORAGE_KEY = 'mcp-callflow-sessions';
  private readonly METADATA_KEY = 'mcp-callflow-session-metadata';

  async saveSession(session: PlaygroundSession): Promise<string> {
    try {
      const sessions = await this.getAllSessions();
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = { ...session, updatedAt: Date.now() };
      } else {
        sessions.push(session);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
      await this.updateMetadata(session);
      
      return session.id;
    } catch (error) {
      throw new Error(`Failed to save session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadSession(sessionId: string): Promise<PlaygroundSession> {
    try {
      const sessions = await this.getAllSessions();
      const session = sessions.find(s => s.id === sessionId);
      
      if (!session) {
        throw new Error(`Session with id ${sessionId} not found`);
      }
      
      return session;
    } catch (error) {
      throw new Error(`Failed to load session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async exportSession(sessionId: string): Promise<Blob> {
    try {
      const session = await this.loadSession(sessionId);
      const exportData = {
        version: '1.0',
        exportedAt: Date.now(),
        session
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      return new Blob([jsonString], { type: 'application/json' });
    } catch (error) {
      throw new Error(`Failed to export session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async importSession(file: File): Promise<PlaygroundSession> {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      // Validate import data structure
      if (!importData.session || !importData.version) {
        throw new Error('Invalid session file format');
      }
      
      const session = importData.session as PlaygroundSession;
      
      // Validate session structure
      this.validateSessionStructure(session);
      
      // Generate new ID to avoid conflicts
      const newSession: PlaygroundSession = {
        ...session,
        id: this.generateSessionId(),
        name: `${session.name} (Imported)`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      await this.saveSession(newSession);
      return newSession;
    } catch (error) {
      throw new Error(`Failed to import session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listSessions(): Promise<SessionMetadata[]> {
    try {
      const metadataJson = localStorage.getItem(this.METADATA_KEY);
      if (!metadataJson) {
        return [];
      }
      
      const metadata = JSON.parse(metadataJson) as SessionMetadata[];
      return metadata.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error('Failed to load session metadata, rebuilding...', error);
      return await this.rebuildMetadata();
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      const filteredSessions = sessions.filter(s => s.id !== sessionId);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredSessions));
      
      // Update metadata
      const metadata = await this.listSessions();
      const filteredMetadata = metadata.filter(m => m.id !== sessionId);
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(filteredMetadata));
    } catch (error) {
      throw new Error(`Failed to delete session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getAllSessions(): Promise<PlaygroundSession[]> {
    const sessionsJson = localStorage.getItem(this.STORAGE_KEY);
    if (!sessionsJson) {
      return [];
    }
    
    try {
      return JSON.parse(sessionsJson) as PlaygroundSession[];
    } catch (error) {
      console.error('Failed to parse sessions from localStorage:', error);
      return [];
    }
  }

  private async updateMetadata(session: PlaygroundSession): Promise<void> {
    const metadata = await this.listSessions();
    const existingIndex = metadata.findIndex(m => m.id === session.id);
    
    const sessionMetadata: SessionMetadata = {
      id: session.id,
      name: session.name,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      size: JSON.stringify(session).length
    };
    
    if (existingIndex >= 0) {
      metadata[existingIndex] = sessionMetadata;
    } else {
      metadata.push(sessionMetadata);
    }
    
    localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
  }

  private async rebuildMetadata(): Promise<SessionMetadata[]> {
    const sessions = await this.getAllSessions();
    const metadata: SessionMetadata[] = sessions.map(session => ({
      id: session.id,
      name: session.name,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      size: JSON.stringify(session).length
    }));
    
    localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
    return metadata;
  }

  private validateSessionStructure(session: any): void {
    const requiredFields = ['id', 'name', 'createdAt', 'updatedAt', 'data'];
    for (const field of requiredFields) {
      if (!(field in session)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    if (!session.data.input || !session.data.mcpConfig) {
      throw new Error('Invalid session data structure');
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}