import express from "express";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const app = express();
app.use(express.json());

// Create a DynamoDB client
const dbClient = new DynamoDBClient({ region: process.env.region });
const docClient = DynamoDBDocumentClient.from(dbClient);

const TABLE_NAME = process.env.DYNAMO_TABLE_NAME;

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("healthy");
});

// DynamoDB CRUD operations
app.get("/items", async (req, res) => {
  try {
    const command = new ScanCommand({ TableName: TABLE_NAME });
    const result = await docClient.send(command);
    res.status(200).json(result.Items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

app.get("/items/:id", async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        itemId: req.params.id,
      },
    };
    const command = new GetCommand(params);
    const result = await docClient.send(command);

    if (!result.Item) {
      res.status(404).json({ error: "Item not found" });
    } else {
      res.status(200).json(result.Item);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

app.put("/items", async (req, res) => {
  try {
    const data = req.body;
    const params = {
      TableName: TABLE_NAME,
      Item: data,
    };
    await docClient.send(new PutCommand(params));
    res.status(201).json({ message: "Item created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

app.put("/items/:id", async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        itemId: req.params.id,
      },
      Item: req.body,
    };
    const command = new PutCommand(params);
    await docClient.send(command);
    res.status(201).json({ message: "Item updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

app.delete("/items/:id", async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        itemId: req.params.id,
      },
    };
    const command = new DeleteCommand(params);
    await docClient.send(command);
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

app.listen(80, () => {
  console.log("App listening on port 80!");
});
