import mongoose from "mongoose";
import pkg from '@next/env';
const { loadEnvConfig } = pkg;

loadEnvConfig(process.cwd());

const mongoUri =
  process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error(
    "MONGODB_URI is not configured.",
  );
}

async function repairContentRevisionIndexes() {
  console.log(
    "Connecting to MongoDB...",
  );

  await mongoose.connect(
    mongoUri,
    {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10_000,
    },
  );

  const database =
    mongoose.connection.db;

  if (!database) {
    throw new Error(
      "MongoDB connection was created without a database.",
    );
  }

  const collection =
    database.collection(
      "content_revisions",
    );

  const collections =
    await database
      .listCollections(
        {
          name: "content_revisions",
        },
      )
      .toArray();

  if (collections.length === 0) {
    console.log(
      "content_revisions does not exist yet.",
    );

    console.log(
      "Creating the required indexes...",
    );

    await collection.createIndex(
      {
        entryId: 1,
        createdAt: -1,
      },
      {
        name:
          "entryId_1_createdAt_-1",
      },
    );

    await collection.createIndex(
      {
        entryId: 1,
        revisionNumber: -1,
      },
      {
        name:
          "entryId_1_revisionNumber_-1",
      },
    );

    console.log(
      "Revision indexes created.",
    );

    return;
  }

  const indexes =
    await collection.indexes();

  console.log(
    "Current indexes:",
  );

  for (const index of indexes) {
    console.log(
      `- ${index.name}`,
      index.key,
      index.unique
        ? "(unique)"
        : "",
    );
  }

  for (const index of indexes) {
    const key =
      index.key ?? {};

    const isOldUniqueIndex =
      index.unique === true &&
      key.entryId === 1 &&
      key.revisionNumber === 1 &&
      Object.keys(key).length === 2;

    if (
      isOldUniqueIndex &&
      index.name
    ) {
      console.log(
        `Dropping old unique index: ${index.name}`,
      );

      await collection.dropIndex(
        index.name,
      );
    }
  }

  console.log(
    "Creating non-unique revision indexes...",
  );

  await collection.createIndex(
    {
      entryId: 1,
      createdAt: -1,
    },
    {
      name:
        "entryId_1_createdAt_-1",
    },
  );

  await collection.createIndex(
    {
      entryId: 1,
      revisionNumber: -1,
    },
    {
      name:
        "entryId_1_revisionNumber_-1",
    },
  );

  await collection.createIndex(
    {
      entryId: 1,
      kind: 1,
      createdAt: -1,
    },
    {
      name:
        "entryId_1_kind_1_createdAt_-1",
    },
  );

  const repairedIndexes =
    await collection.indexes();

  console.log(
    "\nFinal indexes:",
  );

  for (
    const index of repairedIndexes
  ) {
    console.log(
      `- ${index.name}`,
      index.key,
      index.unique
        ? "(unique)"
        : "",
    );
  }

  console.log(
    "\nRevision index repair complete.",
  );
}

repairContentRevisionIndexes()
  .catch((error) => {
    console.error(
      "Revision index repair failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });