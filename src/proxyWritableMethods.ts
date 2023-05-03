import { WriteBatch, CollectionReference } from 'firebase-admin/firestore';
import { IStatistics } from './types/IStatistics';
import { ILogger } from './logger';

let proxied = false;

export const proxyWritableMethods = ({
  logger,
  dryRun,
}: {
  logger: ILogger;
  dryRun: boolean;
}) => {
  // Only proxy once
  if (proxied) {
    return;
  } else {
    proxied = true;
  }

  let firewayQueue: (() => void)[] = [];

  const ogCommit = WriteBatch.prototype.commit;
  WriteBatch.prototype.commit = async function (...args) {
    // Empty the queue
    while (firewayQueue.length) {
      const fn = firewayQueue.shift()!;
      fn();
    }
    if (dryRun) {
      return [];
    }

    return ogCommit.apply(this, Array.from(args) as any);
  };

  const skipWriteBatch = Symbol('Skip the WriteBatch proxy');

  function mitm(
    prototype: any,
    key: string,
    fn: (args: any[], stats: IStatistics, logger: ILogger) => void,
  ) {
    const original = prototype[key];
    prototype[key] = function () {
      const args = [...arguments];
      const stats = this._firestore.stats as IStatistics;
      // If this is a batch
      if (this instanceof WriteBatch) {
        const [_, doc] = args;
        if (doc && doc[skipWriteBatch]) {
          delete doc[skipWriteBatch];
        } else if (!stats.frozen) {
          firewayQueue.push(() => {
            fn.call(this, args, stats, logger);
          });
        }
      } else if (!stats.frozen) {
        fn.call(this, args, stats, logger);
      }

      return original.apply(this, args);
    };
  }

  // Add logs for each WriteBatch item
  mitm(
    WriteBatch.prototype,
    'create',
    ([ref, doc]: any, stats: IStatistics, logger: ILogger) => {
      stats.created += 1;
      logger.debug('Creating', ref.path, JSON.stringify(doc));
    },
  );

  mitm(
    WriteBatch.prototype,
    'set',
    (
      [ref, doc, opts = {} as { merge?: boolean }]: any,
      stats: IStatistics,
      logger: ILogger,
    ) => {
      stats.set += 1;
      logger.debug(
        opts.merge ? 'Merging' : 'Setting',
        ref.path,
        JSON.stringify(doc),
      );
    },
  );

  mitm(
    WriteBatch.prototype,
    'update',
    ([ref, doc]: any, stats: IStatistics, logger: ILogger) => {
      stats.updated += 1;
      logger.debug('Updating', ref.path, JSON.stringify(doc));
    },
  );

  mitm(
    WriteBatch.prototype,
    'delete',
    ([ref], stats: IStatistics, logger: ILogger) => {
      stats.deleted += 1;
      logger.debug('Deleting', ref.path);
    },
  );

  mitm(
    CollectionReference.prototype,
    'add',
    ([data], stats: IStatistics, logger: ILogger) => {
      data[skipWriteBatch] = true;
      stats.added += 1;
      logger.debug('Adding', JSON.stringify(data));
    },
  );
};
