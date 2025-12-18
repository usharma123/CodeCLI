import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
export class SessionManager {
    sessionsDir;
    currentSession = null;
    autoSaveEnabled = true;
    constructor(sessionsDir) {
        this.sessionsDir = sessionsDir || path.join(os.homedir(), ".codecli", "sessions");
    }
    /**
     * Initialize the sessions directory
     */
    async initialize() {
        try {
            await fs.mkdir(this.sessionsDir, { recursive: true });
        }
        catch (error) {
            throw new Error(`Failed to initialize sessions directory: ${error}`);
        }
    }
    /**
     * Generate a unique session ID
     */
    generateSessionId() {
        const timestamp = Date.now();
        const date = new Date(timestamp);
        const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
        const timeStr = date.toTimeString().split(" ")[0].replace(/:/g, ""); // HHMMSS
        return `session-${dateStr}-${timeStr}`;
    }
    /**
     * Create a new session
     */
    createSession(projectPath = process.cwd()) {
        const id = this.generateSessionId();
        this.currentSession = {
            metadata: {
                id,
                projectPath,
                createdAt: Date.now(),
                lastModified: Date.now(),
                messageCount: 0,
                summary: "New session",
                tags: []
            },
            messages: [],
            todos: { todos: [], lastUpdated: 0 },
            workingDirectory: projectPath,
            toolCallHistory: [],
            tokens: { estimated: 0, cost: 0 }
        };
        return this.currentSession;
    }
    /**
     * Save session to disk
     */
    async saveSession(data) {
        await this.initialize();
        const sessionPath = path.join(this.sessionsDir, `${data.metadata.id}.json`);
        // Update metadata
        data.metadata.lastModified = Date.now();
        data.metadata.messageCount = data.messages.length;
        // Generate summary from first user message if not set
        if (data.metadata.summary === "New session" && data.messages.length > 0) {
            const firstUserMsg = data.messages.find((m) => m.role === "user");
            if (firstUserMsg) {
                const content = typeof firstUserMsg.content === "string"
                    ? firstUserMsg.content
                    : firstUserMsg.content[0]?.text || "New session";
                data.metadata.summary = content.substring(0, 100);
            }
        }
        try {
            await fs.writeFile(sessionPath, JSON.stringify(data, null, 2), "utf-8");
        }
        catch (error) {
            throw new Error(`Failed to save session: ${error}`);
        }
    }
    /**
     * Load session from disk
     */
    async loadSession(id) {
        await this.initialize();
        const sessionPath = path.join(this.sessionsDir, `${id}.json`);
        try {
            const content = await fs.readFile(sessionPath, "utf-8");
            const data = JSON.parse(content);
            this.currentSession = data;
            return data;
        }
        catch (error) {
            if (error.code === "ENOENT") {
                throw new Error(`Session not found: ${id}`);
            }
            throw new Error(`Failed to load session: ${error}`);
        }
    }
    /**
     * List all sessions
     */
    async listSessions() {
        await this.initialize();
        try {
            const files = await fs.readdir(this.sessionsDir);
            const sessionFiles = files.filter(f => f.endsWith(".json"));
            const sessions = [];
            for (const file of sessionFiles) {
                try {
                    const sessionPath = path.join(this.sessionsDir, file);
                    const content = await fs.readFile(sessionPath, "utf-8");
                    const data = JSON.parse(content);
                    sessions.push(data.metadata);
                }
                catch (error) {
                    // Skip corrupted session files
                    continue;
                }
            }
            // Sort by last modified (most recent first)
            sessions.sort((a, b) => b.lastModified - a.lastModified);
            return sessions;
        }
        catch (error) {
            return [];
        }
    }
    /**
     * Find the most recent session for the current project
     */
    async findRecentSessionForProject(projectPath = process.cwd()) {
        const sessions = await this.listSessions();
        const projectSessions = sessions.filter(s => s.projectPath === projectPath);
        if (projectSessions.length === 0) {
            return null;
        }
        // Return the most recent one
        return await this.loadSession(projectSessions[0].id);
    }
    /**
     * Delete a session
     */
    async deleteSession(id) {
        const sessionPath = path.join(this.sessionsDir, `${id}.json`);
        try {
            await fs.unlink(sessionPath);
        }
        catch (error) {
            if (error.code === "ENOENT") {
                throw new Error(`Session not found: ${id}`);
            }
            throw new Error(`Failed to delete session: ${error}`);
        }
    }
    /**
     * Auto-save current session
     */
    async autoSave(messages, todos, tokens) {
        if (!this.autoSaveEnabled || !this.currentSession) {
            return;
        }
        this.currentSession.messages = messages;
        this.currentSession.todos = todos;
        this.currentSession.tokens = tokens;
        await this.saveSession(this.currentSession);
    }
    /**
     * Get current session
     */
    getCurrentSession() {
        return this.currentSession;
    }
    /**
     * Set current session
     */
    setCurrentSession(session) {
        this.currentSession = session;
    }
    /**
     * Enable/disable auto-save
     */
    setAutoSave(enabled) {
        this.autoSaveEnabled = enabled;
    }
    /**
     * Export session summary
     */
    async exportSummary(id) {
        const data = await this.loadSession(id);
        const metadata = data.metadata;
        let summary = `Session: ${metadata.id}\n`;
        summary += `Created: ${new Date(metadata.createdAt).toLocaleString()}\n`;
        summary += `Last Modified: ${new Date(metadata.lastModified).toLocaleString()}\n`;
        summary += `Project: ${metadata.projectPath}\n`;
        summary += `Messages: ${metadata.messageCount}\n`;
        summary += `Tokens: ${data.tokens.estimated} (Est. Cost: $${data.tokens.cost.toFixed(4)})\n`;
        summary += `Summary: ${metadata.summary}\n`;
        if (metadata.tags.length > 0) {
            summary += `Tags: ${metadata.tags.join(", ")}\n`;
        }
        return summary;
    }
}
// Global singleton
let sessionManagerInstance = null;
export function getSessionManager(sessionsDir) {
    if (!sessionManagerInstance) {
        sessionManagerInstance = new SessionManager(sessionsDir);
    }
    return sessionManagerInstance;
}
