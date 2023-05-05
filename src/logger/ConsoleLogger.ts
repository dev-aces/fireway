import { ILogger } from './ILogger';
import { LogLevel, LogLevelString } from './LogLevel';

export class ConsoleLogger implements ILogger {
  private readonly levelOrder: LogLevel = LogLevel.debug;

  constructor(level: LogLevelString) {
    this.levelOrder = LogLevel[level];
  }

  error(message?: any) {
    if (this.levelOrder <= LogLevel.error) {
      console.error(message);
    }
  }

  warn(message?: any, ...optionalParams: any[]) {
    if (this.levelOrder <= LogLevel.warn) {
      console.warn(message, optionalParams);
    }
  }

  log(message?: any) {
    if (this.levelOrder <= LogLevel.log) {
      console.log(message);
    }
  }

  debug(message?: any) {
    if (this.levelOrder <= LogLevel.debug) {
      console.debug(message);
    }
  }
}
