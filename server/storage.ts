import { nanoid } from "nanoid";
import { ObjectId } from "mongodb";
import { getCollections } from "./mongodb";

export interface UserDocument {
  _id?: ObjectId;
  username: string;
  email: string;
  password?: string | null;
  provider?: string | null;
  providerId?: string | null;
  avatar?: string | null;
  createdAt: Date;
}

export interface StoryDocument {
  _id?: ObjectId;
  title: string;
  content: string;
  authorId: ObjectId;
  createdAt: Date;
  expiresAt: Date;
  votes: number;
  accessToken: string;
  isPublic: boolean;
}

export interface VoteDocument {
  _id?: ObjectId;
  userId: ObjectId;
  storyId: ObjectId;
  createdAt: Date;
}

export type User = UserDocument;
export type Story = StoryDocument;
export type Vote = VoteDocument;
export type InsertUser = Omit<UserDocument, "_id" | "createdAt">;
export type InsertStory = Pick<StoryDocument, "title" | "content">;
export type InsertVote = Pick<VoteDocument, "userId" | "storyId">;
export type StoryLifetime =
  | "1h"
  | "3h"
  | "6h"
  | "12h"
  | "1d"
  | "3d"
  | "1w"
  | "2w"
  | "1m";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByProvider(
    provider: string,
    providerId: string
  ): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getStory(id: string): Promise<Story | undefined>;
  getStoryByAccessToken(accessToken: string): Promise<Story | undefined>;
  getStoriesByAuthor(authorId: string): Promise<Story[]>;
  getPublicStories(
    sort: "latest" | "popular",
    page: number,
    limit: number
  ): Promise<{ stories: Story[]; total: number }>;
  getRandomStory(): Promise<Story | undefined>;
  getRandomExpiringStory(timeframe: string): Promise<Story | undefined>;
  createStory(
    story: InsertStory,
    authorId: string,
    lifetime: StoryLifetime
  ): Promise<Story>;
  voteStory(storyId: string, userId: string): Promise<void>;
  hasVoted(storyId: string, userId: string): Promise<boolean>;

  getStats(): Promise<{
    total: number;
    available: number;
    expiringToday: number;
    expiringHour: number;
  }>;
}

