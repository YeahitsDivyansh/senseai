"use server"; // Enables server-side execution in Next.js

import { db } from "@/lib/prisma"; // Import Prisma ORM for database interactions
import { auth } from "@clerk/nextjs/server"; // Import Clerk authentication for user authentication
import { GoogleGenerativeAI } from "@google/generative-ai"; // Import Google's Generative AI SDK

// Initialize Google Generative AI with API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Function to generate AI-powered industry insights
 * @param {string} industry - The industry to analyze
 * @returns {Promise<Object>} - Returns structured industry insights as a JSON object
 */
export const generateAIInsights = async (industry) => {
  // Define the prompt with clear JSON formatting instructions
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

  // Generate AI response using Gemini model
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text(); // Extract the AI-generated text

  // Clean the response by removing potential markdown formatting
  const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

  return JSON.parse(cleanedText); // Parse the cleaned JSON response and return
};

/**
 * Function to retrieve industry insights for an authenticated user
 * @returns {Promise<Object>} - Returns industry insights from DB or generates new ones if not found
 */
export async function getIndustryInsights() {
  // Authenticate the user using Clerk
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized"); // Throw error if user is not authenticated

  // Fetch the user data from the database along with industry insights
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
    },
  });

  if (!user) throw new Error("User not found"); // Handle case where user does not exist

  // If no existing insights, generate and store them
  if (!user.industryInsight) {
    const insights = await generateAIInsights(user.industry); // Generate AI insights

    // Save the new insights in the database with a next update timestamp (7 days later)
    const industryInsight = await db.industryInsight.create({
      data: {
        industry: user.industry,
        ...insights,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return industryInsight; // Return newly created insights
  }

  return user.industryInsight; // Return existing insights if they exist
}
