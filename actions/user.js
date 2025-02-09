"use server"; // Ensures this module runs on the server

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"; // Import authentication service from Clerk
import { generateAIInsights } from "./dashboard";

// /**
//  * Updates user profile and ensures industry insights exist.
//  * @param {Object} data - User profile update data
//  * @returns {Object} Updated user details
//  */
export async function updateUser(data) {
  // Authenticate user
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized"); // Prevents unauthorized access
  }

  // Fetch the user from the database using Clerk userId
  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });

  if (!user) {
    throw new Error("User not found"); // Ensure the user exists in the database
  }

  try {
    // Start a database transaction to update both user and industry insights
    const result = await db.$transaction(
      async (tx) => {
        // Check if the industry insight already exists
        let industryInsight = await tx.industryInsight.findUnique({
          where: {
            industry: data.industry,
          },
        });

        // If industry insight doesn't exist, create a new entry with default values
        if (!industryInsight) {
          const insights = await generateAIInsights(data.industry);

          industryInsight = await db.industryInsight.create({
            data: {
              industry: data.industry,
              ...insights,
              nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
        }

        // Update the user profile with new data
        const updatedUser = await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            industry: data.industry, // Update user's industry
            experience: data.experience, // Update user's experience
            bio: data.bio, // Update user's bio
            skills: data.skills, // Update user's skills
          },
        });

        return { updatedUser, industryInsight }; // Return updated user and industry details
      },
      {
        timeout: 10000, // Set a timeout to avoid long-running transactions
      }
    );

    return { success: true, ...result }; // Return the updated user profile
  } catch (error) {
    console.error("Error updating user and industry:", error.message);
    throw new Error("Failed to update profile " + error.message); // Handle transaction failure
  }
}

// /**
//  * Retrieves the user's onboarding status.
//  * @returns {Object} User's onboarding status
//  */
export async function getUserOnboardingStatus() {
  // Authenticate user
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized"); // Prevent unauthorized access

  // Fetch the user from the database using Clerk userId
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found"); // Ensure the user exists

  try {
    // Retrieve industry field to check onboarding status
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
      select: {
        industry: true, // Fetch only the industry field
      },
    });

    return {
      isOnboarded: !!user?.industry, // Return true if industry is set, false otherwise
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error.message);
    throw new Error("Failed to check onboarding status"); // Handle errors gracefully
  }
}
