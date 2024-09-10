const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb"); //mongodb

require("dotenv").config();
const app = express();
const port = process.env.PORT || 9999;

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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    const Collection1 = client.db("AssaignmentCollection").collection("tasks");

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
      const assignment = await Collection1.findOne({ _id: new ObjectId(id) });
      res.send(assignment);
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
      try {
        const result = await Collection1.updateOne(filter, doc);
        if (result.modifiedCount > 0) {
          // Check if modified
          res.status(200).json({ success: true });
        } else {
          res.status(400).json({
            success: false,
            message: "No changes were made or failed to update the assignment.",
          });
        }
      } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({
          success: false,
          message: "An error occurred while updating the assignment.",
        });
      }
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
