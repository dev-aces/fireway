import { IMigrationFunctionsArguments } from '../../lib';

export async function migrate({ firestore }: IMigrationFunctionsArguments) {
  await firestore.collection('data').doc('one').set({ key: 'value' });
}
