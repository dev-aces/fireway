#!/usr/bin/env node

import sade from 'sade';
import { MigrateProps, migrate } from './migrate';
// @ts-ignore
import pkg from '../package.json' assert { type: 'json' };

const prog = sade('@dev-aces/fireway').version(pkg.version);

prog
  .command('migrate')
  .option('--path', 'Path to migration files', './migrations')
  .option(
    '--collection',
    'Firebase collection name for migration results',
    'fireway',
  )
  .option('--dryRun', 'Simulates changes')
  .option('--require', 'Requires a module before executing')
  .option('--logLevel', 'Log level, options: debug | log | warn | error', 'log')
  .describe('Migrates schema to the latest version')
  .example('migrate')
  .example('migrate --path=./my-migrations')
  .example('migrate --collection=fireway')
  .example('migrate --dryRun')
  .example('migrate --require="ts-node/register"')
  .example('migrate --logLevel=debug')
  .action(async (opts: MigrateProps) => {
    try {
      await migrate(opts);
    } catch (e: any) {
      console.error('ERROR:', e.message);
      process.exit(1);
    }
  });

prog.parse(process.argv);
