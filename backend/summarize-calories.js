const mongoose = require('mongoose');
const uri = "mongodb+srv://calorias:Gf284lZ4GvwFISCs@cluster0.nudj5av.mongodb.net/?appName=Cluster0";

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const entries = db.collection('registro');
  const users = db.collection('users');

  const pipeline = [
    { $unwind: { path: '$meals', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$meals.foods', preserveNullAndEmptyArrays: true } },
    { $group: {
        _id: '$user',
        totalCalories: { $sum: { $ifNull: ['$meals.foods.calories', 0] } },
        entries: { $addToSet: '$_id' }
    }},
    { $project: { _id: 1, totalCalories: 1, entryCount: { $size: '$entries' } } }
  ];

  const results = await entries.aggregate(pipeline).toArray();

  console.log('Usuarios con entradas en DB:', results.length);
  const { Types } = require('mongoose');
  for (const r of results) {
    let user = null;
    // try to resolve r._id as ObjectId if it looks like one
    try {
      if (r._id && Types.ObjectId.isValid(r._id)) {
        user = await users.findOne({ _id: new Types.ObjectId(r._id) });
      }
    } catch (e) {
      // ignore
    }
    // fallback: try to find by email or string id
    if (!user) {
      user = await users.findOne({ email: r._id }) || await users.findOne({ _id: r._id });
    }
    const email = user ? user.email || user.displayName || '<sin-email>' : '<usuario-no-encontrado>';
    console.log('- user:', String(r._id), 'email:', email, 'calorias:', r.totalCalories, 'entradas:', r.entryCount);
  }

  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
