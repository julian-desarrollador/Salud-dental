import { MongoClient, type Db } from "mongodb";

const globalForMongo = globalThis as typeof globalThis & {
  consultorioMongo?: Promise<MongoClient>;
};

export async function consultorioDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  const name = process.env.MONGODB_DB;
  if (!uri || !name) {
    throw new Error("Falta configurar la base del consultorio.");
  }
  if (!globalForMongo.consultorioMongo) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    });
    globalForMongo.consultorioMongo = client.connect().catch((error: unknown) => {
      globalForMongo.consultorioMongo = undefined;
      throw error;
    });
  }
  const client = await globalForMongo.consultorioMongo;
  return client.db(name);
}
