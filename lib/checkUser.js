import { currentUser } from "@clerk/nextjs/server"; // Importing the currentUser function from Clerk's Next.js SDK
import { db } from "./prisma"; // Importing the Prisma client instance

// Function to check if a user exists in the database or create a new one
export const checkUser = async () => {
  const user = await currentUser(); // Fetch the currently authenticated user from Clerk

  if (!user) return null; // If no user is logged in, return null

  try {
    // Check if the user already exists in the database
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id, // Find user by their Clerk User ID
      },
    });

    if (loggedInUser) return loggedInUser; // If user exists, return the user

    // Construct the user's name from first and last name
    const name = `${user.firstName} ${user.lastName}`;

    // If user does not exist, create a new user record in the database
    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id, // Store Clerk's user ID
        name, // Store user's full name
        imageUrl: user.imageUrl, // Store user's profile image URL
        email: user.emailAddresses[0].emailAddress, // Store the first email address of the user
      },
    });

    return newUser; // Return the newly created user
  } catch (error) {
    console.log(error.message); // Log any errors that occur during the database query
  }
};
