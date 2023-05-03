import { App, initializeApp } from 'firebase-admin/app';
import semver from 'semver';
import { getMigrationFiles } from './getMigrationFiles';
import { ConsoleLogger, LogLevel } from './logger';

import {
  Firestore,
  QuerySnapshot,
  //   getFirestore,
} from 'firebase-admin/firestore';
import { loadRequiredLib } from './loadRequiredLib';
import { IMigrationResult } from './types/IMigrationResult';
import { IStatistics } from './types/IStatistics';
import { proxyWritableMethods } from './proxyWritableMethods';
import { migrateScript } from './migrateScript';

interface MigrateProps {
  path: string;
  dryRun?: boolean;
  require?: string;
  logLevel?: LogLevel;
  // might be passed from tests
  app?: App;
  firestore?: Firestore;
}

export const migrate = async ({
  path: dir,
  dryRun = false,
  require: requireLibPath,
  logLevel = LogLevel.debug,
  app,
}: MigrateProps) => {
  const logger = new ConsoleLogger(logLevel);

  if (requireLibPath) {
    loadRequiredLib(requireLibPath, logger);
  }

  const stats: IStatistics = {
    scannedFiles: 0,
    executedFiles: 0,
    created: 0,
    set: 0,
    updated: 0,
    deleted: 0,
    added: 0,
  };

  let files = await getMigrationFiles(dir);

  stats.scannedFiles = files.length;
  logger.log(
    `Found ${stats.scannedFiles} migration file${
      stats.scannedFiles === 1 ? '' : 's'
    } at "${dir}"`,
  );
  if (dryRun) {
    logger.log(`Dry run mode, no records will be touched`);
  }

  // might be passed from tests
  if (!app) {
    app = initializeApp();
  }

  // Create a new instance of Firestore, so we can override WriteBatch prototypes
  const firestore = new Firestore({
    projectId: app.options.projectId,
  });

  // Extend Firestore instance with the "stats" field,
  // so it can be used inside proxyWritableMethods
  (firestore as any).stats = stats;
  proxyWritableMethods({ logger, dryRun });

  const collection = firestore.collection('migrations');

  // Get the latest migration
  const result = (await collection
    .orderBy('installed_rank', 'desc')
    .limit(1)
    .get()) as QuerySnapshot<IMigrationResult>;
  const [latestDoc] = result.docs;

  const latest = latestDoc?.data();
  if (latest && !latest.success) {
    throw new Error(
      `Migration to version ${latest.version} using ${latest.script} failed! Please restore backups and roll back database and code!`,
    );
  }

  // Filter out applied migration files
  const targetFiles = latest?.version
    ? files.filter((file) => semver.gt(file.version, latest.version))
    : [...files];

  // Sort them by semver
  targetFiles.sort((f1, f2) => semver.compare(f1.version, f2.version) ?? 0);

  logger.log(
    `Executing ${targetFiles.length} migration file${
      targetFiles.length === 1 ? '' : 's'
    } at "${dir}"`,
  );

  let installed_rank = -1;
  if (latest) {
    installed_rank = latest.installed_rank;
  }

  // Execute them in order
  for (const file of targetFiles) {
    stats.executedFiles += 1;
    logger.debug(`Running "${file.filename}"`, file.filename);

    installed_rank += 1;

    const migrationResult = await migrateScript({
      logger,
      app,
      firestore,
      dryRun,
      installed_rank,
      file,
    });

    // Freeze stat tracking
    stats.frozen = true;
    try {
      const id = `v${file.version}__${file.description}`;
      await collection.doc(id).set(migrationResult);
    } finally {
      // Unfreeze stat tracking
      delete stats.frozen;
    }

    if (!migrationResult.success) {
      throw new Error('Stopped at first failure');
    }
  }

  const { scannedFiles, executedFiles, added, created, updated, set, deleted } =
    stats;
  logger.log('Finished all firestore migrations');
  logger.log(`Files scanned: ${scannedFiles}, executed: ${executedFiles}`);
  if (executedFiles > 0) {
    logger.log(
      `Docs added: ${added}, created: ${created}, updated: ${updated}, set: ${set}, deleted: ${deleted}`,
    );
  }

  return stats;
};
