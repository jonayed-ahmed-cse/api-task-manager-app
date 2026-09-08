const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://jonayedahmed05_db_user:Ne86iLsRMryBwrrP@cluster0.eticfst.mongodb.net/taskdb?retryWrites=true&w=majority';

console.log('Connecting...');

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('SUCCESS: MongoDB connected!');
    process.exit(0);
  })
  .catch((err) => {
    console.log('FAILED:', err.message);
    process.exit(1);
  });