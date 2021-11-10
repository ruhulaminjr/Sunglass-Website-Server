const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
// firebase token verify setup
const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASEAUTH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
async function verifyUserToken(req, res, next) {
  if (req.headers?.authorization.startsWith("Bearer ")) {
    const userToken = req.headers.authorization.split(" ")[1];
    const decodedUser = await admin.auth().verifyIdToken(userToken);
    req.decodedEmail = decodedUser.email;
  }
  next();
}
// middleware
app.use(cors());
app.use(express.json());
// mongodb config
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bdjvz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// mongodb connect and server api
async function run() {
  try {
    await client.connect();
    const database = client.db("sunglassDb");
    const usersCollection = database.collection("users");
    app.post("/adduser", verifyUserToken, async (req, res) => {
      const newUser = req.body;
      if (req.decodedEmail === req.body.email) {
        const saveUsers = await usersCollection.insertOne(newUser);
        res.send(saveUsers);
      } else {
        res.send(401);
      }
    });
  } finally {
  }
}
run().catch(console.error);

// server api
app.get("/", (req, res) => {
  res.send("Server RuNNing sUcesSfuLLy");
});
app.listen(port, (req, res) => {
  console.log(`Server Running On http://localhost:${port}`);
});