export function calculateExpiryDate(lifetime: StoryLifetime): Date {
  const now = new Date();

  switch (lifetime) {
    case "1h":
      return new Date(now.getTime() + 60 * 60 * 1000);
    case "3h":
      return new Date(now.getTime() + 3 * 60 * 60 * 1000);
    case "6h":
      return new Date(now.getTime() + 6 * 60 * 60 * 1000);
    case "12h":
      return new Date(now.getTime() + 12 * 60 * 60 * 1000);
    case "1d":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "3d":
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    case "1w":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "2w":
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    case "1m":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
}

export class MongoDBStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const collections = await getCollections();

    console.log("Getting user by ID:", id);

    try {
      let objectId;
      try {
        objectId = new ObjectId(id);
      } catch (error) {
        console.error("Invalid ObjectId format:", id);
        return undefined;
      }

      const user = await collections.users.findOne({ _id: objectId });
      console.log("User found:", !!user);

      return user || undefined;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const collections = await getCollections();
    const user = await collections.users.findOne({ email });
    return user || undefined;
  }

  async getUserByProvider(
    provider: string,
    providerId: string
  ): Promise<User | undefined> {
    const collections = await getCollections();
    const user = await collections.users.findOne({ provider, providerId });
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const collections = await getCollections();
    const now = new Date();

    const userToInsert = {
      ...insertUser,
      createdAt: now,
    };

    const result = await collections.users.insertOne(userToInsert);
    return { ...userToInsert, _id: result.insertedId };
  }

  async getStory(id: string): Promise<Story | undefined> {
    const collections = await getCollections();
    const story = await collections.stories.findOne({ _id: new ObjectId(id) });
    return story || undefined;
  }

  async getStoryByAccessToken(accessToken: string): Promise<Story | undefined> {
    const collections = await getCollections();
    const story = await collections.stories.findOne({ accessToken });
    return story || undefined;
  }

  async getStoriesByAuthor(authorId: string): Promise<Story[]> {
    const collections = await getCollections();

    console.log("Getting stories for author ID:", authorId);

    try {
      let query = {};

      try {
        query = { authorId: new ObjectId(authorId) };
      } catch (err) {
        console.log("Invalid ObjectId format, using raw string:", authorId);
        query = { authorId: authorId };
      }

      console.log("Query for getStoriesByAuthor:", query);
      const stories = await collections.stories.find(query).toArray();
      console.log(`Found ${stories.length} stories for author`);
      return stories;
    } catch (error) {
      console.error("Error getting stories by author:", error);
      return [];
    }
  }

  async getPublicStories(
    sort: "latest" | "popular",
    page: number = 1,
    limit: number = 10
  ): Promise<{ stories: Story[]; total: number }> {
    const collections = await getCollections();
    const now = new Date();

    console.log(
      `Getting public stories: sort=${sort}, page=${page}, limit=${limit}`
    );

    try {
      const query = { isPublic: true, expiresAt: { $gt: now } };

      const total = await collections.stories.countDocuments(query);

      const sortCriteria: any =
        sort === "latest" ? { createdAt: -1 } : { votes: -1 };

      const skip = (page - 1) * limit;
      const stories = await collections.stories
        .find(query)
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .toArray();

      const storiesWithAuthors = await Promise.all(
        stories.map(async (story) => {
          try {
            const authorIdStr =
              story.authorId instanceof ObjectId
                ? story.authorId.toString()
                : String(story.authorId);

            const author = await this.getUser(authorIdStr);

            const storyWithAuthor: any = {
              ...story,
            };

            if (author) {
              storyWithAuthor.author = {
                username: author.username,
                avatar: author.avatar,
              };
            }

            return storyWithAuthor;
          } catch (error) {
            console.error(
              `Error getting author for story ${story._id}:`,
              error
            );
            return story;
          }
        })
      );

      console.log(`Found ${stories.length} public stories`);
      return {
        stories: storiesWithAuthors,
        total,
      };
    } catch (error) {
      console.error("Error getting public stories:", error);
      return { stories: [], total: 0 };
    }
  }

  async getRandomStory(): Promise<Story | undefined> {
    const collections = await getCollections();
    const now = new Date();

    console.log("Getting random story");

    try {
      const publicStories = await collections.stories
        .find({ isPublic: true, expiresAt: { $gt: now } })
        .toArray();

      if (publicStories.length === 0) return undefined;

      const randomIndex = Math.floor(Math.random() * publicStories.length);
      const story = publicStories[randomIndex];

      try {
        const authorIdStr =
          story.authorId instanceof ObjectId
            ? story.authorId.toString()
            : String(story.authorId);

        const author = await this.getUser(authorIdStr);

        const storyWithAuthor = {
          ...story,
        } as any;

        if (author) {
          storyWithAuthor.author = {
            username: author.username,
            avatar: author.avatar,
          };
        }

        return storyWithAuthor;
      } catch (error) {
        console.error(`Error getting author for random story:`, error);
        return story;
      }
    } catch (error) {
      console.error("Error getting random story:", error);
      return undefined;
    }
  }

  async getRandomExpiringStory(timeframe: string): Promise<Story | undefined> {
    const collections = await getCollections();
    const now = new Date();
    let expiryLimit: Date;

    switch (timeframe) {
      case "hour":
        expiryLimit = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case "day":
        expiryLimit = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case "week":
        expiryLimit = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        expiryLimit = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    const expiringStories = await collections.stories
      .find({
        isPublic: true,
        expiresAt: { $gt: now, $lt: expiryLimit },
      })
      .toArray();

    if (expiringStories.length === 0) return undefined;

    const randomIndex = Math.floor(Math.random() * expiringStories.length);
    return expiringStories[randomIndex];
  }

  async createStory(
    insertStory: InsertStory,
    authorId: string,
    lifetime: StoryLifetime
  ): Promise<Story> {
    const collections = await getCollections();
    const now = new Date();
    const expiresAt = calculateExpiryDate(lifetime);
    const accessToken = nanoid(10);

    const storyToInsert = {
      ...insertStory,
      authorId: new ObjectId(authorId),
      createdAt: now,
      expiresAt,
      votes: 0,
      accessToken,
      isPublic: true,
    };

    const result = await collections.stories.insertOne(storyToInsert);
    return { ...storyToInsert, _id: result.insertedId };
  }

  async voteStory(storyId: string, userId: string): Promise<void> {
    const collections = await getCollections();

    console.log("Voting - Story ID:", storyId);
    console.log("Voting - User ID:", userId);

    try {
      let storyObjectId;
      let userObjectId;

      try {
        storyObjectId = new ObjectId(storyId);
        userObjectId = new ObjectId(userId);
      } catch (error) {
        console.error("Invalid ObjectId format:", error);
        throw new Error("Некорректный формат ID для истории или пользователя");
      }

      const story = await this.getStory(storyId);
      if (!story) {
        throw new Error("История не найдена");
      }

      const existingVote = await collections.votes.findOne({
        storyId: storyObjectId,
        userId: userObjectId,
      });

      if (existingVote) {
        console.log("Удаляем существующий голос");
        await collections.votes.deleteOne({ _id: existingVote._id });

        console.log("Уменьшаем счетчик голосов");
        await collections.stories.updateOne(
          { _id: storyObjectId },
          { $inc: { votes: -1 } }
        );

        console.log("Голос успешно отменен");
        return;
      }

      const now = new Date();
      const voteDoc = {
        userId: userObjectId,
        storyId: storyObjectId,
        createdAt: now,
      };

      console.log("Добавляем новый голос:", voteDoc);
      await collections.votes.insertOne(voteDoc);

      console.log("Увеличиваем счетчик голосов");
      await collections.stories.updateOne(
        { _id: storyObjectId },
        { $inc: { votes: 1 } }
      );

      console.log("Голос успешно добавлен");
    } catch (error) {
      console.error("Ошибка при голосовании:", error);
      throw error;
    }
  }

  async hasVoted(storyId: string, userId: string): Promise<boolean> {
    const collections = await getCollections();

    console.log("Checking if user has voted - Story ID:", storyId);
    console.log("Checking if user has voted - User ID:", userId);

    try {
      const vote = await collections.votes.findOne({
        storyId: new ObjectId(storyId),
        userId: new ObjectId(userId),
      });

      console.log("Vote found:", !!vote);
      return !!vote;
    } catch (error) {
      console.error("Error checking if user has voted:", error);
      return false;
    }
  }

  async getStats(): Promise<{
    total: number;
    available: number;
    expiringToday: number;
    expiringHour: number;
  }> {
    const collections = await getCollections();
    const now = new Date();
    const hourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const dayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const total = await collections.stories.countDocuments();

    const available = await collections.stories.countDocuments({
      isPublic: true,
      expiresAt: { $gt: now },
    });

    const expiringToday = await collections.stories.countDocuments({
      isPublic: true,
      expiresAt: { $gt: now, $lt: dayFromNow },
    });

    const expiringHour = await collections.stories.countDocuments({
      isPublic: true,
      expiresAt: { $gt: now, $lt: hourFromNow },
    });

    return {
      total,
      available,
      expiringToday,
      expiringHour,
    };
  }
}

export const storage = new MongoDBStorage();
