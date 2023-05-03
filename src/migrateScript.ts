import { App } from 'firebase-admin/app';
import { ILogger } from './logger';
import { IMigrationFileMeta } from './types/IMigrationFileMeta';
import { Firestore } from 'firebase-admin/firestore';
import md5 from 'md5';
import { userInfo } from 'os';
import { IMigrationResult } from './types/IMigrationResult';
import path from 'path';
import { promises } from 'fs';

export const migrateScript = async ({
  logger,
  file,
  app,
  firestore,
  dryRun,
  installed_rank,
}: {
  logger: ILogger;
  file: IMigrationFileMeta;
  app: App;
  firestore: Firestore;
  dryRun: boolean;
  installed_rank: number;
}) => {
  let migrationScript: any;
  try {
    migrationScript = require(file.path);
  } catch (e) {
    logger.error(e);
    throw e;
  }

  let success = false;
  let start: Date, finish: Date;
  start = new Date();
  try {
    await migrationScript.migrate({
      app,
      firestore,
      dryRun,
    });
    success = true;
  } catch (e) {
    logger.error(`Error in ${file.filename}`, e);
  } finally {
    finish = new Date();
  }

  // Upload the results
  logger.debug(`Uploading the results for ${file.filename}`);

  const migrationResult: IMigrationResult = {
    installed_rank,
    description: file.description,
    version: file.version,
    script: file.filename,
    type: path.extname(file.filename).slice(1),
    checksum: md5(await promises.readFile(file.path)) as string,
    installed_by: userInfo().username,
    installed_on: start,
    execution_time: finish.getTime() - start.getTime(),
    success,
  };

  return migrationResult;
};
