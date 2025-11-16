"use server"; // Marks this file as a server-side module in Next.js.

// Import required dependencies
import { db } from "@/lib/prisma"; // Import the Prisma database instance for interacting with the database.
import { auth } from "@clerk/nextjs/server"; // Import Clerk authentication for user authentication.
import { GoogleGenerativeAI } from "@google/generative-ai"; // Import Google Generative AI SDK for generating content using Gemini API.

// Initialize the Google Generative AI model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Create an instance of the Google Generative AI using the API key.
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Select the "gemini-1.5-flash" model for generating responses.

/**
 * Function to generate a quiz based on the user's industry and skills.
 * It fetches user details from the database, constructs a prompt, and uses Gemini AI to generate quiz questions.
 */
export async function generateQuiz() {
  const startTime = Date.now();
  console.log("[generateQuiz] 🚀 Starting quiz generation...");

  // Authenticate the user
  const authStart = Date.now();
  const { userId } = await auth(); // Get the authenticated user's ID from Clerk.
  const authTime = Date.now() - authStart;
  console.log(`[generateQuiz] ⏱️  Auth completed in ${authTime}ms`);

  if (!userId) throw new Error("Unauthorized"); // Throw an error if the user is not authenticated.

  // Fetch the user's industry and skills from the database
  const dbStart = Date.now();
  const user = await db.user.findUnique({
    where: { clerkUserId: userId }, // Find the user in the database using Clerk's user ID.
    select: {
      industry: true, // Retrieve the user's industry.
      skills: true, // Retrieve the user's skills.
    },
  });
  const dbTime = Date.now() - dbStart;
  console.log(`[generateQuiz] ⏱️  Database query completed in ${dbTime}ms`);

  if (!user) throw new Error("User not found"); // Throw an error if the user is not found in the database.

  try {
    // Construct the AI prompt for quiz generation
    const promptStart = Date.now();
    const prompt = `
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
    const promptTime = Date.now() - promptStart;
    console.log(
      `[generateQuiz] ⏱️  Prompt construction completed in ${promptTime}ms`
    );

    // Request the AI model to generate quiz content based on the prompt
    const aiStart = Date.now();
    console.log("[generateQuiz] 🤖 Calling Gemini API...");
    const result = await model.generateContent(prompt);
    const aiTime = Date.now() - aiStart;
    console.log(
      `[generateQuiz] ⏱️  Gemini API call completed in ${aiTime}ms (${(
        aiTime / 1000
      ).toFixed(2)}s)`
    );

    const response = result.response; // Extract response from the AI model.
    const textStart = Date.now();
    const text = response.text(); // Get the response as plain text.
    const textTime = Date.now() - textStart;
    console.log(
      `[generateQuiz] ⏱️  Response text extraction completed in ${textTime}ms`
    );

    // Clean the response to remove unwanted characters like ```json
    const parseStart = Date.now();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    // Parse the JSON response to extract quiz questions
    const quiz = JSON.parse(cleanedText);
    const parseTime = Date.now() - parseStart;
    console.log(`[generateQuiz] ⏱️  JSON parsing completed in ${parseTime}ms`);

    const totalTime = Date.now() - startTime;
    console.log(`[generateQuiz] ✅ Quiz generation completed successfully!`);
    console.log(
      `[generateQuiz] 📊 Total execution time: ${totalTime}ms (${(
        totalTime / 1000
      ).toFixed(2)}s)`
    );
    console.log(
      `[generateQuiz] 📈 Time breakdown: Auth(${authTime}ms) + DB(${dbTime}ms) + Prompt(${promptTime}ms) + AI(${aiTime}ms) + Text(${textTime}ms) + Parse(${parseTime}ms)`
    );

    return quiz.questions; // Return the list of generated quiz questions.
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[generateQuiz] ❌ Error after ${totalTime}ms:`, error); // Log any errors.
    throw new Error("Failed to generate quiz questions"); // Throw an error if quiz generation fails.
  }
}

/**
 * Function to save the quiz results after the user completes the quiz.
 * It records the user's answers, calculates the correctness, and generates improvement tips if necessary.
 */
export async function saveQuizResult(questions, answers, score) {
  // Authenticate the user
  const { userId } = await auth(); // Get the authenticated user's ID.
  if (!userId) throw new Error("Unauthorized"); // Throw an error if the user is not authenticated.

  // Fetch the user's record from the database
  const user = await db.user.findUnique({
    where: { clerkUserId: userId }, // Find the user in the database using Clerk's user ID.
  });

  if (!user) throw new Error("User not found"); // Throw an error if the user is not found.

  // Process each question to determine correctness
  const questionResults = questions.map((q, index) => ({
    question: q.question, // Store the question text.
    answer: q.correctAnswer, // Store the correct answer.
    userAnswer: answers[index], // Store the user's answer.
    isCorrect: q.correctAnswer === answers[index], // Check if the user's answer is correct.
    explanation: q.explanation, // Store the explanation for the correct answer.
  }));

  // Filter out incorrect answers for improvement suggestions
  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);

  // Initialize improvement tip as null
  let improvementTip = null;

  // Generate an improvement tip only if there are incorrect answers
  if (wrongAnswers.length > 0) {
    // Construct a text summary of wrong answers
    const wrongQuestionsText = wrongAnswers
      .map(
        (q) =>
          `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
      )
      .join("\n\n");

    // AI prompt to generate improvement suggestions
    const improvementPrompt = `
      The user got the following ${user.industry} technical interview questions wrong:

      ${wrongQuestionsText}

      Based on these mistakes, provide a concise, specific improvement tip.
      Focus on the knowledge gaps revealed by these wrong answers.
      Keep the response under 2 sentences and make it encouraging.
      Don't explicitly mention the mistakes, instead focus on what to learn/practice.
    `;

    try {
      // Request the AI model to generate an improvement tip
      const result = await model.generateContent(improvementPrompt);
      const response = result.response;
      improvementTip = response.text().trim(); // Extract the text response and trim whitespace.
    } catch (error) {
      console.error("Error generating improvement tip:", error); // Log any errors during tip generation.
    }
  }

  try {
    // Save the quiz results to the database
    const assessment = await db.assessment.create({
      data: {
        userId: user.id, // Associate the quiz results with the user.
        quizScore: score, // Store the user's quiz score.
        questions: questionResults, // Store details of all questions and user's responses.
        category: "Technical", // Categorize the quiz under "Technical".
        improvementTip, // Store the AI-generated improvement tip.
      },
    });

    return assessment; // Return the saved assessment record.
  } catch (error) {
    console.error("Error saving quiz result:", error); // Log any errors during database insertion.
    throw new Error("Failed to save quiz result"); // Throw an error if quiz saving fails.
  }
}

export async function getAssessments() {
  // Authenticate the user and retrieve their userId
  const { userId } = await auth();

  // If no userId is found, throw an unauthorized error
  if (!userId) throw new Error("Unauthorized");

  // Find the user in the database using the Clerk user ID
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  // If the user does not exist, throw an error
  if (!user) throw new Error("User not found");

  try {
    // Fetch all assessments associated with the user, ordered by creation date (ascending)
    const assessments = await db.assessment.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Return the retrieved assessments
    return assessments;
  } catch (error) {
    // Log the error for debugging purposes
    console.error("Error fetching assessments:", error);

    // Throw a generic error message to the caller
    throw new Error("Failed to fetch assessments");
  }
}
