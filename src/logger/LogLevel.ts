export enum LogLevel {
  debug = 0,
  log,
  warn,
  error,
}

export type LogLevelString = keyof typeof LogLevel;
