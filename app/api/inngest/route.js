import { inngest } from "@/lib/inngest/client"; // Import the Inngest client instance
import { generateIndustryInsights, generateQuizBackground } from "@/lib/inngest/functions"; // Import Inngest functions
import { serve } from "inngest/next"; // Import the 'serve' function for setting up Inngest API in Next.js

// Create an API route that listens for requests and executes Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest, // Connect the API route to the Inngest client

  functions: [
    generateIndustryInsights, // Register the function to be executed by Inngest
    generateQuizBackground, // Register the quiz generation function
  ],
});

/*
  🔹 This API route is used to:
     - Allow Inngest to trigger the `generateIndustryInsights` function.
     - Handle background job execution in a serverless Next.js environment.
     - Listen for HTTP GET, POST, and PUT requests to interact with Inngest.
     
  🚀 This setup ensures that industry insights are generated and updated automatically!
*/
