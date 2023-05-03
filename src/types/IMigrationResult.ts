export interface IMigrationResult {
  installed_rank: number;
  description: string;
  version: string;
  script: string;
  type: string;
  checksum: string;
  installed_by: string;
  installed_on: Date;
  execution_time: number;
  success: boolean;
}
