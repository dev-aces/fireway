export interface ILogger {
  error: (message?: any) => void;
  warn: (message?: any) => void;
  log: (message?: any) => void;
  debug: (message?: any) => void;
}
