import { ILogger } from "./ILogger";
import { LogLevel } from "./LogLevel";

export class ConsoleLogger implements ILogger {
  constructor(public readonly level: LogLevel) {}

  error(message?: any, ...optionalParams: any[]) {
    if (this.level <= LogLevel.error) {
      console.error(message, optionalParams);
    }
  }
  
  warn(message?: any, ...optionalParams: any[]) {
    if (this.level <= LogLevel.warn) {
      console.warn(message, optionalParams);
    }
  }

  log(message?: any, ...optionalParams: any[]) {
    if (this.level <= LogLevel.log) {
      console.log(message, optionalParams);
    }
  }

  debug(message?: any, ...optionalParams: any[]) {
    if (this.level <= LogLevel.debug) {
      console.debug(message, optionalParams);
    }
  }
}
