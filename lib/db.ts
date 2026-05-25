import mongooseClient from 'mongoose';

type MongooseClient = typeof mongooseClient;

declare global {
  var mongoose: {
    conn: MongooseClient | null;
    promise: Promise<MongooseClient> | null;
  } | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached?.conn) {
    return cached.conn;
  }

  if (!cached?.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached!.promise = mongooseClient
      .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kva_logistics', opts)
      .then((mongoose) => {
        return mongoose;
      });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export default dbConnect;
