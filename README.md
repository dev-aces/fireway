# Fireway

A schema migration tool for Firestore.
TypeScript and CommonJS JavaScript languages are supported.

## Usage

Create a migration file in the `functions/migration` (default directory).  
Name the file in the format: `v[semver]__[description].ts` (or `.js`).

TypeScript example:

```ts
// ./migrations/v0.0.1__typescript_example.ts

import { IMigrationFunctionsArguments } from '@dev-aces/fireway';

export async function migrate({ firestore }: IMigrationFunctionsArguments) {
  await firestore
    .collection('my_table')
    .doc('document_id')
    .set({ name: 'Fireway' });
}
```

JavaScript example:

```js
// ./migrations/v0.0.1__javascript_example.js

module.exports.migrate = async ({ firestore }) => {
  await firestore
    .collection('my_table')
    .doc('document_id')
    .set({ name: 'Fireway' });
};
```

### Extended example

The library is using [Modular SDK](https://firebase.google.com/docs/web/modular-upgrade) for app initialization. It is possible to use the `app` argument in migration scripts to initialize another Firebase service, for example, `auth`.

```ts
// ./migrations/v0.2.0__typescript_extended_example.ts
import { IMigrationFunctionsArguments } from '@dev-aces/fireway';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';

export async function migrate({
  firestore,
  app,
}: IMigrationFunctionsArguments) {
  // Auth example
  const firebaseAuth = getAuth(app);
  const email = 'test-user@test.com';
  // search user identity
  const user = await firebaseAuth.getUserByEmail(email);
  if (!user) {
    await firebaseAuth.createUser({
      email: email,
      emailVerified: true,
      disabled: false,
    });
  }

  // FieldValue example
  await firestore.collection('table').doc('123').ref.update({
    obsoleteField: FieldValue.delete(),
    date: FieldValue.serverTimestamp(),
  });
}
```

## Install

1. Install NPM package to Firebase functions projects:

   ```bash
   npm i @dev-aces/fireway
   ```

For TypeScript additionally:

2. Install [`ts-node`](https://www.npmjs.com/package/ts-node):

   ```bash
   npm i ts-node
   ```

3. Add `tsconfig.json` to the `functions` folder. Define a `ts-node` configuration block inside your `tsconfig.json` file:

   ```json
   {
     "ts-node": {
       "transpileOnly": true,
       "compilerOptions": {
         "module": "commonjs"
       }
     }
   }
   ```

## Running locally

Most likely you'll want to test your migration scripts _locally_ first before running them against Cloud instances.

1. Ensure that [Firestore emulator](https://firebase.google.com/docs/emulator-suite/connect_firestore) is set up in `firebase.json` file.

   ```json
   {
     "emulators": {
       "firestore": {
         "port": 8080
       }
     }
   }
   ```

2. Start your local emulators with

   ```bash
   firebase emulators:start
   ```

3. Run migrations.

   To connect to the local emulator `GCLOUD_PROJECT` environment variable is required pointing to your projectId. Check `.firebaserc` file and the `{ "projects": { "default": "[project-id]" }}` settings. If it is not specified, any value can be provided, e.g. "local".  
   Specify `FIRESTORE_EMULATOR_HOST` variable pointing to your local emulator (default Firestore port is `8080`).

   For TypeScript:

   ```bash
   GCLOUD_PROJECT=project-id FIRESTORE_EMULATOR_HOST=localhost:8080 fireway --require="ts-node/register" migrate
   ```

   For JavaScript:

   ```bash
   GCLOUD_PROJECT=project-id FIRESTORE_EMULATOR_HOST=localhost:8080 fireway migrate
   ```

## Migration results

Migration results are stored in the `fireway` collection (can be changed) in `Firestore` in the format `v[semver]__[description]`.

```js
// fireway/v0.0.1__typescript_example

{
  installed_rank: 3, // 0-based sequence
  checksum: 'fdfe6a55a7c97a4346cb59871b4ce97c',
  description: 'typescript_example',
  execution_time: 1221,
  installed_by: 'system_user_name',
  installed_on: Timestamp(),
  script: 'v0.0.1__typescript_example.ts',
  type: 'ts',
  version: '0.0.1',
  success: true
}
```

## Re-running script

If script execution failed, the workflow will be stopped. Running migration again will start from the latest failed script.

## Running in Cloud

1. Generate a Firebase Service Account JSON key by opening: Project Settings -> Service Accounts -> Generate new private key. Private key will have the admin role and contain your project settings.

2. Set up CI provider to use that key.
   For Github Actions, add a secret to the Github repository, e.g. `FIREBASE_SERVICE_ACCOUNT_JSON_DEV`.

   In the Github workflow use `google-github-actions/auth@v1` to load the credentials

   ```
   jobs:
     build_and_deploy:
       runs-on: ubuntu-latest
       name: Dev workflow
       steps:
         - uses: actions/checkout@v3
         - name: 'NPP install and build steps'
           run: |
             echo "your scripts"
         - name: 'Authenticate to Google Cloud'
           uses: 'google-github-actions/auth@v1'
           with:
             credentials_json: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_JSON_DEV }}'
             create_credentials_file: true
             cleanup_credentials: true
         - name: Deploy functions and run migrations
           run: |
             npm run migrate
             firebase deploy --only functions
   ```

   where `package.json` scripts section has:

   ```
   "migrate": "fireway migrate --require=\"ts-node/register\""
   ```

Alternatively use `GOOGLE_APPLICATION_CREDENTIALS` environment variable as described in [Firebase Admin Auth instructions](https://firebase.google.com/docs/admin/setup#initialize_the_sdk_in_non-google_environments).

## CLI

```bash
Usage
  $ fireway migrate [options]

Available Commands
  migrate    Migrates schema to the latest version

For more info, run any command with the `--help` flag
  $ fireway migrate --help

Options
  --path           Path to migration files  (default "./migrations")
  --collection     Firebase collection name for migration results (default "fireway")
  --require        Requires a module before executing, example with TypeScript compiler: fireway migrate --require="ts-node/register"
  --dryRun         Simulates changes
  --logLevel       Log level, options: debug, log, warn, error (default "log")
  -v, --version    Displays current version
  -h, --help       Displays this message
````

## Contributing

Fork the repository, make changes, ensure that project is tested:

```bash
$ npm install
$ npm setup
$ npm run build && npm run test
```

## History

Based on [kevlened/fireway](https://github.com/kevlened/fireway) work, which was inspired by [flyway](https://flywaydb.org/)

## License

MIT
