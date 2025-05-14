import { MongoClient, Collection, Document } from "mongodb";
import dotenv from "dotenv";

// Import the User, Story, and Vote types from the storage file
import { UserDocument, StoryDocument, VoteDocument } from "./storage";

// Load environment variables
dotenv.config();

// MongoDB connection string and database name
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri) {
  throw new Error("MONGODB_URI environment variable is not set");
}

if (!dbName) {
  throw new Error("MONGODB_DB environment variable is not set");
}

// Create a MongoDB client
const client = new MongoClient(uri);

// Create an interface for the collections
export interface DatabaseCollections {
  users: Collection<UserDocument>;
  stories: Collection<StoryDocument>;
  votes: Collection<VoteDocument>;
}

// Connect to the MongoDB server
async function connect() {
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB");
    return client.db(dbName);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

// Collections
export async function getCollections(): Promise<DatabaseCollections> {
  const db = await connect();
  return {
    users: db.collection<UserDocument>("users"),
    stories: db.collection<StoryDocument>("stories"),
    votes: db.collection<VoteDocument>("votes"),
  };
}

// Close the connection when the application is shutting down
process.on("SIGINT", async () => {
  await client.close();
  console.log("MongoDB connection closed");
  process.exit(0);
});

export { connect };
