import { MongoClient, Collection, Document } from "mongodb";
import dotenv from "dotenv";

import { UserDocument, StoryDocument, VoteDocument } from "./storage";

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri) {
  throw new Error("MONGODB_URI environment variable is not set");
}

if (!dbName) {
  throw new Error("MONGODB_DB environment variable is not set");
}

const client = new MongoClient(uri);

export interface DatabaseCollections {
  users: Collection<UserDocument>;
  stories: Collection<StoryDocument>;
  votes: Collection<VoteDocument>;
}

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

export async function getCollections(): Promise<DatabaseCollections> {
  const db = await connect();
  return {
    users: db.collection<UserDocument>("users"),
    stories: db.collection<StoryDocument>("stories"),
    votes: db.collection<VoteDocument>("votes"),
  };
}

process.on("SIGINT", async () => {
  await client.close();
  console.log("MongoDB connection closed");
  process.exit(0);
});

export { connect };
