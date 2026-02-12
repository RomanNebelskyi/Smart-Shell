export interface HistoryEntry {
  timestamp: string;
  command: string;
  error: string;
  fix: string;
  source: "handler" | "ai";
  applied: boolean;
}

export interface History {
  entries: HistoryEntry[];
}
