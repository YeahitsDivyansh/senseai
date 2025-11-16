import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { inngest } from "@/lib/inngest/client";

/**
 * API route to trigger quiz generation via Inngest background job
 * POST /api/quiz/generate
 */
export async function POST() {
  const startTime = Date.now();
  console.log("[API Quiz Generate] 🚀 Starting quiz generation request...");

  try {
    // Authenticate the user
    const authStart = Date.now();
    const { userId: clerkUserId } = await auth();
    const authTime = Date.now() - authStart;
    console.log(`[API Quiz Generate] ⏱️  Auth completed in ${authTime}ms`);

    if (!clerkUserId) {
      console.error("[API Quiz Generate] ❌ Unauthorized - no userId");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the user in the database
    const dbStart = Date.now();
    const user = await db.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });
    const dbTime = Date.now() - dbStart;
    console.log(`[API Quiz Generate] ⏱️  DB user lookup completed in ${dbTime}ms`);

    if (!user) {
      console.error(`[API Quiz Generate] ❌ User not found for clerkUserId: ${clerkUserId}`);
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Create a quiz generation record with PENDING status
    const createStart = Date.now();
    const quizGeneration = await db.quizGeneration.create({
      data: {
        userId: user.id,
        status: "PENDING",
      },
    });
    const createTime = Date.now() - createStart;
    console.log(`[API Quiz Generate] ⏱️  Created quiz generation record in ${createTime}ms, ID: ${quizGeneration.id}`);

    // Trigger the Inngest event to generate the quiz in the background
    const inngestStart = Date.now();
    console.log(`[API Quiz Generate] 📤 Sending Inngest event: quiz/generate with data:`, {
      quizGenerationId: quizGeneration.id,
      userId: user.id,
    });
    console.log(`[API Quiz Generate] 💡 Note: Make sure Inngest dev server is running: npx inngest-cli@latest dev -u http://localhost:3000/api/inngest`);

    try {
      const inngestResult = await inngest.send({
        name: "quiz/generate",
        data: {
          quizGenerationId: quizGeneration.id,
          userId: user.id,
        },
      });

      const inngestTime = Date.now() - inngestStart;
      console.log(`[API Quiz Generate] ⏱️  Inngest event sent in ${inngestTime}ms, result:`, inngestResult);
      console.log(`[API Quiz Generate] ✅ Event ID: ${inngestResult.ids?.[0] || 'N/A'}`);
    } catch (inngestError) {
      const inngestTime = Date.now() - inngestStart;
      console.error(`[API Quiz Generate] ❌ Failed to send Inngest event after ${inngestTime}ms:`, inngestError);
      console.error(`[API Quiz Generate] 💡 This usually means the Inngest dev server is not running.`);
      console.error(`[API Quiz Generate] 💡 Start it with: npx inngest-cli@latest dev -u http://localhost:3000/api/inngest`);
      throw inngestError;
    }

    const totalTime = Date.now() - startTime;
    console.log(`[API Quiz Generate] ✅ Request completed in ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);

    return Response.json({
      success: true,
      quizGenerationId: quizGeneration.id,
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[API Quiz Generate] ❌ Error after ${totalTime}ms:`, error);
    console.error("[API Quiz Generate] ❌ Error stack:", error.stack);
    return Response.json(
      { error: "Failed to start quiz generation", details: error.message },
      { status: 500 }
    );
  }
}

