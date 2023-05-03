const { FieldValue } = require('firebase-admin/firestore');

module.exports.migrate = async ({ firestore }) => {
  await firestore.collection('data').doc('doc').update({
    field1: FieldValue.delete(),
  });
};
