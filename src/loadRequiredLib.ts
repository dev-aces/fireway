import { ILogger } from './logger';

export const loadRequiredLib = (requireLibPath: string, logger: ILogger) => {
  if (requireLibPath) {
    try {
      require(requireLibPath);
    } catch (e) {
      logger.error(e);
      throw new Error(`Trouble executing require('${requireLibPath}');`);
    }
  }
};
