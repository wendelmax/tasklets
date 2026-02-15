export interface TaskletsConfig {
  maxWorkers?: number | 'auto';          // Number of worker threads (or 'auto' for CPU count)
  minWorkers?: number;                   // Minimum workers to keep alive
  idleTimeout?: number;          // Time in ms before killing idle workers
  timeout?: number;              // Global task timeout
  logging?: 'debug' | 'info' | 'warn' | 'error' | 'none';
  workload?: 'cpu' | 'io' | 'mixed';    // Optimizes scheduler for workload type
  adaptive?: boolean;                    // Enable adaptive mode for auto-scaling
  maxMemory?: number;                    // Max memory usage in % (0-100). Safety limit (1 worker) at 5% free RAM.
  allowedModules?: string[];             // Optional allowlist for paths allowed in MODULE: prefix
}

export interface TaskletStats {
  activeTasks: number;
  activeWorkers: number;
  totalWorkers: number;
  queuedTasks: number;
  idleWorkers: number;
  throughput: number;
  avgTaskTime: number;
  workers: number;
  config: TaskletsConfig;
}

export declare class Tasklets {
  constructor(config?: TaskletsConfig);

  // Instance Methods
  run<T = any>(task: ((...args: any[]) => T | Promise<T>) | string, ...args: any[]): Promise<T>;
  runAll<T = any>(tasks: Array<((...args: any[]) => T | Promise<T>) | { task: any; args?: any[] }>): Promise<Array<T>>;
  batch<T = any>(tasks: Array<((...args: any[]) => T | Promise<T>) | { task: any; args?: any[]; name?: string }>, options?: { onProgress?: (progress: { completed: number; total: number; percentage: number }) => void }): Promise<Array<{ name: string; result?: T; error?: string; success: boolean }>>;
  retry<T = any>(task: ((...args: any[]) => T | Promise<T>) | string, options?: { attempts?: number; delay?: number; backoff?: number }): Promise<T>;

  configure(config: TaskletsConfig): this;
  enableAdaptiveMode(): this;
  setWorkloadType(type: 'cpu' | 'io' | 'mixed'): this;

  getStats(): TaskletStats;
  getHealth(): { status: string; workers: number; memoryUsagePercent: number };

  terminate(): Promise<void>;
  shutdown(): Promise<void>;

  // Static Methods (Singleton Proxy)
  static run<T = any>(task: ((...args: any[]) => T | Promise<T>) | string, ...args: any[]): Promise<T>;
  static runAll<T = any>(tasks: Array<any>): Promise<Array<T>>;
  static batch<T = any>(tasks: Array<any>, options?: any): Promise<Array<T>>;
  static configure(config: TaskletsConfig): void;
  static getStats(): TaskletStats;
  static getHealth(): any;
  static terminate(): Promise<void>;
  static shutdown(): Promise<void>;
}

export default Tasklets;