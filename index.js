const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb"); //mongodb
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 9998;

//midlewares
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://study-assembles.web.app",
      "https://study-assembles.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

//db set up

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z5rmhar.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//own middlewares
const logger = (req, res, next) => {
  console.log("log:info :", req.method, req.url);
  next();
};

//verify token
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  console.log("Token in middleware:", token);

  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.error("Token verification error:", err);
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

let submissionsCollection;
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    const Collection1 = client.db("AssaignmentCollection").collection("tasks");
    submissionsCollection = client
      .db("AssaignmentCollection")
      .collection("submit");
    app.get("/", (req, res) => {
      res.send("hello world!");
    });
    //*auth related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("user for token", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      };
      res
        .cookie("token", token, { ...cookieOptions, maxAge: 0 })
        .send({ success: true });
    });

    //logout
    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out user", user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    //*Service relatd api
    //post op
    app.post("/tasks", async (req, res) => {
      const task = req.body;
      const doc = {
        userEmail: task.email,
        userName: task.displayName,
        title: task.title,
        marks: task.marks,
        description: task.description,
        thumbnailURL: task.thumbnailURL,
        difficulty: task.difficulty,
        dueDate: task.dueDate,
      };
      const result = await Collection1.insertOne(doc);
      res.send(result);
    });

    //get op

    app.get("/tasks", async (req, res) => {
      console.log("token owner info- : ", req.user);
      const result = await Collection1.find().toArray();
      res.send(result);
    });

    app.get("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      console.log("Fetching assignment with ID:", id); // Log the ID
      const query = { _id: new ObjectId(id) };
      const result = await Collection1.findOne(query);
      res.send(result);
    });
    // POST route for submitting assignments
    app.post("/submit", async (req, res) => {
      const submission = req.body;
      const submissionDoc = {
        assignmentId: submission.assignmentId,
        userEmail: submission.userEmail,
        pdfLink: submission.pdfLink,
        quickNote: submission.quickNote,
        status: "Pending",
        submissionDate: new Date(),
        title: submission.title,
        marks: submission.marks,
        obtained: submission.obtained,
      };
      const result = await submissionsCollection.insertOne(submissionDoc);
      res.send(result);
    });

    app.get("/submit", verifyToken, async (req, res) => {
      const userEmail = req.query.userEmail;
      console.log("token owner info", req.user);
      if (userEmail != req.user.email) {
        return res.status(403).send({ message: "forbidded access" });
      }
      const query = { userEmail: userEmail }; // Filter by userEmail
      const result = await submissionsCollection.find(query).toArray();
      res.send(result);
    });

    //sumit by email
    app.get("/submit/:email", async (req, res) => {
      const userEmail = req.params.email;
      const query = { userEmail };
      const userAssignments = await submissionsCollection.find(query).toArray();
      res.send(userAssignments);
    });

    //delete assaignment
    app.delete("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await Collection1.deleteOne(query);
      res.send(result);
    });

    //update
    app.put("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const task = req.body;
      const doc = {
        $set: {
          userEmail: task.email,
          userName: task.displayName,
          title: task.title,
          marks: task.marks,
          description: task.description,
          difficulty: task.difficulty,
          dueDate: task.dueDate,
        },
      };
      const result = await Collection1.updateOne(filter, doc);
      if (result.modifiedCount > 0) {
        res.status(200).json({ success: true, message: "Update successful" });
      } else {
        res.status(400).json({ success: false, message: "Update failed" });
      }
    });

    //pending assignments
    app.get("/submissions/pending", async (req, res) => {
      const query = { status: "Pending" };
      const pendingAssignments = await submissionsCollection
        .find(query)
        .toArray();
      res.send(pendingAssignments);
    });
    app.get("/submit/:id", logger, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await submissionsCollection.findOne(query);
      res.send(result);
    });

    //update submitted assignment with feedback and obtainded marks
    app.put("/submissions/:id", async (req, res) => {
      const id = req.params.id;
      const { obtained_marks, feedback } = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          obtained_marks: obtained_marks,
          feedback: feedback,
          status: "Completed",
        },
      };
      const result = await submissionsCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Study Assembles running on port ${port}`);
});
