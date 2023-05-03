import { App } from 'firebase-admin/app';
import { Firestore } from 'firebase-admin/firestore';

export interface IMigrationFunctionsArguments {
  app: App;
  firestore: Firestore;
}
