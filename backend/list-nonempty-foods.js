const mongoose = require('mongoose');
const uri = "mongodb+srv://calorias:Gf284lZ4GvwFISCs@cluster0.nudj5av.mongodb.net/?appName=Cluster0";

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const entries = db.collection('registro');
  const cursor = entries.find({ 'meals.foods.0': { $exists: true } });
  const arr = await cursor.toArray();
  console.log('Found', arr.length, 'entries with foods');
  for (const d of arr) console.log(JSON.stringify(d, null, 2));
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
