import express from "express";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const app = express();
app.use(express.json());

// Create a DynamoDB client
const dbClient = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(dbClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

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

/**
 * @typedef {Object} UserDetails
 * @property {string} itemId
 * @property {string} userName
 * @property {string} email
 * @property {string} password
 * @property {FullName} fullName
 * @property {string} phone
 * @property {Address} address
 */

/**
 * @typedef {Object} FullName
 * @property {string} firstName
 * @property {string} lastName
 */

/**
 * @typedef {Object} Address
 * @property {string} street
 * @property {string} zipcode
 * @property {string} city
 */
app.post("/items", async (req, res) => {
  try {
    /** @type {UserDetails} */
    const userData = req.body;
    const params = {
      TableName: TABLE_NAME,
      Item: userData,
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
    let updatedAttributes = {
      userName: req.body.userName,
      email: req.body.email,
      password: req.body.password,
      fullName: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      },
      phone: req.body.phone,
      address: {
        street: req.body.street,
        zipcode: req.body.zipcode,
        city: req.body.city,
      },
    };

    // Construct the update expression dynamically
    let updateExpression = "set";
    let expressionAttributeValues = {};

    const constructUpdateExpression = (obj, prefix = "") => {
      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        const attributeName = prefix ? `${prefix}.${key}` : key;

        if (typeof value === "object" && !Array.isArray(value)) {
          // Handle nested attributes
          constructUpdateExpression(value, attributeName);
        } else {
          // Handle top-level attributes
          updateExpression += ` ${attributeName} = :${attributeName},`;
          expressionAttributeValues[`:${attributeName}`] = value;
        }
      });
    };

    constructUpdateExpression(updatedAttributes);

    // Remove the trailing comma from the update expression
    updateExpression = updateExpression.slice(0, -1);

    const params = {
      TableName: TABLE_NAME,
      Key: {
        itemId: req.params.id,
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: marshall(expressionAttributeValues),
      ReturnValues: "ALL_NEW",
    };

    const command = new UpdateCommand(params);
    await docClient.send(command);

    // Include the updated item in the response
    if (res && res.Attributes) {
      res.status(201).json({
        message: "Item updated successfully",
        updatedItem: res.Attributes,
      });
    } else {
      res.status(201).json({
        message: "Item updated successfully",
        updatedItem: res,
      });
    }
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
