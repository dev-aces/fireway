export interface IStatistics {
  scannedFiles: number;
  executedFiles: number;
  created: number;
  set: number;
  updated: number;
  deleted: number;
  added: number;
  // frozen is used to disable statistics and logs writing when a result is added to collection('migrations')
  frozen?: boolean;
}
