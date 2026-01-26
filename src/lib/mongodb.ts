import { MongoClient, Db } from "mongodb";

// const uri = process.env.MONGO_URI!;
const MONGO_URI =
  'mongodb+srv://Order:Kiet2004%40036946@cluster0.z1ngmle.mongodb.net/orderlist?retryWrites=true&w=majority';

const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!MONGO_URI) {
  throw new Error("Please add MONGO_URI to .env.local");
}

if (process.env.NODE_ENV === "development") {
  // In dev, use a global variable so the value
  // is preserved across module reloads caused by HMR
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGO_URI, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, it's best to not use a global variable.
  client = new MongoClient(MONGO_URI, options);
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db("orderlist");
}
