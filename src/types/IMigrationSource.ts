import { IMigrationFunctionsArguments } from './IMigrationFunctionsArguments';

export const IMigrationSource = {
  migrate: (_: IMigrationFunctionsArguments) => Promise<void>,
};
