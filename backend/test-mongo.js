const mongoose = require('mongoose');
const uri = "mongodb+srv://calorias:Gf284lZ4GvwFISCs@cluster0.nudj5av.mongodb.net/?appName=Cluster0";

mongoose.connect(uri)
  .then(() => {
    console.log("✅ Conexión exitosa a MongoDB!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Error de conexión:", err.message);
    process.exit(1);
  });
