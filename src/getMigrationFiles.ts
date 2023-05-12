import { existsSync, promises } from 'fs';
import path from 'path';
import semver from 'semver';
import { IMigrationFileMeta } from './types/IMigrationFileMeta';

export const getMigrationFiles = async (dir: string) => {
  // Get all the scripts
  if (!path.isAbsolute(dir)) {
    dir = path.join(process.cwd(), dir);
  }

  if (!existsSync(dir)) {
    throw new Error(`No directory at ${dir}`);
  }

  const filenames: string[] = [];
  for (const file of await promises.readdir(dir)) {
    if (!(await promises.stat(path.join(dir, file))).isDirectory()) {
      filenames.push(file);
    }
  }

  // Parse the version numbers from the script filenames
  const versionToFile = new Map();

  const files = filenames
    .map((filename) => {
      // Skip files that start with a dot
      if (filename[0] === '.') return null;

      const [filenameVersion, description] = filename.split('__');
      const coerced = semver.coerce(filenameVersion);

      if (!coerced) {
        if (description) {
          throw new Error(
            `This filename doesn't match the required format 'v0.0.0__description', please provide semver for: ${filename}`,
          );
        }
        return null;
      }

      // If there's a version, but no description, we have an issue
      if (!description) {
        throw new Error(
          `This filename doesn't match the required format 'v0.0.0__description', please provide description for: ${filename}`,
        );
      }

      const { version } = coerced;

      const existingFile = versionToFile.get(version);
      if (existingFile) {
        throw new Error(
          `Both ${filename} and ${existingFile} have the same version`,
        );
      }

      versionToFile.set(version, filename);

      return {
        filename,
        path: path.join(dir, filename),
        version: version!,
        description: path.basename(description, path.extname(description)),
      } as IMigrationFileMeta;
    })
    .filter(Boolean)
    .map((f) => f!);

  return files;
};
