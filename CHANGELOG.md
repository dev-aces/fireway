# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Modular system

- Rewrote the forked code to use the modern [Modular Firebase SDK](https://firebase.google.com/docs/web/modular-upgrade).

### Options

- Added `collection` parameter - Firebase collection name for migration results (default "fireway")
- Added `logLevel` parameter - log level, options: debug, log, warn, error (default "log"). It is not so verbose by default in comparison with the forked repository.

### Logs

- Added logging when the database is up to date.
- Displaying the current version of database after migrations run.

### Re-running

- If a migration has failed, the next cli execution with re-run that migration. The forked repository just stopped with an error message.

### Code refactored

- Rewrote JavaScript code (except tests) to TypeScript. Introduced a function per file instead of one huge file.
- Removed a complex NodeJS code that tried to calculate hanged async migration tasks.