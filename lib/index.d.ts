export declare class Tasklets {
  constructor(config?: { maxWorkers?: number; minWorkers?: number; idleTimeout?: number });
  run<T = any>(task: () => T | Promise<T>, ...args: any[]): Promise<T>;
  runAll<T = any>(tasks: Array<() => T | Promise<T>>): Promise<Array<T>>;
  batch<T = any>(tasks: Array<any>, options?: any): Promise<Array<T>>;
  enableAdaptiveMode(): void;
  setWorkloadType(type: string): void;
  getAdaptiveMetrics(): any;
  terminate(): Promise<void>;
  configure(config: any): void;
  getStats(): any;
  getHealth(): any;
}

declare const tasklets: Tasklets;
export default tasklets;