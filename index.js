const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb"); //mongodb

require("dotenv").config();
const app = express();
const port = process.env.PORT || 9998;

//midlewares
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("This is Study Assembles");
});

//db set up

const uri =
  "mongodb+srv://Aesthetic:CC5rGJA3OYr1jToU@cluster0.z5rmhar.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
let submissionsCollection;
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
     const Collection1 = client.db("AssaignmentCollection").collection("tasks");
     submissionsCollection = client
       .db("AssaignmentCollection")
       .collection("submit");

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
      };
      const result = await submissionsCollection.insertOne(submissionDoc);
      res.send(result);
    });

    // get data from submission assignment
    app.get("/submit", async (req, res) => {
      const result = await submissionsCollection.find().toArray();
      res.send(result);
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
