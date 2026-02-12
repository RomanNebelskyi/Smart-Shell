import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { History, HistoryEntry } from "../interfaces/history.js";

export class HistoryService {
  private historyFile: string;
  private maxEntries = 100;

  constructor() {
    this.historyFile = path.join(os.homedir(), ".smart-shell-history.json");
  }

  private loadHistory(): History {
    try {
      if (fs.existsSync(this.historyFile)) {
        const data = fs.readFileSync(this.historyFile, "utf-8");
        return JSON.parse(data);
      }
    } catch (error) {
      if (process.env.SMART_DEBUG) {
        console.error("Error loading history:", error);
      }
    }
    return { entries: [] };
  }

  private saveHistory(history: History): void {
    try {
      // Keep only last maxEntries
      if (history.entries.length > this.maxEntries) {
        history.entries = history.entries.slice(-this.maxEntries);
      }
      fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2), {
        mode: 0o600,
      });
    } catch (error) {
      if (process.env.SMART_DEBUG) {
        console.error("Error saving history:", error);
      }
    }
  }

  public addEntry(entry: Omit<HistoryEntry, "timestamp">): void {
    const history = this.loadHistory();
    history.entries.push({
      ...entry,
      timestamp: new Date().toISOString(),
    });
    this.saveHistory(history);
  }

  public getRecent(count: number = 10): HistoryEntry[] {
    const history = this.loadHistory();
    return history.entries.slice(-count).reverse();
  }

  public clear(): void {
    this.saveHistory({ entries: [] });
  }
}

export const historyService = new HistoryService();
