import { Inngest } from "inngest"; // Import the Inngest library

// Create an Inngest instance to manage background jobs and scheduled tasks
export const inngest = new Inngest({
  id: "career-coach", // Unique identifier for this Inngest client instance
  name: "Career Coach", // Descriptive name for the app using Inngest

  // API credentials for integrating with external services like Gemini AI
  credentials: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY, // Securely load API key from environment variables
    },
  },
});

/*
  🔹 This instance of Inngest will be used throughout the app to:
     - Schedule tasks (e.g., generating industry insights weekly)
     - Handle background jobs efficiently
     - Integrate with external AI services like Google Gemini
*/

// What is Inngest and Why Are We Using It?
// 🔹 What is Inngest?
// Inngest is a framework for building background jobs, event-driven workflows, and scheduled tasks in modern web applications. It helps in automating tasks asynchronously without blocking the main application.

// 🔹 Why are we using Inngest here?
// Scheduled Execution:

// The function runs automatically every week (via cron job), ensuring insights are always updated.
// Reliable Background Processing:

// Even if the server crashes or restarts, the function execution is guaranteed and can be retried if it fails.
// Step-Based Execution:

// The step.run() function tracks progress and allows automatic retries for failed steps.
// If fetching industries or AI generation fails, it can retry that specific step instead of restarting the whole process.
// Scalability:

// If new industries are added to the database, Inngest will automatically fetch and update insights for them without modifying the code.
// 🔹 General Use Cases of Inngest
// Inngest is commonly used for:

// Scheduled Jobs: Running tasks at specific times (like generating reports every day).
// Event-Driven Workflows: Triggering actions based on events (e.g., sending emails when a user signs up).
// Background Processing: Handling long-running tasks without slowing down the main app (e.g., processing large datasets, AI model inference).
// Retry Mechanism: Ensuring critical tasks (like payments, notifications) don't fail permanently due to temporary errors.
