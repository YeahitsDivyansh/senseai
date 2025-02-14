"use server";
// Enables the server-side execution of this module in Next.js

import { db } from "@/lib/prisma";
// Imports Prisma client instance to interact with the database

import { auth } from "@clerk/nextjs/server";
// Imports authentication function from Clerk to verify users

import { GoogleGenerativeAI } from "@google/generative-ai";
// Imports Google Generative AI SDK for AI-powered resume improvement

import { revalidatePath } from "next/cache";
// Used to refresh cached pages in Next.js after database updates

// Initialize Google Generative AI instance with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// Selects the "gemini-1.5-flash" AI model for text generation

/**
 * Saves or updates a resume in the database for the authenticated user.
 *
 * @param {string} content - The resume content to be saved.
 * @returns {Object} The saved or updated resume record.
 * @throws {Error} If the user is not authenticated or the database operation fails.
 */
export async function saveResume(content) {
  const { userId } = await auth();
  // Authenticate the user and get the Clerk user ID

  if (!userId) throw new Error("Unauthorized");
  // Throw an error if the user is not logged in

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  // Fetch the user from the database using their Clerk user ID

  if (!user) throw new Error("User not found");
  // Throw an error if the user does not exist in the database

  try {
    const resume = await db.resume.upsert({
      where: {
        userId: user.id,
        // Look for an existing resume based on the user's database ID
      },
      update: {
        content,
        // If found, update the resume content
      },
      create: {
        userId: user.id,
        content,
        // If not found, create a new resume entry
      },
    });

    revalidatePath("/resume");
    // Refreshes the "/resume" page cache to reflect changes immediately

    return resume;
    // Returns the saved or updated resume object
  } catch (error) {
    console.error("Error saving resume:", error);
    // Logs the error if something goes wrong

    throw new Error("Failed to save resume");
    // Throws a user-friendly error message
  }
}

/**
 * Retrieves the resume of the authenticated user.
 *
 * @returns {Object|null} The resume object if found, otherwise null.
 * @throws {Error} If the user is not authenticated or does not exist.
 */
export async function getResume() {
  const { userId } = await auth();
  // Authenticate the user and get their Clerk user ID

  if (!userId) throw new Error("Unauthorized");
  // Throw an error if the user is not logged in

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  // Fetch the user from the database using their Clerk user ID

  if (!user) throw new Error("User not found");
  // Throw an error if the user does not exist

  return await db.resume.findUnique({
    where: {
      userId: user.id,
      // Retrieve the resume entry associated with this user
    },
  });
}

/**
 * Uses AI to improve a specific section of the resume.
 *
 * @param {Object} params - Parameters containing the current resume content and type.
 * @param {string} params.current - The existing content to be improved.
 * @param {string} params.type - The type of resume section (e.g., "work experience", "skills").
 * @returns {string} The improved resume section.
 * @throws {Error} If the user is not authenticated or the AI request fails.
 */
export async function improveWithAI({ current, type }) {
  const { userId } = await auth();
  // Authenticate the user and get their Clerk user ID

  if (!userId) throw new Error("Unauthorized");
  // Throw an error if the user is not logged in

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
      // Fetch additional industry insights associated with the user
    },
  });

  if (!user) throw new Error("User not found");
  // Throw an error if the user does not exist

  // Construct a detailed prompt for the AI model to improve the resume content
  const prompt = `
    As an expert resume writer, improve the following ${type} description for a ${user.industry} professional.
    Make it more impactful, quantifiable, and aligned with industry standards.
    Current content: "${current}"

    Requirements:
    1. Use action verbs
    2. Include metrics and results where possible
    3. Highlight relevant technical skills
    4. Keep it concise but detailed
    5. Focus on achievements over responsibilities
    6. Use industry-specific keywords
    
    Format the response as a single paragraph without any additional text or explanations.
  `;

  try {
    const result = await model.generate(prompt);
    // Sends the prompt to the AI model and generates an improved version

    const response = result.response;
    const improvedContent = response.text().trim();
    // Extracts the text response from the AI output and removes extra spaces

    return improvedContent;
    // Returns the enhanced resume content
  } catch (error) {
    console.error("Error improving content:", error);
    // Logs the error if AI processing fails

    throw new Error("Failed to improve content");
    // Throws a user-friendly error message
  }
}
