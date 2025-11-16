// Import the Google Generative AI SDK for interacting with the Gemini model
import { GoogleGenerativeAI } from "@google/generative-ai";

// Import Prisma database client for querying and updating the database
import { db } from "../prisma";

// Import Inngest for managing background jobs and scheduled tasks
import { inngest } from "./client";

// Initialize Google Generative AI with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Select the specific AI model (Gemini 1.5 Flash) for generating insights
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Model for quiz generation (using gemini-2.5-flash for faster responses)
const quizModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Create a scheduled function using Inngest that runs every Sunday at midnight
export const generateIndustryInsights = inngest.createFunction(
  { name: "Generate Industry Insights" },
  { cron: "0 0 * * 0" }, // Cron schedule for every Sunday at 00:00 (midnight)
  async ({ step }) => {
    // Step 1: Fetch all industries from the database
    const industries = await step.run("Fetch industries", async () => {
      return await db.industryInsight.findMany({
        select: { industry: true }, // Retrieve only the industry names
      });
    });

    // Iterate over each industry to generate insights
    for (const { industry } of industries) {
      // Define the AI prompt to request insights in a structured JSON format
      const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "HIGH" | "MEDIUM" | "LOW",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }
          
          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 5 skills and trends.
        `;

      // Step 2: Call the Gemini AI model to generate industry insights
      const res = await step.ai.wrap(
        "gemini",
        async (p) => {
          return await model.generateContent(p); // AI processes the prompt
        },
        prompt
      );

      // Step 3: Extract and clean the AI-generated JSON response
      const text = res.response.candidates[0].content.parts[0].text || "";
      const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim(); // Remove unnecessary formatting
      const insights = JSON.parse(cleanedText); // Convert text to a JavaScript object

      // Step 4: Update the database with the newly generated insights
      await step.run(`Update ${industry} insights`, async () => {
        await db.industryInsight.update({
          where: { industry }, // Match the industry record in the database
          data: {
            ...insights, // Spread the AI-generated insights into the database entry
            lastUpdated: new Date(), // Set last updated timestamp
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Schedule next update one week later
          },
        });
      });
    }
  }
);

// Create a background function for generating quiz questions
export const generateQuizBackground = inngest.createFunction(
  { name: "Generate Quiz", id: "generate-quiz" },
  { event: "quiz/generate" }, // Listen for quiz/generate events
  async ({ event, step }) => {
    const functionStartTime = Date.now();
    console.log(`[Inngest Quiz] 🚀 Function started at ${new Date().toISOString()}`);
    console.log(`[Inngest Quiz] 📥 Received event:`, JSON.stringify(event, null, 2));

    const { quizGenerationId, userId } = event.data;

    if (!quizGenerationId || !userId) {
      console.error(`[Inngest Quiz] ❌ Missing required data: quizGenerationId=${quizGenerationId}, userId=${userId}`);
      throw new Error("Missing quizGenerationId or userId in event data");
    }

    console.log(`[Inngest Quiz] 📋 Processing quiz generation: ID=${quizGenerationId}, UserID=${userId}`);

    // Step 1: Update status to PROCESSING
    const step1Start = Date.now();
    await step.run("Update status to processing", async () => {
      console.log(`[Inngest Quiz] Step 1: Updating status to PROCESSING...`);
      const updateStart = Date.now();
      await db.quizGeneration.update({
        where: { id: quizGenerationId },
        data: { status: "PROCESSING" },
      });
      const updateTime = Date.now() - updateStart;
      console.log(`[Inngest Quiz] ⏱️  Status updated in ${updateTime}ms`);
    });
    const step1Time = Date.now() - step1Start;
    console.log(`[Inngest Quiz] ⏱️  Step 1 completed in ${step1Time}ms`);

    // Step 2: Fetch user details
    const step2Start = Date.now();
    const user = await step.run("Fetch user details", async () => {
      console.log(`[Inngest Quiz] Step 2: Fetching user details for userId=${userId}...`);
      const fetchStart = Date.now();
      const userData = await db.user.findUnique({
        where: { id: userId },
        select: {
          industry: true,
          skills: true,
        },
      });
      const fetchTime = Date.now() - fetchStart;
      console.log(`[Inngest Quiz] ⏱️  User fetched in ${fetchTime}ms, found:`, !!userData);
      return userData;
    });
    const step2Time = Date.now() - step2Start;
    console.log(`[Inngest Quiz] ⏱️  Step 2 completed in ${step2Time}ms`);

    if (!user) {
      console.error(`[Inngest Quiz] ❌ User not found: userId=${userId}`);
      await step.run("Handle user not found", async () => {
        await db.quizGeneration.update({
          where: { id: quizGenerationId },
          data: {
            status: "FAILED",
            error: "User not found",
          },
        });
      });
      return { success: false, error: "User not found" };
    }

    console.log(`[Inngest Quiz] ✅ User found: industry=${user.industry}, skills=${user.skills?.length || 0} skills`);

    // Step 3: Construct the AI prompt
    const step3Start = Date.now();
    const prompt = await step.run("Construct prompt", async () => {
      console.log(`[Inngest Quiz] Step 3: Constructing prompt...`);
      const promptText = `
      Generate 10 technical interview questions for a ${
        user.industry
      } professional${
        user.skills?.length ? ` with expertise in ${user.skills.join(", ")}` : ""
      }.
      
      Each question should be multiple choice with 4 options.

      Return the response in this JSON format only, no additional text:
      {
        "questions": [
          {
            "question": "string",
            "options": ["string", "string", "string", "string"],
            "correctAnswer": "string",
            "explanation": "string"
          }
        ]
      }
    `;
      console.log(`[Inngest Quiz] ✅ Prompt constructed, length: ${promptText.length} chars`);
      return promptText;
    });
    const step3Time = Date.now() - step3Start;
    console.log(`[Inngest Quiz] ⏱️  Step 3 completed in ${step3Time}ms`);

    // Step 4: Generate quiz using Gemini AI
    let quizQuestions;
    try {
      const step4Start = Date.now();
      quizQuestions = await step.run("Generate quiz with AI", async () => {
        const aiStart = Date.now();
        console.log(`[Inngest Quiz] Step 4: Starting AI generation for quiz ${quizGenerationId}...`);
        console.log(`[Inngest Quiz] 🤖 Calling Gemini API with model: gemini-2.5-flash`);

        try {
          const result = await quizModel.generateContent(prompt);
          const response = result.response;
          const text = response.text();

          // Clean the response to remove unwanted characters like ```json
          const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

          // Parse the JSON response to extract quiz questions
          const quiz = JSON.parse(cleanedText);

          const aiTime = Date.now() - aiStart;
          console.log(`[Inngest Quiz] ✅ AI generation completed in ${aiTime}ms (${(aiTime / 1000).toFixed(2)}s)`);
          console.log(`[Inngest Quiz] 📊 Generated ${quiz.questions?.length || 0} questions`);

          return quiz.questions;
        } catch (aiError) {
          const aiTime = Date.now() - aiStart;
          console.error(`[Inngest Quiz] ❌ AI generation failed after ${aiTime}ms:`, aiError);
          console.error(`[Inngest Quiz] ❌ AI error details:`, {
            message: aiError.message,
            stack: aiError.stack,
            name: aiError.name,
          });
          throw aiError;
        }
      });
      const step4Time = Date.now() - step4Start;
      console.log(`[Inngest Quiz] ⏱️  Step 4 completed in ${step4Time}ms`);

      // Step 5: Save the generated quiz to database
      const step5Start = Date.now();
      await step.run("Save quiz questions", async () => {
        console.log(`[Inngest Quiz] Step 5: Saving quiz questions to database...`);
        const saveStart = Date.now();
        await db.quizGeneration.update({
          where: { id: quizGenerationId },
          data: {
            status: "COMPLETED",
            questions: quizQuestions,
            completedAt: new Date(),
          },
        });
        const saveTime = Date.now() - saveStart;
        console.log(`[Inngest Quiz] ⏱️  Quiz saved in ${saveTime}ms`);
      });
      const step5Time = Date.now() - step5Start;
      console.log(`[Inngest Quiz] ⏱️  Step 5 completed in ${step5Time}ms`);

      const totalTime = Date.now() - functionStartTime;
      console.log(`[Inngest Quiz] ✅ Quiz generation completed successfully for ${quizGenerationId}`);
      console.log(`[Inngest Quiz] 📊 Total function time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
      console.log(`[Inngest Quiz] 📈 Time breakdown: Step1(${step1Time}ms) + Step2(${step2Time}ms) + Step3(${step3Time}ms) + Step4(${step4Time}ms) + Step5(${step5Time}ms)`);

      return { success: true, quizGenerationId, questions: quizQuestions };
    } catch (error) {
      const totalTime = Date.now() - functionStartTime;
      console.error(`[Inngest Quiz] ❌ Quiz generation failed for ${quizGenerationId} after ${totalTime}ms`);
      console.error(`[Inngest Quiz] ❌ Error details:`, {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      // Handle errors and update status
      await step.run("Handle error", async () => {
        console.log(`[Inngest Quiz] Updating status to FAILED...`);
        await db.quizGeneration.update({
          where: { id: quizGenerationId },
          data: {
            status: "FAILED",
            error: error.message || "Failed to generate quiz questions",
          },
        });
        console.log(`[Inngest Quiz] Status updated to FAILED`);
      });

      throw error;
    }
  }
);
