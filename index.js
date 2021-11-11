const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
// firebase token verify setup
const admin = require("firebase-admin");
const e = require("express");

const serviceAccount = JSON.parse(process.env.FIREBASEAUTH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
async function verifyUserToken(req, res, next) {
  if (req.headers?.authorization?.startsWith("Bearer ")) {
    const userToken = req.headers.authorization.split(" ")[1];
    try {
      const decodedUser = await admin.auth().verifyIdToken(userToken);
      req.decodedEmail = decodedUser.email;
    } catch (error) {
      console.log(error);
    }
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
    const productsCollection = database.collection("sunglassCollection");
    app.post("/adduser", async (req, res) => {
      const newUser = req.body;
      const saveUsers = await usersCollection.insertOne(newUser);
      res.send(saveUsers);
    });
    app.put("/makeadmin", verifyUserToken, async (req, res) => {
      const userEmail = req.body.email;
      const reqUserEmail = req.decodedEmail;
      const findUser = await usersCollection.findOne({
        email: reqUserEmail,
      });
      if (findUser.role === "admin") {
        const filter = { email: userEmail };
        const updateDoc = { $set: { role: "admin" } };
        const MakeuserAdmin = await usersCollection.updateOne(
          filter,
          updateDoc
        );
        res.send(MakeuserAdmin);
      } else {
        res.send(401);
      }
    });
    app.get("/getAdmin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const getAdmin = await usersCollection.findOne(query);
      let isAdmin = false;
      if (getAdmin?.role === "admin") {
        isAdmin = true;
      }
      res.send({ admin: isAdmin });
    });
    app.post("/addproducts", async (req, res) => {
      const newProducts = req.body;
      const addedProducts = await productsCollection.insertOne(newProducts);
      res.send(addedProducts);
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
