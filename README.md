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

export async function migrate({ firestore, /* app */ }: IMigrationFunctionsArguments) {
  await firestore
    .collection('my_table')
    .doc('document_id')
    .set({ name: 'Fireway' });
}
```

JavaScript example:

```js
// ./migrations/v0.0.1__javascript_example.js

module.exports.migrate = async ({ firestore, /* app */ }) => {
  await firestore
    .collection('my_table')
    .doc('document_id')
    .set({ name: 'Fireway' });
};
```

## Install

1. Install NPM package:

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

   To connect to the local emulator `GCLOUD_PROJECT` environment variable is required but can have any value, e.g. "local". Specify `FIRESTORE_EMULATOR_HOST` variable pointing to your local emulator (default Firestore port is `8080`).

   For TypeScript:

   ```bash
   GCLOUD_PROJECT=local FIRESTORE_EMULATOR_HOST=localhost:8080 @dev-aces/fireway --require="ts-node/register" migrate
   ```

   For JavaScript:

   ```bash
   GCLOUD_PROJECT=local FIRESTORE_EMULATOR_HOST=localhost:8080 @dev-aces/fireway migrate
   ```

## Migration results

Migration results are stored in the `migrations` collection in `Firestore` in the format `[v[semver]__[description]`.

```js
// /migrations/v0.0.1__typescript_example

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

## CLI

```bash
Usage
  $ @dev-aces/fireway migrate [options]

Available Commands
  migrate    Migrates schema to the latest version

For more info, run any command with the `--help` flag
  $ @dev-aces/fireway migrate --help

Options
  --path           Path to migration files  (default ./migrations)
  --require        Requires a module before executing, example with TypeScript compiler: @dev-aces/fireway --require="ts-node/register" migrate
  --dryRun         Simulates changes
  -v, --version    Displays current version
  -h, --help       Displays this message
```

## Contributing

Fork the repository, make changes, ensure that project is tested:

```bash
$ npm install
$ npm setup
$ npm run build && npm run test
```

Create a PR.

## History

Based on [kevlened/fireway](https://github.com/kevlened/fireway) work, which was inspired by [flyway](https://flywaydb.org/)

## License

MIT
