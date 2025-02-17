"use server";

import { db } from "@/lib/prisma"; // Importing Prisma client for database operations
import { auth } from "@clerk/nextjs/server"; // Importing authentication module from Clerk
import { GoogleGenerativeAI } from "@google/generative-ai"; // Importing Google Generative AI library

// Initializing Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Function to generate a cover letter using AI
 * @param {Object} data - Contains job details (jobTitle, companyName, jobDescription)
 * @returns {Object} - The generated cover letter stored in the database
 */
export async function generateCoverLetter(data) {
  // Authenticate user
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Fetch user details from the database
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  // Constructing the AI prompt
  const prompt = `
    Write a professional cover letter for a ${data.jobTitle} position at ${
    data.companyName
  }.
    
    About the candidate:
    - Industry: ${user.industry}
    - Years of Experience: ${user.experience}
    - Skills: ${user.skills?.join(", ")}
    - Professional Background: ${user.bio}
    
    Job Description:
    ${data.jobDescription}
    
    Requirements:
    1. Use a professional, enthusiastic tone
    2. Highlight relevant skills and experience
    3. Show understanding of the company's needs
    4. Keep it concise (max 400 words)
    5. Use proper business letter formatting in markdown
    6. Include specific examples of achievements
    7. Relate candidate's background to job requirements
    
    Format the letter in markdown.
  `;

  try {
    // Generating cover letter using AI model
    const result = await model.generateContent(prompt);
    const content = result.response().text().trim();

    // Storing the generated cover letter in the database
    const coverLetter = await db.coverLetter.create({
      data: {
        content,
        jobDescription: data.jobDescription,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        status: "completed",
        userId: user.id,
      },
    });

    return coverLetter;
  } catch (error) {
    console.error("Error generating cover letter:", error.message);
    throw new Error("Failed to generate cover letter");
  }
}

/**
 * Function to retrieve all cover letters of the authenticated user
 * @returns {Array} - List of cover letters
 */
export async function getCoverLetters() {
  // Authenticate user
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Fetch user details
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  // Retrieve cover letters associated with the user
  return await db.coverLetter.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }, // Sorting by most recent first
  });
}

/**
 * Function to fetch a specific cover letter by ID
 * @param {String} id - Cover letter ID
 * @returns {Object} - The requested cover letter
 */
export async function getCoverLetter(id) {
  // Authenticate user
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Fetch user details
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  // Retrieve the specific cover letter if it belongs to the user
  return await db.coverLetter.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });
}

/**
 * Function to delete a cover letter
 * @param {String} id - Cover letter ID
 * @returns {Object} - The deleted cover letter
 */
export async function deleteCoverLetter(id) {
  // Authenticate user
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Fetch user details
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  // Delete the cover letter if it belongs to the user
  return await db.coverLetter.delete({
    where: {
      id,
      userId: user.id,
    },
  });
}
