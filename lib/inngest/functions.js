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
