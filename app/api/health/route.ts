import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();

    const database =
      mongoose.connection.db;

    if (!database) {
      throw new Error(
        "MongoDB connection was not initialized.",
      );
    }

    await database.admin().ping();

    return Response.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "MongoDB health check failed:",
      error,
    );

    return Response.json(
      {
        status: "unhealthy",
        database: "disconnected",
      },
      {
        status: 503,
      },
    );
  }
}