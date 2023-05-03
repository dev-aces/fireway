const test = require('tape');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const terminal = require('./console-tester');
let fireway = require('../');

function wrapper(fn) {
  return async (t) => {
    let firestore;
    let testEnv;
    try {
      if (fn) {
        // Clear the require cache
        Object.keys(require.cache).map((key) => {
          delete require.cache[key];
        });
        fireway = require('../');

        // Clear the terminal tracking
        terminal.reset();

        const projectId = `fireway-test-${Date.now()}`;
		
        const testEnv = await initializeTestEnvironment({ projectId });
		
        firestore = testEnv.unauthenticatedContext().firestore();

        await fn({ t, firestore, app: firestore.app });
      }
      t.pass('');
    } catch (e) {
      console.error(e);
      t.fail(e);
    } finally {
      if (testEnv) {
        await testEnv.cleanup();
      }
      t.end();
      if (firestore && firestore.disableNetwork) {
        firestore.disableNetwork();
      }
    }
  };
}

async function assertData(t, firestore, path, value) {
  const ref = await firestore.doc(path).get();
  t.equal(ref.exists, true);
  const data = ref.data();

  if (value.execution_time) {
    t.equal('execution_time' in data, true);
    t.equal(typeof data.execution_time, 'number');
    delete data.execution_time;
    delete value.execution_time;
  }

  if (value.installed_on) {
    t.equal('installed_on' in data, true);
    t.equal('seconds' in data.installed_on, true);
    t.equal('nanoseconds' in data.installed_on, true);
    delete data.installed_on;
    delete value.installed_on;
  }

  if (value.installed_by) {
    t.equal('installed_by' in data, true);
    t.equal(typeof data.installed_by, 'string');
    delete data.installed_by;
    delete value.installed_by;
  }

  t.deepEqual(data, value);
}

test(
  'merge: iterative',
  wrapper(async ({ t, firestore, app }) => {
    // Empty migration
    const stats0 = await fireway.migrate({
      path: __dirname + '/emptyMigration',
      app,
      firestore,
    });
    let snapshot = await firestore.collection('migrations').get();
    t.equal(snapshot.size, 0);

    // First migration
    const stats1 = await fireway.migrate({
      path: __dirname + '/oneMigration',
      app,
      firestore,
    });
    snapshot = await firestore.collection('migrations').get();
    let dataSnapshot = await firestore.collection('data').get();
    t.equal(snapshot.size, 1);
    t.equal(dataSnapshot.size, 1);
    let [doc1] = dataSnapshot.docs;
    t.deepEqual(doc1.data(), { key: 'value' });
    await assertData(t, firestore, 'migrations/0-0.0.0-first', {
      checksum: '3a29bfbd4a83273c613ca3d9bf40e549',
      description: 'first',
      execution_time: 251,
      installed_by: 'len',
      installed_on: {
        seconds: 1564681117,
        nanoseconds: 401000000,
      },
      installed_rank: 0,
      script: 'v0__first.js',
      success: true,
      type: 'js',
      version: '0.0.0',
    });

    // Second migration
    const stats2 = await fireway.migrate({
      path: __dirname + '/iterativeMigration',
      app,
      firestore,
    });
    snapshot = await firestore.collection('migrations').get();
    dataSnapshot = await firestore.collection('data').get();
    t.equal(snapshot.size, 2);
    t.equal(dataSnapshot.size, 2);
    doc1 = dataSnapshot.docs[0];
    const doc2 = dataSnapshot.docs[1];
    t.deepEqual(doc1.data(), { key: 'value' });
    t.deepEqual(doc2.data(), { key: 'value' });
    await assertData(t, firestore, 'migrations/1-0.1.0-second', {
      checksum: '95031069f80997d046b3cf405af9b524',
      description: 'second',
      execution_time: 251,
      installed_by: 'len',
      installed_on: {
        seconds: 1564681117,
        nanoseconds: 401000000,
      },
      installed_rank: 1,
      script: 'v0.1__second.js',
      success: true,
      type: 'js',
      version: '0.1.0',
    });

    t.deepEqual(stats0, {
      scannedFiles: 0,
      executedFiles: 0,
      created: 0,
      set: 0,
      updated: 0,
      deleted: 0,
      added: 0,
    });
    t.deepEqual(stats1, {
      scannedFiles: 1,
      executedFiles: 1,
      created: 0,
      set: 1,
      updated: 0,
      deleted: 0,
      added: 0,
    });
    t.deepEqual(stats2, {
      scannedFiles: 2,
      executedFiles: 1,
      created: 0,
      set: 1,
      updated: 0,
      deleted: 0,
      added: 0,
    });
  }),
);

test(
  'merge: error iterative',
  wrapper(async ({ t, firestore, app }) => {
    try {
      await fireway.migrate({
        path: __dirname + '/errorMigration',
        app,
        firestore,
      });
      t.fail('Should throw an error');
    } catch (e) {
      const snapshot = await firestore.collection('migrations').get();
      t.equal(snapshot.size, 1);
      await assertData(t, firestore, 'migrations/0-0.0.0-error', {
        checksum: '82c81f69f2c5276ef1eefff58c62ce5a',
        description: 'error',
        execution_time: 251,
        installed_by: 'len',
        installed_on: {
          seconds: 1564681117,
          nanoseconds: 401000000,
        },
        installed_rank: 0,
        script: 'v0__error.js',
        success: false,
        type: 'js',
        version: '0.0.0',
      });
    }

    try {
      await fireway.migrate({
        path: __dirname + '/errorIterativeMigration',
        app,
        firestore,
      });
      t.fail('Should throw an error');
    } catch (e) {
      const snapshot = await firestore.collection('migrations').get();
      const dataSnapshot = await firestore.collection('data').get();
      t.equal(snapshot.size, 1);
      t.equal(dataSnapshot.size, 0);
    }
  }),
);

test(
  'dryRun',
  wrapper(async ({ t, firestore, app }) => {
    await fireway.migrate({
      dryRun: true,
      path: __dirname + '/oneMigration',
      app,
      firestore,
    });

    snapshot = await firestore.collection('migrations').get();
    let dataSnapshot = await firestore.collection('data').get();
    t.equal(snapshot.size, 0);
    t.equal(dataSnapshot.size, 0);
  }),
);

test(
  'dryRun: delete',
  wrapper(async ({ t, firestore, app }) => {
    await fireway.migrate({
      path: __dirname + '/oneMigration',
      app,
      firestore,
    });

    let snapshot = await firestore.collection('migrations').get();
    let dataSnapshot = await firestore.collection('data').get();
    t.equal(snapshot.size, 1);
    t.equal(dataSnapshot.size, 1);

    await fireway.migrate({
      dryRun: true,
      path: __dirname + '/deleteMigration',
      app,
      firestore,
    });

    snapshot = await firestore.collection('migrations').get();
    dataSnapshot = await firestore.collection('data').get();
    t.equal(snapshot.size, 2);
    t.equal(dataSnapshot.size, 0);
  }),
);

test(
  'invalid name',
  wrapper(async ({ t, firestore, app }) => {
    try {
      await fireway.migrate({
        path: __dirname + '/invalidNameMigration',
        app,
        firestore,
      });
      t.fail('Should throw an error');
    } catch (e) {
      t.assert(
        /This filename doesn't match the required format.*/.test(e.message),
      );
      const snapshot = await firestore.collection('migrations').get();
      t.equal(snapshot.size, 0);
    }
  }),
);

test(
  'batch: migration count',
  wrapper(async ({ t, firestore, app }) => {
    const stats = await fireway.migrate({
      path: __dirname + '/batchMigration',
      app,
      firestore,
    });

    snapshot = await firestore.collection('migrations').get();
    let dataSnapshot = await firestore.collection('data').get();
    t.equal(snapshot.size, 1);
    t.equal(dataSnapshot.size, 2);
    t.deepEqual(stats, {
      scannedFiles: 1,
      executedFiles: 1,
      created: 0,
      set: 4,
      updated: 0,
      deleted: 0,
      added: 0,
    });
  }),
);

test(
  'all methods',
  wrapper(async ({ t, firestore, app }) => {
    const stats = await fireway.migrate({
      path: __dirname + '/allMethodMigration',
      app,
      firestore,
    });

    const snapshot = await firestore.collection('migrations').get();
    let dataSnapshot = await firestore.collection('data').get();
    t.equal(snapshot.size, 1);
    t.equal(dataSnapshot.size, 1, '"data" collection should have 1 document');
    t.deepEqual(stats, {
      scannedFiles: 1,
      executedFiles: 1,
      created: 0,
      set: 2,
      updated: 2,
      deleted: 2,
      added: 1,
    });
  }),
);

// Bug in "@firebase/rules-unit-testing" FieldValue.Delete is no supported
// https://github.com/firebase/firebase-js-sdk/issues/6077
// Commented the test.
//
// test(
//   'Delete a field',
//   wrapper(async ({ t, firestore, app }) => {
//     await firestore.collection('data').doc('doc').set({
//       field1: 'field1',
//       field2: 'field2',
//     });

//     await fireway.migrate({
//       path: __dirname + '/deleteFieldMigration',
//       app,
//       firestore,
//     });

//     snapshot = await firestore.collection('migrations').get();
//     let dataSnapshot = await firestore.collection('data').get();
//     t.equal(snapshot.size, 1);
//     t.equal(dataSnapshot.size, 1);
//     await assertData(t, firestore, 'data/doc', {
//       field2: 'field2',
//     });
//   }),
// );

test(
  'TypeScript (run all TS last for perf reasons and only require TS once)',
  wrapper(async ({ t, firestore, app }) => {
    const stats = await fireway.migrate({
      path: __dirname + '/tsMigration',
      app,
      firestore,
      require: 'ts-node/register',
    });

    const snapshot = await firestore.collection('migrations').get();
    let dataSnapshot = await firestore.collection('data').get();
    t.equal(snapshot.size, 1);
    t.equal(dataSnapshot.size, 1);
    t.deepEqual(stats, {
      scannedFiles: 1,
      executedFiles: 1,
      created: 0,
      set: 1,
      updated: 0,
      deleted: 0,
      added: 0,
    });

    await assertData(t, firestore, 'migrations/0-0.0.0-first', {
      checksum: '542faba96904b63068c101daeefa2c3e',
      description: 'first',
      execution_time: 251,
      installed_by: 'len',
      installed_on: {
        seconds: 1564681117,
        nanoseconds: 401000000,
      },
      installed_rank: 0,
      script: 'v0__first.ts',
      success: true,
      type: 'ts',
      version: '0.0.0',
    });
  }),
);
