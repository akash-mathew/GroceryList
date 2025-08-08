// Global debug logger for in-app debugging
class DebugLogger {
  private logs: string[] = [];
  private listeners: ((logs: string[]) => void)[] = [];

  log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `${timestamp}: ${message}`;
    
    console.log(logEntry);
    
    this.logs.push(logEntry);
    
    // Keep only last 100 logs to prevent memory issues
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
    
    // Notify listeners
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  addListener(listener: (logs: string[]) => void) {
    this.listeners.push(listener);
  }

  removeListener(listener: (logs: string[]) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  clear() {
    this.logs = [];
    this.listeners.forEach(listener => listener([]));
  }
}

export const debugLogger = new DebugLogger();
