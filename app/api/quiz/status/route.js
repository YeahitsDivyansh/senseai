import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

/**
 * API route to check the status of quiz generation
 * GET /api/quiz/status?quizGenerationId=xxx
 */
export async function GET(request) {
  const startTime = Date.now();
  const requestUrl = request.url;
  console.log(`[API Quiz Status] 🔍 Checking quiz status, URL: ${requestUrl}`);

  try {
    // Authenticate the user
    const authStart = Date.now();
    const { userId: clerkUserId } = await auth();
    const authTime = Date.now() - authStart;

    if (!clerkUserId) {
      console.error("[API Quiz Status] ❌ Unauthorized - no userId");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get quizGenerationId from query parameters
    const { searchParams } = new URL(requestUrl);
    const quizGenerationId = searchParams.get("quizGenerationId");
    console.log(`[API Quiz Status] 📋 quizGenerationId: ${quizGenerationId}`);

    if (!quizGenerationId) {
      return Response.json(
        { error: "quizGenerationId is required" },
        { status: 400 }
      );
    }

    // Find the user in the database
    const dbUserStart = Date.now();
    const user = await db.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });
    const dbUserTime = Date.now() - dbUserStart;

    if (!user) {
      console.error(`[API Quiz Status] ❌ User not found for clerkUserId: ${clerkUserId}`);
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch the quiz generation record
    const dbQuizStart = Date.now();
    const quizGeneration = await db.quizGeneration.findUnique({
      where: { id: quizGenerationId },
      select: {
        id: true,
        status: true,
        questions: true,
        error: true,
        createdAt: true,
        completedAt: true,
        userId: true,
      },
    });
    const dbQuizTime = Date.now() - dbQuizStart;
    console.log(`[API Quiz Status] ⏱️  DB queries: User(${dbUserTime}ms) + Quiz(${dbQuizTime}ms)`);

    if (!quizGeneration) {
      console.error(`[API Quiz Status] ❌ Quiz generation not found: ${quizGenerationId}`);
      return Response.json(
        { error: "Quiz generation not found" },
        { status: 404 }
      );
    }

    // Verify that the quiz belongs to the authenticated user
    if (quizGeneration.userId !== user.id) {
      console.error(`[API Quiz Status] ❌ Forbidden: Quiz ${quizGenerationId} belongs to user ${quizGeneration.userId}, but request from user ${user.id}`);
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const totalTime = Date.now() - startTime;
    console.log(`[API Quiz Status] ✅ Status check completed in ${totalTime}ms - Status: ${quizGeneration.status}`);

    return Response.json({
      success: true,
      quizGeneration: {
        id: quizGeneration.id,
        status: quizGeneration.status,
        questions: quizGeneration.questions,
        error: quizGeneration.error,
        createdAt: quizGeneration.createdAt,
        completedAt: quizGeneration.completedAt,
      },
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[API Quiz Status] ❌ Error after ${totalTime}ms:`, error);
    console.error("[API Quiz Status] ❌ Error stack:", error.stack);
    return Response.json(
      { error: "Failed to check quiz status", details: error.message },
      { status: 500 }
    );
  }
}

