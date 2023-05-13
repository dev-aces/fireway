# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Fixed

- Synchronized package.lock.json with package.json.

## 2.0.0 - 2023-05-08

### Added

- Added `collection` parameter - Firebase collection name for migration results (default "fireway")
- Added `logLevel` parameter - log level, options: debug, log, warn, error (default "log"). It is not so verbose by default in comparison with the forked repository.
- Added logging when the database is up to date.
- Displaying the current version of database after migrations run.

### Changed

- Rewrote the forked code to use the modern [Modular Firebase SDK](https://firebase.google.com/docs/web/modular-upgrade).
- If a migration has failed, the next cli execution with re-run that migration. The forked repository just stopped with an error message.
- Rewrote JavaScript code (except tests) to TypeScript. Introduced a function per file instead of one huge file.
- Removed a complex NodeJS code that tried to calculate hanged async migration tasks.
- Updated Firebase libraries to the latest versions.

### Fixed

- Added Firebase libraries as peer dependencies
