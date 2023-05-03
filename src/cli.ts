#!/usr/bin/env node

import sade from 'sade';
import { migrate } from './migrate';
// @ts-ignore
import pkg from '../package.json' assert { type: 'json' };

const prog = sade('fireway').version(pkg.version);

prog
  .command('migrate')
  .option('--path', 'Path to migration files', './migrations')
  .option('--collection', 'Firebase collection name for migration results', 'migrations')
  .option('--dryRun', 'Simulates changes')
  .option('--require', 'Requires a module before executing')
  .option(
    '--logLevel',
    'Log level (debug | log | warn | error | silent), default: log',
  )
  .describe('Migrates schema to the latest version')
  .example('migrate')
  .example('migrate --path=./my-migrations')
  .example('migrate --collection=flyway')
  .example('migrate --dryRun')
  .example('migrate --require="ts-node/register"')
  .example('migrate --logLevel=silent')
  .action(async (opts: any) => {
    try {
      opts.debug = !opts.quiet;
      await migrate(opts);
    } catch (e: any) {
      console.error('ERROR:', e.message);
      process.exit(1);
    }
  });

prog.parse(process.argv);
