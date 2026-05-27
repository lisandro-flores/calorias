const mongoose = require('mongoose');
const uri = "mongodb+srv://calorias:Gf284lZ4GvwFISCs@cluster0.nudj5av.mongodb.net/?appName=Cluster0";

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const entries = db.collection('registro');
  const doc = await entries.findOne({});
  console.log(JSON.stringify(doc, null, 2));
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
